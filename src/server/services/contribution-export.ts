import { and, desc, eq, gte } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { getDb } from "@/server/db";
import { problemContributions, problems, users } from "@/server/db/schema";
import type { ProblemContributionKind } from "@/lib/contribution-types";
import { toCsv } from "@/lib/csv";
import type { ReviewAnalyticsRange } from "./review-analytics";
import type { SafeUser } from "@/server/auth/session";

export type ContributionExportStatus =
  | "all"
  | "PENDING"
  | "APPROVED"
  | "REJECTED"
  | "WITHDRAWN";

export type ContributionExportRow = {
  id: string;
  problemSlug: string;
  problemTitle: string;
  kind: ProblemContributionKind;
  status: string;
  contributorUsername: string | null;
  contributorName: string | null;
  reviewerUsername: string | null;
  reviewerName: string | null;
  note: string | null;
  reviewNote: string | null;
  createdAt: Date;
  reviewedAt: Date | null;
};

const contributor = alias(users, "export_contributor");
const reviewer = alias(users, "export_reviewer");

export async function listContributionExport(
  viewer: Pick<SafeUser, "id" | "role">,
  filters: {
    status: ContributionExportStatus;
    range: ReviewAnalyticsRange;
  },
): Promise<ContributionExportRow[]> {
  const since =
    filters.range === "all"
      ? undefined
      : new Date(Date.now() - Number(filters.range) * 86_400_000);
  const rows = await getDb()
    .select({
      id: problemContributions.id,
      problemSlug: problems.slug,
      problemTitle: problems.title,
      kind: problemContributions.kind,
      status: problemContributions.status,
      contributorUsername: contributor.username,
      contributorName: contributor.displayName,
      reviewerUsername: reviewer.username,
      reviewerName: reviewer.displayName,
      note: problemContributions.note,
      reviewNote: problemContributions.reviewNote,
      createdAt: problemContributions.createdAt,
      reviewedAt: problemContributions.reviewedAt,
    })
    .from(problemContributions)
    .innerJoin(problems, eq(problems.id, problemContributions.problemId))
    .leftJoin(contributor, eq(contributor.id, problemContributions.contributorId))
    .leftJoin(reviewer, eq(reviewer.id, problemContributions.reviewedById))
    .where(
      and(
        viewer.role === "ADMIN" ? undefined : eq(problems.authorId, viewer.id),
        filters.status === "all"
          ? undefined
          : eq(problemContributions.status, filters.status),
        since ? gte(problemContributions.createdAt, since) : undefined,
      ),
    )
    .orderBy(desc(problemContributions.createdAt))
    .limit(5_000);
  return rows;
}

export function contributionExportCsv(rows: ContributionExportRow[]): string {
  const header = [
    "id",
    "problem_slug",
    "problem_title",
    "kind",
    "status",
    "contributor_username",
    "contributor_name",
    "reviewer_username",
    "reviewer_name",
    "note",
    "review_note",
    "created_at",
    "reviewed_at",
    "review_hours",
  ];
  const body = rows.map((row) => {
    const reviewHours = row.reviewedAt
      ? ((row.reviewedAt.getTime() - row.createdAt.getTime()) / 3_600_000).toFixed(1)
      : "";
    return [
      row.id,
      row.problemSlug,
      row.problemTitle,
      row.kind,
      row.status,
      row.contributorUsername,
      row.contributorName,
      row.reviewerUsername,
      row.reviewerName,
      row.note,
      row.reviewNote,
      row.createdAt.toISOString(),
      row.reviewedAt?.toISOString() ?? "",
      reviewHours,
    ];
  });
  return toCsv([header, ...body]);
}
