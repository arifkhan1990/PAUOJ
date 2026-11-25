import { randomUUID } from "node:crypto";
import { and, asc, count, desc, eq, isNull, like, sql } from "drizzle-orm";
import { getDb } from "@/server/db";
import { broadcasts, contests, notifications, users } from "@/server/db/schema";
import { LEARNING_MODULES } from "@/lib/learning/modules";
import { logger } from "@/server/logger";
import { notifyUser } from "./notifications";

export type BroadcastKind = "ANNOUNCEMENT" | "MARKETING";

export type BroadcastInput = {
  source: "MANUAL" | "CONTEST" | "MODULE";
  sourceKey: string;
  title: string;
  body: string;
  href?: string | null;
  createdBy?: string | null;
};

export type BroadcastView = {
  id: string;
  kind: BroadcastKind;
  title: string;
  body: string;
  href: string | null;
  /** Notifications actually created; 0 marks a migration baseline row. */
  recipients: number;
  completedAt: string | null;
  createdAt: string;
};

function kindForSource(source: BroadcastInput["source"]): BroadcastKind {
  return source === "MANUAL" ? "ANNOUNCEMENT" : "MARKETING";
}

/**
 * Creates one broadcast row (unique `sourceKey`) and fans it out to every
 * eligible user. Retrying a failed fan-out is safe: `notifyUser` dedupes on
 * `broadcast:<id>` per user, so only missing rows are created.
 */
export async function publishBroadcast(
  input: BroadcastInput,
): Promise<{ created: boolean; recipients: number }> {
  const db = getDb();
  const [row] = await db
    .insert(broadcasts)
    .values({
      kind: kindForSource(input.source),
      sourceKey: input.sourceKey,
      title: input.title,
      body: input.body,
      href: input.href ?? null,
      createdBy: input.createdBy ?? null,
    })
    .onConflictDoNothing()
    .returning({ id: broadcasts.id });
  if (!row) return { created: false, recipients: 0 };

  const sent = await fanOutBroadcast({
    id: row.id,
    kind: kindForSource(input.source),
    title: input.title,
    body: input.body,
    href: input.href ?? null,
  });
  logger.info("Broadcast published", {
    broadcastId: row.id,
    source: input.source,
    recipients: sent,
  });
  return { created: true, recipients: sent };
}

type FanOutRow = {
  id: string;
  kind: BroadcastKind;
  title: string;
  body: string;
  href: string | null;
};

/**
 * Delivers one stored broadcast. Re-running is safe and only fills missing
 * notifications, which also covers a process that died mid-fan-out.
 */
