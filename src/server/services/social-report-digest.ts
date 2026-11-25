import { and, count, eq, sql } from "drizzle-orm";
import { getDb } from "@/server/db";
import { socialReports, users } from "@/server/db/schema";
import { logger } from "@/server/logger";
import { notifyUser } from "./notifications";

export const SOCIAL_REPORT_DIGEST_INTERVAL_MS = 60 * 60 * 1000;
export const SOCIAL_REPORT_DIGEST_HREF = "/admin/social-reports";

/**
 * One digest per UTC hour. The notification dedupe index is scoped per user,
 * so a restarted worker cannot send the same hour's digest twice.
 */
export function socialReportDigestDedupeKey(now: Date): string {
  return `social-report-digest:${now.toISOString().slice(0, 13)}`;
}

/** Compact age label for the digest body, e.g. "45m", "3h" or "2d 4h". */
export function formatOpenReportAge(oldest: Date, now: Date): string {
  const minutes = Math.max(
    0,
    Math.floor((now.getTime() - oldest.getTime()) / 60_000),
  );
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  const remainingHours = hours % 24;
  return remainingHours === 0 ? `${days}d` : `${days}d ${remainingHours}h`;
}

export function buildSocialReportDigestBody(
  openCount: number,
  oldest: Date,
  now: Date,
): string {
  const noun = openCount === 1 ? "report" : "reports";
  return `${openCount} open social ${noun}; oldest is ${formatOpenReportAge(
    oldest,
    now,
  )} old.`;
}

type OpenReportSummary = {
  total: number;
  oldest: Date | null;
};

async function summarizeOpenReports(): Promise<OpenReportSummary> {
  const [row] = await getDb()
    .select({
      total: count(),
      oldest: sql<Date | string | null>`min(${socialReports.createdAt})`,
    })
    .from(socialReports)
    .where(eq(socialReports.status, "OPEN"));
  return {
    total: Number(row?.total ?? 0),
    oldest: row?.oldest ? new Date(row.oldest) : null,
  };
}

/**
 * Emails every non-banned admin one grouped notice per UTC hour while reports
 * are open. A notification failure is logged but never thrown: the next hourly
 * run retries.
 */
export async function sendSocialReportDigest(
  now = new Date(),
): Promise<number> {
  const { total, oldest } = await summarizeOpenReports();
  if (total === 0 || !oldest) return 0;

  const db = getDb();
  const admins = await db
    .select({ id: users.id })
    .from(users)
    .where(and(eq(users.role, "ADMIN"), eq(users.isBanned, false)));

  const body = buildSocialReportDigestBody(total, oldest, now);
  const dedupeKey = socialReportDigestDedupeKey(now);
  const results = await Promise.allSettled(
    admins.map((admin) =>
      notifyUser({
        userId: admin.id,
        type: "SYSTEM",
        title: "Open social reports",
        body,
        href: SOCIAL_REPORT_DIGEST_HREF,
        dedupeKey,
        email: true,
      }),
    ),
  );

  const failed = results.filter((result) => result.status === "rejected");
  if (failed.length > 0) {
    logger.warn("Social report digest notification failed", {
      failed: failed.length,
      total,
    });
  }
  return results.filter(
    (result) => result.status === "fulfilled" && result.value,
  ).length;
}
