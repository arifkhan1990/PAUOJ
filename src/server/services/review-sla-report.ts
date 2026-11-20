import { and, eq, isNotNull } from "drizzle-orm";
import { getDb } from "@/server/db";
import { users } from "@/server/db/schema";
import { getEnv } from "@/server/env";
import { logger } from "@/server/logger";
import { sendNotificationEmail } from "@/server/mail";
import { getReviewAnalytics } from "./review-analytics";
import {
  ensureUnsubscribeToken,
  notifyUser,
} from "./notifications";

function weekKey(date: Date): string {
  const value = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
  const day = value.getUTCDay() || 7;
  value.setUTCDate(value.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(value.getUTCFullYear(), 0, 1));
  const week = Math.ceil(
    ((value.getTime() - yearStart.getTime()) / 86_400_000 + 1) / 7,
  );
  return `${value.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

/**
 * Emails each admin one backlog report per ISO week. The in-app SYSTEM
 * notification carries the dedupe key; the email is sent only when that
 * notification is newly created.
 */
export async function sendWeeklyReviewReport(): Promise<number> {
  const db = getDb();
  const admins = await db
    .select({
      id: users.id,
      email: users.email,
      displayName: users.displayName,
    })
    .from(users)
    .where(
      and(
        eq(users.role, "ADMIN"),
        eq(users.isBanned, false),
        eq(users.emailReviews, true),
        isNotNull(users.emailVerifiedAt),
      ),
    )
    .limit(50);
  if (admins.length === 0) return 0;

  const analytics = await getReviewAnalytics(
    { id: admins[0]!.id, role: "ADMIN" },
    "admin",
    "all",
  );
  const backlog =
    analytics.pendingContributions + analytics.pendingContestRequests;
  if (backlog === 0) return 0;

  const key = weekKey(new Date());
  const oldest =
    analytics.oldestPendingHours === null
      ? "none"
      : `${analytics.oldestPendingHours}h`;
  const body = [
    `Pending proposals: ${analytics.pendingContributions} (${analytics.overdueContributions} over 48h)`,
    `Oldest pending proposal: ${oldest}`,
    `Pending contest-use requests: ${analytics.pendingContestRequests}`,
    "",
    "Open the admin review queue to clear the backlog.",
  ].join("\n");
  const appUrl = getEnv().APP_URL.replace(/\/$/, "");
  let sent = 0;

  for (const admin of admins) {
    const created = await notifyUser({
      userId: admin.id,
      type: "SYSTEM",
      title: "Weekly review SLA report",
      body,
      href: "/admin/contributions",
      dedupeKey: `review-sla-report:${key}`,
    });
    if (!created) continue;

    const token = await ensureUnsubscribeToken(admin.id);
    if (!token) continue;
    const delivered = await sendNotificationEmail({
      to: admin.email,
      displayName: admin.displayName,
      subject: "Weekly review SLA report",
      message: body,
      href: `${appUrl}/admin/contributions`,
      unsubscribeUrl: `${appUrl}/unsubscribe?token=${encodeURIComponent(token)}&scope=reviews`,
    });
    if (delivered) sent += 1;
    logger.info("Weekly review report sent", {
      userId: admin.id,
      delivered,
      week: key,
    });
  }
  return sent;
}
