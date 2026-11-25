import { and, asc, count, desc, eq, gte, isNotNull, lte, sql } from "drizzle-orm";
import { getDb } from "@/server/db";
import {
  contestProblemApprovals,
  problemContributions,
  problems,
  users,
} from "@/server/db/schema";
import type { ProblemContributionKind } from "@/lib/contribution-types";
import type { SafeUser } from "@/server/auth/session";
import { REVIEW_SLA_MS } from "@/lib/review-sla";

export type ReviewAnalyticsRange = "7" | "30" | "all";

export function parseReviewRange(value: string | undefined): ReviewAnalyticsRange {
  return value === "7" || value === "30" ? value : "all";
}

export type ReviewAnalytics = {
  pendingContributions: number;
  overdueContributions: number;
  oldestPendingHours: number | null;
  approvedContributions: number;
  rejectedContributions: number;
  averageReviewHours: number | null;
  pendingContestRequests: number;
  byKind: { kind: ProblemContributionKind; count: number }[];
  topContributors: {
    username: string;
    displayName: string;
    approved: number;
    avatarPreset: string | null;
    avatarImageUpdatedAt: string | null;
  }[];
};

export async function getReviewAnalytics(
  viewer: Pick<SafeUser, "id" | "role">,
  scope: "teacher" | "admin",
  range: ReviewAnalyticsRange = "all",
): Promise<ReviewAnalytics> {
  const db = getDb();
  const owned =
    scope === "teacher" ? eq(problems.authorId, viewer.id) : undefined;
  const since =
    range === "all"
      ? undefined
      : new Date(Date.now() - Number(range) * 86_400_000);

  const contributionWhere = and(
    owned,
    since ? gte(problemContributions.createdAt, since) : undefined,
  );
  const statusRows = await db
    .select({ status: problemContributions.status, value: count() })
    .from(problemContributions)
    .innerJoin(problems, eq(problems.id, problemContributions.problemId))
    .where(contributionWhere)
    .groupBy(problemContributions.status);

  const statusCount = (status: "PENDING" | "APPROVED" | "REJECTED") =>
    Number(
      statusRows.find((row) => row.status === status)?.value ?? 0,
    );

  const [overdueRow, oldestRow] = await Promise.all([
    db
      .select({ value: count() })
      .from(problemContributions)
      .innerJoin(problems, eq(problems.id, problemContributions.problemId))
      .where(
        and(
          contributionWhere,
          eq(problemContributions.status, "PENDING"),
          lte(problemContributions.createdAt, new Date(Date.now() - REVIEW_SLA_MS)),
        ),
      ),
    db
      .select({ createdAt: problemContributions.createdAt })
      .from(problemContributions)
      .innerJoin(problems, eq(problems.id, problemContributions.problemId))
      .where(
        and(
          contributionWhere,
          eq(problemContributions.status, "PENDING"),
        ),
      )
      .orderBy(asc(problemContributions.createdAt))
      .limit(1),
  ]);
  const oldestPendingHours = oldestRow[0]
    ? Math.max(
        0,
        Math.round(
          (Date.now() - oldestRow[0].createdAt.getTime()) / 3_600_000,
        ),
      )
    : null;

  const [averageRow] = await db
    .select({
      value: sql<
        number | null
      >`avg(extract(epoch from (${problemContributions.reviewedAt} - ${problemContributions.createdAt})) / 3600)`,
    })
    .from(problemContributions)
    .innerJoin(problems, eq(problems.id, problemContributions.problemId))
    .where(and(contributionWhere, isNotNull(problemContributions.reviewedAt)));
  const average = averageRow?.value;
  const averageReviewHours =
    average === null || average === undefined
      ? null
      : Math.round(Number(average) * 10) / 10;

  const kindRows = await db
    .select({ kind: problemContributions.kind, value: count() })
    .from(problemContributions)
    .innerJoin(problems, eq(problems.id, problemContributions.problemId))
    .where(contributionWhere)
    .groupBy(problemContributions.kind);

  const contributorRows = await db
    .select({
      username: users.username,
      displayName: users.displayName,
      avatarPreset: users.avatarPreset,
      avatarImageUpdatedAt: users.avatarImageUpdatedAt,
      approved: count(),
    })
    .from(problemContributions)
    .innerJoin(problems, eq(problems.id, problemContributions.problemId))
    .innerJoin(users, eq(users.id, problemContributions.contributorId))
    .where(
      and(contributionWhere, eq(problemContributions.status, "APPROVED")),
    )
    .groupBy(
      users.username,
      users.displayName,
      users.avatarPreset,
      users.avatarImageUpdatedAt,
    )
    .orderBy(desc(count()))
    .limit(5);

  const [contestRow] = await db
    .select({ value: count() })
    .from(contestProblemApprovals)
    .where(
      and(
        eq(contestProblemApprovals.status, "PENDING"),
        scope === "teacher"
          ? eq(contestProblemApprovals.authorId, viewer.id)
          : undefined,
        since ? gte(contestProblemApprovals.createdAt, since) : undefined,
      ),
    );

  return {
    pendingContributions: statusCount("PENDING"),
    overdueContributions: Number(overdueRow[0]?.value ?? 0),
    oldestPendingHours,
    approvedContributions: statusCount("APPROVED"),
    rejectedContributions: statusCount("REJECTED"),
    averageReviewHours,
    pendingContestRequests: Number(contestRow?.value ?? 0),
    byKind: kindRows.map((row) => ({
      kind: row.kind,
      count: Number(row.value),
    })),
    topContributors: contributorRows.map((row) => ({
      username: row.username,
      displayName: row.displayName,
      approved: Number(row.approved),
      avatarPreset: row.avatarPreset,
      avatarImageUpdatedAt:
        row.avatarImageUpdatedAt?.toISOString() ?? null,
    })),
  };
}
