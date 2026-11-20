import { and, eq, inArray, isNull, lte } from "drizzle-orm";
import { getDb } from "@/server/db";
import { notifications, users } from "@/server/db/schema";
import { getEnv } from "@/server/env";
import { logger } from "@/server/logger";
import { sendReviewDigestEmail } from "@/server/mail";
import { ensureUnsubscribeToken } from "./notifications";

const REVIEW_TYPES = ["CONTRIBUTION", "CONTEST_APPROVAL"];
const DIGEST_DELAY_MS = 60_000;
const DIGEST_BATCH = 500;
const MAX_ITEMS = 10;
const FREQUENCY_MS = { HOURLY: 3_600_000, DAILY: 86_400_000 } as const;

type DigestRow = {
  id: string;
  userId: string;
  title: string;
  body: string;
  createdAt: Date;
  email: string;
  displayName: string;
  emailVerifiedAt: Date | null;
  emailReviews: boolean;
  reviewEmailFrequency: "INSTANT" | "HOURLY" | "DAILY";
  unsubscribeToken: string | null;
  role: "USER" | "TEACHER" | "ADMIN";
};

function inboxHref(role: DigestRow["role"]): string {
  if (role === "ADMIN") return "/admin/contributions";
  if (role === "TEACHER") return "/teacher/contributions";
  return "/dashboard/contributions";
}

/**
 * Sends one grouped review email per user. Called by the worker on a short
 * interval so a burst of proposals/approval requests becomes one email.
 */
export async function sendReviewDigests(): Promise<number> {
  const db = getDb();
  const cutoff = new Date(Date.now() - DIGEST_DELAY_MS);
  const rows = await db
    .select({
      id: notifications.id,
      userId: notifications.userId,
      title: notifications.title,
      body: notifications.body,
      createdAt: notifications.createdAt,
      email: users.email,
      displayName: users.displayName,
      emailVerifiedAt: users.emailVerifiedAt,
      emailReviews: users.emailReviews,
      reviewEmailFrequency: users.reviewEmailFrequency,
      unsubscribeToken: users.unsubscribeToken,
      role: users.role,
    })
    .from(notifications)
    .innerJoin(users, eq(users.id, notifications.userId))
    .where(
      and(
        inArray(notifications.type, REVIEW_TYPES),
        inArray(users.reviewEmailFrequency, ["HOURLY", "DAILY"]),
        isNull(notifications.emailedAt),
        lte(notifications.createdAt, cutoff),
      ),
    )
    .orderBy(notifications.createdAt)
    .limit(DIGEST_BATCH);

  const groups = new Map<string, DigestRow[]>();
  for (const row of rows) {
    const group = groups.get(row.userId) ?? [];
    group.push(row);
    groups.set(row.userId, group);
  }

  let sent = 0;
  for (const group of groups.values()) {
    const first = group[0];
    if (!first) continue;
    const ids = group.map((row) => row.id);

    if (!first.emailVerifiedAt || !first.emailReviews) {
      await markEmailed(ids);
      continue;
    }

    const interval =
      first.reviewEmailFrequency === "DAILY"
        ? FREQUENCY_MS.DAILY
        : FREQUENCY_MS.HOURLY;
    if (Date.now() - first.createdAt.getTime() < interval) {
      continue;
    }

    const token = first.unsubscribeToken ?? (await ensureUnsubscribeToken(first.userId));
    if (!token) {
      await markEmailed(ids);
      continue;
    }

    const appUrl = getEnv().APP_URL.replace(/\/$/, "");
    const items = group.slice(0, MAX_ITEMS).map((row) => ({
      title: row.title,
      body:
        row.body.length > 240 ? `${row.body.slice(0, 237)}…` : row.body,
    }));
    if (group.length > MAX_ITEMS) {
      items.push({
        title: `${group.length - MAX_ITEMS} more review items`,
        body: "Open the review queue to see the rest.",
      });
    }

    const delivered = await sendReviewDigestEmail({
      to: first.email,
      displayName: first.displayName,
      items,
      href: `${appUrl}${inboxHref(first.role)}`,
      unsubscribeUrl: `${appUrl}/unsubscribe?token=${encodeURIComponent(token)}&scope=reviews`,
    });
    await markEmailed(ids);
    if (delivered) sent += 1;
  }

  if (sent > 0) {
    logger.info("Review digest emails sent", { count: sent });
  }
  return sent;
}

async function markEmailed(ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  const now = new Date();
  await getDb()
    .update(notifications)
    .set({ emailedAt: now, updatedAt: now })
    .where(inArray(notifications.id, ids));
}
