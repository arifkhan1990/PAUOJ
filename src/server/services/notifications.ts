import { randomBytes } from "node:crypto";
import { and, count, desc, eq, gt, gte, isNull, lte } from "drizzle-orm";
import { getDb } from "@/server/db";
import {
  contestRegistrations,
  contests,
  notifications,
  users,
} from "@/server/db/schema";
import { toOffset, type PaginationInput } from "@/server/api/validation";
import type {
  NotificationItem,
  NotificationPreferences,
  NotificationType,
  UnsubscribeScope,
} from "@/lib/notification-types";
import type { NotificationPreferencesInput } from "@/lib/schemas/notification";
import { getEnv } from "@/server/env";
import { logger } from "@/server/logger";
import { sendNotificationEmail } from "@/server/mail";

export const NOTIFICATIONS_PAGE_SIZE = 20;

type NotifyInput = {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  href?: string | null;
  dedupeKey?: string | null;
  /** Send the email even when this category is not email-enabled by default. */
  email?: boolean;
};

function emailEnabled(
  type: NotificationType,
  user: {
    emailVerdicts: boolean;
    emailContests: boolean;
    emailClarifications: boolean;
  },
): boolean {
  if (type === "VERDICT") return user.emailVerdicts;
  if (type === "CONTEST_START") return user.emailContests;
  if (type === "CLARIFICATION") return user.emailClarifications;
  return false;
}

export async function ensureUnsubscribeToken(
  userId: string,
): Promise<string | null> {
  const db = getDb();
  const [row] = await db
    .select({ token: users.unsubscribeToken })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  if (row?.token) return row.token;

  const token = randomBytes(24).toString("base64url");
  const [updated] = await db
    .update(users)
    .set({ unsubscribeToken: token, updatedAt: new Date() })
    .where(and(eq(users.id, userId), isNull(users.unsubscribeToken)))
    .returning({ token: users.unsubscribeToken });
  if (updated?.token) return updated.token;

  const [existing] = await db
    .select({ token: users.unsubscribeToken })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  return existing?.token ?? null;
}

export async function notifyUser(input: NotifyInput): Promise<boolean> {
  const db = getDb();
  const [created] = await db
    .insert(notifications)
    .values({
      userId: input.userId,
      type: input.type,
      title: input.title,
      body: input.body,
      href: input.href ?? null,
      dedupeKey: input.dedupeKey ?? null,
    })
    .onConflictDoNothing()
    .returning({ id: notifications.id });
  if (!created) return false;

  const isReview =
    input.type === "CONTRIBUTION" || input.type === "CONTEST_APPROVAL";

  const [user] = await db
    .select({
      email: users.email,
      displayName: users.displayName,
      emailVerifiedAt: users.emailVerifiedAt,
      emailVerdicts: users.emailVerdicts,
      emailContests: users.emailContests,
      emailClarifications: users.emailClarifications,
      emailReviews: users.emailReviews,
      reviewEmailFrequency: users.reviewEmailFrequency,
    })
    .from(users)
    .where(eq(users.id, input.userId))
    .limit(1);
  if (!user || !user.emailVerifiedAt) return true;

  if (isReview) {
    const instant =
      user.emailReviews && user.reviewEmailFrequency === "INSTANT";
    if (!instant) return true;
    await db
      .update(notifications)
      .set({ emailedAt: new Date(), updatedAt: new Date() })
      .where(eq(notifications.id, created.id));
  } else if (input.email) {
    await db
      .update(notifications)
      .set({ emailedAt: new Date(), updatedAt: new Date() })
      .where(eq(notifications.id, created.id));
  } else if (!emailEnabled(input.type, user)) {
    return true;
  }

  const token = await ensureUnsubscribeToken(input.userId);
  if (!token) return true;
  const appUrl = getEnv().APP_URL.replace(/\/$/, "");
  const unsubscribeUrl = `${appUrl}/unsubscribe?token=${encodeURIComponent(
    token,
  )}&scope=all`;
  const href = input.href
    ? input.href.startsWith("http")
      ? input.href
      : `${appUrl}${input.href}`
    : null;

  void sendNotificationEmail({
    to: user.email,
    displayName: user.displayName,
    subject: input.title,
    message: input.body,
    href,
    unsubscribeUrl,
  }).catch((error) => {
    logger.warn("Notification email failed", {
      userId: input.userId,
      error: error instanceof Error ? error.message : String(error),
    });
  });
  return true;
}

