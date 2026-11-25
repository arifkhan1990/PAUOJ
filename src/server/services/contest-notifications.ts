import { and, eq, gt, gte, lte } from "drizzle-orm";
import { getDb } from "@/server/db";
import {
  contestRatingChanges,
  contestRegistrations,
  contests,
  users,
} from "@/server/db/schema";
import { formatDhakaDateTime } from "@/lib/utils";
import { logger } from "@/server/logger";
import { notifyUser } from "./notifications";

/** Reminder lead time and the sweep tolerance around it (25..35 minutes out). */
const REMINDER_LEAD_MINUTES = 30;
const REMINDER_TOLERANCE_MINUTES = 5;

const MINUTE_MS = 60_000;

/** The contest fields every contest notification needs. */
export type ContestNotice = {
  id: string;
  slug: string;
  title: string;
  startAt: Date;
};

export type NotificationMessage = { title: string; body: string };

/**
 * Contests whose start time falls in [now+25m, now+35m] get their 30-minute
 * reminder. The tolerance keeps the sweep safe when the worker ticks late.
 */
export function contestReminderWindow(now: Date): { from: Date; to: Date } {
  const lead = REMINDER_LEAD_MINUTES * MINUTE_MS;
  const tolerance = REMINDER_TOLERANCE_MINUTES * MINUTE_MS;
  return {
    from: new Date(now.getTime() + lead - tolerance),
    to: new Date(now.getTime() + lead + tolerance),
  };
}

export function contestRegistrationDedupeKey(contestId: string): string {
  return `contest-registration:${contestId}`;
}

export function contestReminderDedupeKey(contestId: string): string {
  return `contest-reminder-30:${contestId}`;
}

export function contestResultDedupeKey(contestId: string): string {
  return `contest-result:${contestId}`;
}

/** Rating deltas read as "+12", "0" or "-8" in notification bodies. */
export function formatRatingDelta(delta: number): string {
  return delta > 0 ? `+${delta}` : String(delta);
}

export function contestRegistrationMessage(
  contest: ContestNotice,
): NotificationMessage {
  return {
    title: `Registered for ${contest.title}`,
    body: `You are registered for ${contest.title}. It starts ${formatDhakaDateTime(
      contest.startAt,
    )}.`,
  };
}

export function contestReminderMessage(
  contest: ContestNotice,
): NotificationMessage {
  return {
    title: `Starts in 30 minutes: ${contest.title}`,
    body: `${contest.title} starts ${formatDhakaDateTime(
      contest.startAt,
    )}. Open the contest page to be ready.`,
  };
}

export function contestResultMessage(input: {
  contestTitle: string;
  rank: number;
  oldRating: number;
  newRating: number;
  delta: number;
}): NotificationMessage {
  return {
    title: `Final results: ${input.contestTitle}`,
    body: `You finished at rank #${input.rank}. Rating: ${input.oldRating} → ${
      input.newRating
    } (${formatRatingDelta(input.delta)}).`,
  };
}