async function fanOutBroadcast(row: FanOutRow): Promise<number> {
  const db = getDb();
  const type = row.kind === "ANNOUNCEMENT" ? "ANNOUNCEMENT" : "MARKETING";
  const recipients = await db
    .select({ id: users.id })
    .from(users)
    .where(
      type === "MARKETING"
        ? and(eq(users.isBanned, false), eq(users.notifyMarketing, true))
        : eq(users.isBanned, false),
    );

  let sent = 0;
  for (const recipient of recipients) {
    try {
      const created = await notifyUser({
        userId: recipient.id,
        type,
        title: row.title,
        body: row.body,
        href: row.href,
        dedupeKey: `broadcast:${row.id}`,
      });
      if (created) sent += 1;
    } catch (error) {
      logger.warn("Broadcast notification failed", {
        broadcastId: row.id,
        userId: recipient.id,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  await db
    .update(broadcasts)
    .set({ completedAt: new Date() })
    .where(eq(broadcasts.id, row.id));
  return sent;
}

/** Retries fan-outs that never completed (worker restart or delivery error). */
export async function resumePendingBroadcasts(): Promise<number> {
  const rows = await getDb()
    .select({
      id: broadcasts.id,
      kind: broadcasts.kind,
      title: broadcasts.title,
      body: broadcasts.body,
      href: broadcasts.href,
    })
    .from(broadcasts)
    .where(isNull(broadcasts.completedAt))
    .orderBy(asc(broadcasts.createdAt))
    .limit(5);

  let resumed = 0;
  for (const row of rows) {
    await fanOutBroadcast({
      id: row.id,
      kind: row.kind === "ANNOUNCEMENT" ? "ANNOUNCEMENT" : "MARKETING",
      title: row.title,
      body: row.body,
      href: row.href,
    });
    resumed += 1;
  }
  return resumed;
}

export async function publishManualAnnouncement(
  adminId: string,
  input: { title: string; body: string; href?: string | null },
): Promise<{ created: boolean; recipients: number }> {
  return publishBroadcast({
    source: "MANUAL",
    sourceKey: `manual:${randomUUID()}`,
    title: input.title,
    body: input.body,
    href: input.href ?? null,
    createdBy: adminId,
  });
}

export async function listBroadcasts(limit = 20): Promise<BroadcastView[]> {
  const rows = await getDb()
    .select({
      id: broadcasts.id,
      kind: broadcasts.kind,
      title: broadcasts.title,
      body: broadcasts.body,
      href: broadcasts.href,
      completedAt: broadcasts.completedAt,
      createdAt: broadcasts.createdAt,
      recipients: count(notifications.id),
    })
    .from(broadcasts)
    .leftJoin(
      notifications,
      eq(notifications.dedupeKey, sql`'broadcast:' || ${broadcasts.id}`),
    )
    .groupBy(
      broadcasts.id,
      broadcasts.kind,
      broadcasts.title,
      broadcasts.body,
      broadcasts.href,
      broadcasts.completedAt,
      broadcasts.createdAt,
    )
    .orderBy(desc(broadcasts.createdAt))
    .limit(limit);

  return rows.map((row) => ({
    id: row.id,
    kind: row.kind === "ANNOUNCEMENT" ? "ANNOUNCEMENT" : "MARKETING",
    title: row.title,
    body: row.body,
    href: row.href,
    recipients: Number(row.recipients ?? 0),
    completedAt: row.completedAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
  }));
}

/**
 * Announces public contests that have no broadcast marker yet. Existing rows
 * are backfilled by the migration, so only genuinely new/published contests
 * reach this path.
 */
export async function announceNewContests(): Promise<number> {
  const contestRows = await getDb()
    .select({ id: contests.id, title: contests.title, slug: contests.slug })
    .from(contests)
    .where(
      and(
        eq(contests.isPublic, true),
        // Filter in SQL: taking the oldest 20 first would keep skipping the
        // same already-announced rows and never reach a newer backlog.
        sql`not exists (
          select 1 from ${broadcasts} as contest_broadcasts
          where contest_broadcasts.source_key = 'contest:' || ${contests.id}
        )`,
      ),
    )
    .orderBy(asc(contests.createdAt))
    .limit(10);

  let announced = 0;
  for (const contest of contestRows) {
    const result = await publishBroadcast({
      source: "CONTEST",
      sourceKey: `contest:${contest.id}`,
      title: `New contest: ${contest.title}`,
      body: "Registration is open. Open the contest page for the schedule, format and problem set.",
      href: `/contests/${contest.slug}`,
    });
    if (result.created) announced += 1;
  }
  return announced;
}

/**
 * Announces newly shipped LIVE learning modules. Migration 0047 backfills the
 * modules that already existed, so a deploy that adds a module produces one
 * marketing notice instead of re-announcing the catalogue.
 */
export async function announceNewModules(): Promise<number> {
  const db = getDb();
  const markers = await db
    .select({ sourceKey: broadcasts.sourceKey })
    .from(broadcasts)
    .where(like(broadcasts.sourceKey, "module:%"));
  const seen = new Set(markers.map((row) => row.sourceKey));
  let announced = 0;
  for (const definition of LEARNING_MODULES) {
    if (definition.status !== "LIVE") continue;
    if (seen.has(`module:${definition.slug}`)) continue;
    const result = await publishBroadcast({
      source: "MODULE",
      sourceKey: `module:${definition.slug}`,
      title: `New course module: ${definition.title}`,
      body: definition.subtitle || definition.goal,
      href: `/learn/${definition.slug}`,
    });
    if (result.created) announced += 1;
  }
  return announced;
}

export async function runBroadcastSweeps(): Promise<{
  contests: number;
  modules: number;
}> {
  let contestCount = 0;
  let moduleCount = 0;
  try {
    await resumePendingBroadcasts();
  } catch (error) {
    logger.warn("Pending broadcast resume failed", {
      error: error instanceof Error ? error.message : String(error),
    });
  }
  try {
    contestCount = await announceNewContests();
  } catch (error) {
    logger.warn("Contest marketing sweep failed", {
      error: error instanceof Error ? error.message : String(error),
    });
  }
  try {
    moduleCount = await announceNewModules();
  } catch (error) {
    logger.warn("Module marketing sweep failed", {
      error: error instanceof Error ? error.message : String(error),
    });
  }
  return { contests: contestCount, modules: moduleCount };
}