export async function listNotifications(
  userId: string,
  page: PaginationInput,
): Promise<{ items: NotificationItem[]; total: number }> {
  const db = getDb();
  const [totalRow, rows] = await Promise.all([
    db
      .select({ value: count() })
      .from(notifications)
      .where(eq(notifications.userId, userId)),
    db
      .select({
        id: notifications.id,
        type: notifications.type,
        title: notifications.title,
        body: notifications.body,
        href: notifications.href,
        readAt: notifications.readAt,
        createdAt: notifications.createdAt,
      })
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt))
      .limit(page.pageSize)
      .offset(toOffset(page)),
  ]);

  return {
    total: Number(totalRow[0]?.value ?? 0),
    items: rows.map((row) => ({
      id: row.id,
      type: row.type as NotificationType,
      title: row.title,
      body: row.body,
      href: row.href,
      readAt: row.readAt?.toISOString() ?? null,
      createdAt: row.createdAt.toISOString(),
    })),
  };
}

export async function getUnreadNotificationCount(
  userId: string,
): Promise<number> {
  const [row] = await getDb()
    .select({ value: count() })
    .from(notifications)
    .where(
      and(
        eq(notifications.userId, userId),
        isNull(notifications.readAt),
      ),
    );
  return Number(row?.value ?? 0);
}

export async function markAllNotificationsRead(userId: string): Promise<void> {
  await getDb()
    .update(notifications)
    .set({ readAt: new Date(), updatedAt: new Date() })
    .where(
      and(
        eq(notifications.userId, userId),
        isNull(notifications.readAt),
      ),
    );
}

export async function getNotificationPreferences(
  userId: string,
): Promise<NotificationPreferences | null> {
  const [row] = await getDb()
    .select({
      emailVerdicts: users.emailVerdicts,
      emailContests: users.emailContests,
      emailClarifications: users.emailClarifications,
      emailReviews: users.emailReviews,
      reviewEmailFrequency: users.reviewEmailFrequency,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  return row ?? null;
}

export async function updateNotificationPreferences(
  userId: string,
  input: NotificationPreferencesInput,
): Promise<NotificationPreferences> {
  await getDb()
    .update(users)
    .set({ ...input, updatedAt: new Date() })
    .where(eq(users.id, userId));
  return input;
}

export async function notifyStartingContests(): Promise<number> {
  const db = getDb();
  const now = new Date();
  const windowStart = new Date(now.getTime() - 15 * 60 * 1000);
  const rows = await db
    .select({
      id: contests.id,
      slug: contests.slug,
      title: contests.title,
    })
    .from(contests)
    .where(
      and(
        eq(contests.isPublic, true),
        lte(contests.startAt, now),
        gt(contests.endAt, now),
        gte(contests.startAt, windowStart),
      ),
    );

  let sent = 0;
  for (const contest of rows) {
    const registrations = await db
      .select({ userId: contestRegistrations.userId })
      .from(contestRegistrations)
      .where(eq(contestRegistrations.contestId, contest.id));
    for (const registration of registrations) {
      const created = await notifyUser({
        userId: registration.userId,
        type: "CONTEST_START",
        title: `${contest.title} has started`,
        body: "The contest is live. Open the problem set and start submitting.",
        href: `/contests/${contest.slug}`,
        dedupeKey: `contest-start:${contest.id}`,
      });
      if (created) sent += 1;
    }
  }
  return sent;
}

export async function getUnsubscribeTarget(
  token: string,
): Promise<{ displayName: string } | null> {
  const [row] = await getDb()
    .select({ displayName: users.displayName })
    .from(users)
    .where(eq(users.unsubscribeToken, token))
    .limit(1);
  return row ?? null;
}

export async function unsubscribeByToken(
  token: string,
  scope: UnsubscribeScope,
): Promise<boolean> {
  const [user] = await getDb()
    .select({ id: users.id })
    .from(users)
    .where(eq(users.unsubscribeToken, token))
    .limit(1);
  if (!user) return false;

  const values =
    scope === "all"
      ? {
          emailVerdicts: false,
          emailContests: false,
          emailClarifications: false,
          emailReviews: false,
        }
      : scope === "verdicts"
        ? { emailVerdicts: false }
        : scope === "contests"
          ? { emailContests: false }
          : scope === "reviews"
            ? { emailReviews: false }
            : { emailClarifications: false };
  await getDb()
    .update(users)
    .set({ ...values, updatedAt: new Date() })
    .where(eq(users.id, user.id));
  logger.info("Email notifications unsubscribed", {
    userId: user.id,
    scope,
  });
  return true;
}
