import { randomBytes, randomUUID } from "node:crypto";
import {
  and,
  count,
  desc,
  eq,
  gt,
  gte,
  inArray,
  isNull,
  lte,
} from "drizzle-orm";
import { getDb } from "@/server/db";
import {
  contestRegistrations,
  contests,
  notifications,
  users,
} from "@/server/db/schema";
import { toOffset, type PaginationInput } from "@/server/api/validation";
import {
  NOTICE_NOTIFICATION_TYPES,
  type NotificationFilter,
  type NotificationItem,
  type NotificationPreferences,
  type NotificationType,
} from "@/lib/notification-types";
import type { NotificationPreferencesInput } from "@/lib/schemas/notification";
import { getEnv } from "@/server/env";
import { logger } from "@/server/logger";
import {
  enqueueNotificationEmail,
  requestEmailFlush,
} from "./email-outbox";
import { sendPushToUser } from "./web-push";
import { safeInternalHref } from "@/lib/safe-internal-href";
import {
  emailCategoryForNotification,
  emailEnabled,
} from "./notification-email-policy";

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
  /**
   * Welcome mail goes to the address the user just registered with, before it
   * is verified. Every other category keeps the verified-address rule.
   */
  allowUnverifiedEmail?: boolean;
  /** Email-only delivery: no in-app row, used when in-app marketing is off. */
  inApp?: boolean;
  /** Stable dedupe for an email that has no notification row. */
  emailDedupeKey?: string;
};

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
  const [user] = await db
    .select({
      email: users.email,
      displayName: users.displayName,
      emailVerifiedAt: users.emailVerifiedAt,
      emailVerdicts: users.emailVerdicts,
      emailContests: users.emailContests,
      emailClarifications: users.emailClarifications,
      emailReviews: users.emailReviews,
      emailAccount: users.emailAccount,
      emailLearning: users.emailLearning,
      emailAchievements: users.emailAchievements,
      emailAnnouncements: users.emailAnnouncements,
      emailMarketing: users.emailMarketing,
      emailDiscussions: users.emailDiscussions,
      emailMessages: users.emailMessages,
      emailFollows: users.emailFollows,
      notifyMessages: users.notifyMessages,
      notifyFollows: users.notifyFollows,
      reviewEmailFrequency: users.reviewEmailFrequency,
    })
    .from(users)
    .where(eq(users.id, input.userId))
    .limit(1);
  if (!user) return false;

  const inApp = input.inApp !== false;
  const isReview =
    input.type === "CONTRIBUTION" || input.type === "CONTEST_APPROVAL";
  const verified = Boolean(user.emailVerifiedAt) || Boolean(input.allowUnverifiedEmail);

  let wantsEmail = false;
  if (verified) {
    if (isReview) {
      wantsEmail =
        user.emailReviews && user.reviewEmailFrequency === "INSTANT";
    } else if (input.email) {
      wantsEmail = true;
    } else {
      wantsEmail = emailEnabled(input.type, user);
    }
  }

  type EmailPayload = {
    toEmail: string;
    displayName: string;
    subject: string;
    body: string;
    href: string | null;
    unsubscribeUrl: string;
  };
  let emailPayload: EmailPayload | null = null;
  let emailDedupeKey: string | null = null;

  if (wantsEmail) {
    const token = await ensureUnsubscribeToken(input.userId);
    if (token) {
      const appUrl = getEnv().APP_URL.replace(/\/$/, "");
      const category = emailCategoryForNotification(input.type);
      const scope = category ?? "all";
      const href = input.href
        ? input.href.startsWith("http")
          ? input.href
          : `${appUrl}${input.href}`
        : null;
      emailPayload = {
        toEmail: user.email,
        displayName: user.displayName,
        subject: input.title,
        body: input.body,
        href,
        unsubscribeUrl: `${appUrl}/unsubscribe?token=${encodeURIComponent(
          token,
        )}&scope=${scope}`,
      };
      if (!inApp) {
        emailDedupeKey = `email-only:${input.userId}:${
          input.emailDedupeKey ?? input.dedupeKey ?? randomUUID()
        }`;
      }
    }
  }

  const notificationId = inApp ? randomUUID() : null;
  let createdNotification = false;
  let queuedEmail = false;
  const emailForTransaction = emailPayload;

  await db.transaction(async (tx) => {
    if (inApp) {
      const [created] = await tx
        .insert(notifications)
        .values({
          id: notificationId!,
          userId: input.userId,
          type: input.type,
          title: input.title,
          body: input.body,
          href: input.href ?? null,
          dedupeKey: input.dedupeKey ?? null,
        })
        .onConflictDoNothing()
        .returning({ id: notifications.id });
      if (!created) return;
      createdNotification = true;

      const markEmailed = Boolean(emailForTransaction) &&
        (input.email || (isReview && user.reviewEmailFrequency === "INSTANT"));
      if (markEmailed) {
        await tx
          .update(notifications)
          .set({ emailedAt: new Date(), updatedAt: new Date() })
          .where(eq(notifications.id, created.id));
      }
      if (emailForTransaction) {
        queuedEmail = await enqueueNotificationEmail(
          {
            userId: input.userId,
            ...emailForTransaction,
            dedupeKey: `notification:${created.id}`,
          },
          tx,
          { flush: false },
        );
      }
      return;
    }

    if (emailForTransaction && emailDedupeKey) {
      queuedEmail = await enqueueNotificationEmail(
        {
          userId: input.userId,
          ...emailForTransaction,
          dedupeKey: emailDedupeKey,
        },
        tx,
        { flush: false },
      );
    }
  });

  if (inApp && !createdNotification) return false;
  if (createdNotification) {
    void sendPushToUser(input.userId, {
      type: input.type,
      title: input.title,
      body: input.body,
      href: input.href,
    }).catch((error) => {
      logger.warn("Push notification dispatch failed", {
        userId: input.userId,
        error: error instanceof Error ? error.message : String(error),
      });
    });
  }
  if (queuedEmail) requestEmailFlush();
  return inApp ? createdNotification : queuedEmail;
}