/** Standings message for participants with no rating change to report. */
export function contestFallbackResultMessage(
  contestTitle: string,
): NotificationMessage {
  return {
    title: `Final standings: ${contestTitle}`,
    body: "The contest is complete. Open the final standings to see the results.",
  };
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

/**
 * Confirmation for one new registration. The per-contest dedupe key keeps
 * idempotent re-registrations silent.
 */
export async function notifyContestRegistration(
  userId: string,
  contest: ContestNotice,
): Promise<boolean> {
  const message = contestRegistrationMessage(contest);
  return notifyUser({
    userId,
    type: "CONTEST_REGISTRATION",
    title: message.title,
    body: message.body,
    href: `/contests/${contest.slug}`,
    dedupeKey: contestRegistrationDedupeKey(contest.id),
  });
}

/** Same as above but never lets a mail/notification failure break registration. */
export async function notifyContestRegistrationSafe(
  userId: string,
  contest: ContestNotice,
): Promise<boolean> {
  try {
    return await notifyContestRegistration(userId, contest);
  } catch (error) {
    logger.warn("Contest registration notification failed", {
      userId,
      contestId: contest.id,
      error: errorMessage(error),
    });
    return false;
  }
}

/**
 * Sweep for contests starting in ~30 minutes. Returns the number of newly
 * created notifications; the dedupe key makes overlapping sweeps no-ops.
 */
export async function notifyContestReminders30(
  now: Date = new Date(),
): Promise<number> {
  const db = getDb();
  const { from, to } = contestReminderWindow(now);
  const rows = await db
    .select({
      id: contests.id,
      slug: contests.slug,
      title: contests.title,
      startAt: contests.startAt,
    })
    .from(contests)
    .where(
      and(
        eq(contests.isPublic, true),
        gte(contests.startAt, from),
        lte(contests.startAt, to),
        gt(contests.endAt, now),
      ),
    );

  let sent = 0;
  for (const contest of rows) {
    const registrations = await db
      .select({ userId: contestRegistrations.userId })
      .from(contestRegistrations)
      .where(eq(contestRegistrations.contestId, contest.id));
    const message = contestReminderMessage(contest);
    for (const registration of registrations) {
      const created = await notifyUser({
        userId: registration.userId,
        type: "CONTEST_REMINDER",
        title: message.title,
        body: message.body,
        href: `/contests/${contest.slug}`,
        dedupeKey: contestReminderDedupeKey(contest.id),
      });
      if (created) sent += 1;
    }
  }
  return sent;
}

/**
 * Final standings for every registered, non-banned participant. Participants
 * with a rating change get rank and movement; the rest (GROUP contests, unrated
 * contests, no rated field entry) get the generic standings message. Called
 * after the rating transaction commits, so a notification failure can never
 * roll the finalization back.
 */
export async function notifyContestResults(
  contestId: string,
): Promise<number> {
  try {
    return await sendContestResults(contestId);
  } catch (error) {
    logger.warn("Contest result notification failed", {
      contestId,
      error: errorMessage(error),
    });
    return 0;
  }
}

async function sendContestResults(contestId: string): Promise<number> {
  const db = getDb();
  const [contest] = await db
    .select({
      slug: contests.slug,
      title: contests.title,
    })
    .from(contests)
    .where(eq(contests.id, contestId))
    .limit(1);
  if (!contest) return 0;

  const [changes, participants] = await Promise.all([
    db
      .select({
        userId: contestRatingChanges.userId,
        rank: contestRatingChanges.rank,
        oldRating: contestRatingChanges.oldRating,
        newRating: contestRatingChanges.newRating,
        delta: contestRatingChanges.delta,
      })
      .from(contestRatingChanges)
      .where(eq(contestRatingChanges.contestId, contestId)),
    db
      .select({ userId: contestRegistrations.userId })
      .from(contestRegistrations)
      .innerJoin(users, eq(users.id, contestRegistrations.userId))
      .where(
        and(
          eq(contestRegistrations.contestId, contestId),
          eq(users.isBanned, false),
        ),
      ),
  ]);

  const changesByUser = new Map(
    changes.map((change) => [change.userId, change]),
  );
  const href = `/contests/${contest.slug}`;
  const dedupeKey = contestResultDedupeKey(contestId);
  const notified = new Set<string>();
  let sent = 0;

  for (const participant of participants) {
    if (notified.has(participant.userId)) continue;
    notified.add(participant.userId);

    const change = changesByUser.get(participant.userId);
    const message = change
      ? contestResultMessage({
          contestTitle: contest.title,
          rank: change.rank,
          oldRating: change.oldRating,
          newRating: change.newRating,
          delta: change.delta,
        })
      : contestFallbackResultMessage(contest.title);

    const created = await notifyUser({
      userId: participant.userId,
      type: "CONTEST_RESULT",
      title: message.title,
      body: message.body,
      href,
      dedupeKey,
    });
    if (created) sent += 1;
  }
  return sent;
}
