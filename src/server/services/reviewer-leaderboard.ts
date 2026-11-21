import {
  and,
  asc,
  count,
  desc,
  eq,
  gte,
  inArray,
  isNotNull,
  sql,
  type SQL,
} from "drizzle-orm";
import { getDb } from "@/server/db";
import { problemContributions, users } from "@/server/db/schema";
import {
  parseReviewerRange,
  reviewerRangeStart,
  type ReviewerLeaderboard,
  type ReviewerLeaderboardRange,
  type ReviewerLeaderboardRow,
} from "@/lib/reviewer-leaderboard-types";

export { parseReviewerRange, reviewerRangeStart };
export type {
  ReviewerLeaderboard,
  ReviewerLeaderboardRange,
  ReviewerLeaderboardRow,
} from "@/lib/reviewer-leaderboard-types";

const ROW_LIMIT = 50;

/** Review latency in hours, from submission of the proposal to its decision. */
const reviewHours = sql`extract(epoch from (${problemContributions.reviewedAt} - ${problemContributions.createdAt})) / 3600`;

function roundOne(value: number): number {
  return Math.round(value * 10) / 10;
}

function toNumber(value: number | string | null | undefined): number {
  return value === null || value === undefined ? 0 : Number(value);
}

function decidedConditions(since: Date | null): SQL | undefined {
  return and(
    inArray(problemContributions.status, ["APPROVED", "REJECTED"]),
    isNotNull(problemContributions.reviewedById),
    isNotNull(problemContributions.reviewedAt),
    since ? gte(problemContributions.reviewedAt, since) : undefined,
  );
}

/** Per-reviewer aggregate, capped at ROW_LIMIT rows. */
async function loadReviewerRows(
  where: SQL | undefined,
): Promise<ReviewerLeaderboardRow[]> {
  const rows = await getDb()
    .select({
      userId: users.id,
      username: users.username,
      displayName: users.displayName,
      role: users.role,
      decisions: sql<number>`count(*)::int`,
      approved: sql<
        number
      >`(count(*) filter (where ${problemContributions.status} = 'APPROVED'))::int`,
      rejected: sql<
        number
      >`(count(*) filter (where ${problemContributions.status} = 'REJECTED'))::int`,
      averageReviewHours: sql<number | null>`avg(${reviewHours})`,
      lastReviewedAt: sql<
        Date | null
      >`max(${problemContributions.reviewedAt})`,
    })
    .from(problemContributions)
    .innerJoin(users, eq(users.id, problemContributions.reviewedById))
    .where(where)
    .groupBy(users.id, users.username, users.displayName, users.role)
    .orderBy(
      desc(count()),
      sql`avg(${reviewHours}) asc nulls last`,
      asc(users.username),
    )
    .limit(ROW_LIMIT);

  return rows.map((row) => {
    const decisions = toNumber(row.decisions);
    const approved = toNumber(row.approved);
    const rejected = toNumber(row.rejected);
    const average = row.averageReviewHours;
    return {
      userId: row.userId,
      username: row.username,
      displayName: row.displayName,
      role: row.role,
      decisions,
      approved,
      rejected,
      approvalRate:
        decisions > 0 ? roundOne((approved / decisions) * 100) : 0,
      averageReviewHours:
        average === null || average === undefined
          ? null
          : roundOne(Number(average)),
      lastReviewedAt: row.lastReviewedAt
        ? new Date(row.lastReviewedAt).toISOString()
        : null,
    };
  });
}

/** Totals over every reviewer in range, not only the visible rows. */
async function loadSummary(where: SQL | undefined): Promise<{
  totalDecisions: number;
  totalReviewers: number;
  averageReviewHours: number | null;
}> {
  const [row] = await getDb()
    .select({
      totalDecisions: sql<number>`count(*)::int`,
      totalReviewers: sql<
        number
      >`(count(distinct ${problemContributions.reviewedById}))::int`,
      averageReviewHours: sql<number | null>`avg(${reviewHours})`,
    })
    .from(problemContributions)
    .where(where);

  const average = row?.averageReviewHours;

  return {
    totalDecisions: toNumber(row?.totalDecisions),
    totalReviewers: toNumber(row?.totalReviewers),
    averageReviewHours:
      average === null || average === undefined
        ? null
        : roundOne(Number(average)),
  };
}

export async function getReviewerLeaderboard(
  range: ReviewerLeaderboardRange,
): Promise<ReviewerLeaderboard> {
  const since = reviewerRangeStart(range);
  const where = decidedConditions(since);

  const [rows, summary] = await Promise.all([
    loadReviewerRows(where),
    loadSummary(where),
  ]);

  return {
    range,
    rows,
    totalDecisions: summary.totalDecisions,
    totalReviewers: summary.totalReviewers,
    averageReviewHours: summary.averageReviewHours,
  };
}