function notificationFilterWhere(
  userId: string,
  filter: NotificationFilter,
) {
  const owned = eq(notifications.userId, userId);
  if (filter === "UNREAD") return and(owned, isNull(notifications.readAt));
  if (filter === "NOTICE") {
    return and(owned, inArray(notifications.type, [...NOTICE_NOTIFICATION_TYPES]));
  }
  return owned;
}

export async function listNotifications(
  userId: string,
  page: PaginationInput,
  filter: NotificationFilter = "ALL",
): Promise<{ items: NotificationItem[]; total: number }> {
  const db = getDb();
  const where = notificationFilterWhere(userId, filter);
  const [totalRow, rows] = await Promise.all([
    db.select({ value: count() }).from(notifications).where(where),
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
      .where(where)
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
      // Defense in depth: even admin-authored hrefs render only same-origin paths.
      href: safeInternalHref(row.href),
      readAt: row.readAt?.toISOString() ?? null,
      createdAt: row.createdAt.toISOString(),
    })),
  };
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
      emailAccount: users.emailAccount,
      emailLearning: users.emailLearning,
      emailAchievements: users.emailAchievements,
      emailAnnouncements: users.emailAnnouncements,
      emailMarketing: users.emailMarketing,
      emailDiscussions: users.emailDiscussions,
      emailMessages: users.emailMessages,
      emailFollows: users.emailFollows,
      notifyMessages: users.notifyMessages,
      notifyFollows: users.notifyFollows,
      notifyMarketing: users.notifyMarketing,
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

export { getUnsubscribeTarget, unsubscribeByToken } from "./notification-unsubscribe";
export {
  getUnreadNotificationCount,
  markAllNotificationsRead,
  markNotificationRead,
} from "./notification-read";
