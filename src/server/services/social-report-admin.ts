import { and, count, desc, eq, type SQL } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { getDb } from "@/server/db";
import { auditLogs, socialReports, users } from "@/server/db/schema";
import { errors } from "@/server/api/errors";
import type {
  SocialReportItem,
  SocialReportKind,
  SocialReportPage,
  SocialReportReason,
  SocialReportStatus,
} from "@/lib/social-report-types";
import { logger } from "@/server/logger";
import { isUuid } from "./message-helpers";
import { notifyUser } from "./notifications";

export const SOCIAL_REPORT_PAGE_SIZE = 20;
const MAX_SOCIAL_REPORT_PAGE = 10_000;

export type SocialReportStatusFilter =
  | "open"
  | "resolved"
  | "dismissed"
  | "all";

const reporterUser = alias(users, "social_report_reporter");
const targetUser = alias(users, "social_report_target");

const reportSelection = {
  id: socialReports.id,
  kind: socialReports.kind,
  reason: socialReports.reason,
  status: socialReports.status,
  details: socialReports.details,
  excerpt: socialReports.excerpt,
  conversationId: socialReports.conversationId,
  messageId: socialReports.messageId,
  createdAt: socialReports.createdAt,
  resolvedAt: socialReports.resolvedAt,
  resolutionNote: socialReports.resolutionNote,
  reporterUsername: reporterUser.username,
  reporterDisplayName: reporterUser.displayName,
  targetUsername: targetUser.username,
  targetDisplayName: targetUser.displayName,
};

type ReportRow = {
  id: string;
  kind: string;
  reason: string;
  status: string;
  details: string | null;
  excerpt: string | null;
  conversationId: string | null;
  messageId: string | null;
  createdAt: Date;
  resolvedAt: Date | null;
  resolutionNote: string | null;
  reporterUsername: string;
  reporterDisplayName: string;
  targetUsername: string;
  targetDisplayName: string;
};

function mapReportRow(row: ReportRow): SocialReportItem {
  return {
    id: row.id,
    kind: row.kind as SocialReportKind,
    reason: row.reason as SocialReportReason,
    status: row.status as SocialReportStatus,
    details: row.details,
    excerpt: row.excerpt,
    conversationId: row.conversationId,
    messageId: row.messageId,
    createdAt: row.createdAt.toISOString(),
    resolvedAt: row.resolvedAt?.toISOString() ?? null,
    resolutionNote: row.resolutionNote,
    reporter: {
      username: row.reporterUsername,
      displayName: row.reporterDisplayName,
    },
    target: {
      username: row.targetUsername,
      displayName: row.targetDisplayName,
    },
  };
}

function statusFilter(status: SocialReportStatusFilter): SQL | undefined {
  if (status === "all") return undefined;
  const mapped: SocialReportStatus =
    status === "open" ? "OPEN" : status === "resolved" ? "RESOLVED" : "DISMISSED";
  return eq(socialReports.status, mapped);
}

function clampReportPage(page: number): number {
  if (!Number.isFinite(page)) return 1;
  return Math.min(
    MAX_SOCIAL_REPORT_PAGE,
    Math.max(1, Math.trunc(page)),
  );
}

export async function listSocialReports({
  status = "open",
  page = 1,
}: {
  status?: SocialReportStatusFilter;
  page?: number;
} = {}): Promise<SocialReportPage> {
  const safePage = clampReportPage(page);
  const filter = statusFilter(status);
  const db = getDb();
  const [rows, totals] = await Promise.all([
    db
      .select(reportSelection)
      .from(socialReports)
      .innerJoin(reporterUser, eq(reporterUser.id, socialReports.reporterId))
      .innerJoin(targetUser, eq(targetUser.id, socialReports.targetUserId))
      .where(filter)
      .orderBy(desc(socialReports.createdAt), desc(socialReports.id))
      .limit(SOCIAL_REPORT_PAGE_SIZE)
      .offset((safePage - 1) * SOCIAL_REPORT_PAGE_SIZE),
    db.select({ value: count() }).from(socialReports).where(filter),
  ]);
  const total = Number(totals[0]?.value ?? 0);

  return {
    items: rows.map(mapReportRow),
    total,
    page: safePage,
    pageSize: SOCIAL_REPORT_PAGE_SIZE,
    totalPages: Math.max(1, Math.ceil(total / SOCIAL_REPORT_PAGE_SIZE)),
  };
}

async function findReportById(reportId: string): Promise<SocialReportItem | null> {
  const [row] = await getDb()
    .select(reportSelection)
    .from(socialReports)
    .innerJoin(reporterUser, eq(reporterUser.id, socialReports.reporterId))
    .innerJoin(targetUser, eq(targetUser.id, socialReports.targetUserId))
    .where(eq(socialReports.id, reportId))
    .limit(1);
  return row ? mapReportRow(row) : null;
}

/** A resolved/dismissed notice is best-effort; queue or mail failures only log. */
async function notifyReporterOfResolution(
  reporterId: string,
  reportId: string,
  status: "RESOLVED" | "DISMISSED",
): Promise<void> {
  try {
    await notifyUser({
      userId: reporterId,
      type: "SYSTEM",
      title: "Your report was reviewed",
      body:
        status === "RESOLVED"
          ? "Your report was reviewed and resolved."
          : "Your report was reviewed and dismissed.",
      href: "/notifications",
      dedupeKey: `social-report-result:${reportId}`,
    });
  } catch (error) {
    logger.warn("Social report resolution notification failed", {
      reportId,
      userId: reporterId,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

export async function resolveSocialReport(
  adminId: string,
  reportId: string,
  input: { status: "RESOLVED" | "DISMISSED"; note?: string },
): Promise<SocialReportItem> {
  if (!isUuid(reportId)) throw errors.notFound("Report not found.");

  const db = getDb();
  const [existing] = await db
    .select({
      id: socialReports.id,
      status: socialReports.status,
      reporterId: socialReports.reporterId,
    })
    .from(socialReports)
    .where(eq(socialReports.id, reportId))
    .limit(1);
  if (!existing) throw errors.notFound("Report not found.");
  if (existing.status !== "OPEN") {
    throw errors.conflict("This report has already been reviewed.");
  }

  const now = new Date();
  const trimmedNote = input.note?.trim();
  const note = trimmedNote && trimmedNote.length > 0 ? trimmedNote : null;
  const updated = await db.transaction(async (tx) => {
    const [row] = await tx
      .update(socialReports)
      .set({
        status: input.status,
        resolvedById: adminId,
        resolvedAt: now,
        resolutionNote: note,
        updatedAt: now,
      })
      .where(
        and(
          eq(socialReports.id, reportId),
          eq(socialReports.status, "OPEN"),
        ),
      )
      .returning({ id: socialReports.id });
    if (!row) return false;
    await tx.insert(auditLogs).values({
      actorId: adminId,
      action: "social.report.resolve",
      entityType: "social_report",
      entityId: reportId,
      metadata: { status: input.status },
    });
    return true;
  });
  if (!updated) throw errors.conflict("This report has already been reviewed.");

  await notifyReporterOfResolution(
    existing.reporterId,
    reportId,
    input.status,
  );

  const item = await findReportById(reportId);
  if (!item) throw errors.notFound("Report not found.");
  return item;
}
