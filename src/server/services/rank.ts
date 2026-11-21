import {
  and,
  asc,
  count,
  desc,
  eq,
  gt,
  inArray,
  isNull,
  or,
  sql,
  type SQL,
} from "drizzle-orm";
import { toOffset, type PaginationInput } from "@/server/api/validation";
import { getDb } from "@/server/db";
import { problems, submissions, users } from "@/server/db/schema";
import type { RankRow } from "@/lib/types";
import { countedSubmission } from "./submission-filters";

/**
 * WHERE for the solved/totals aggregate: accepted practice submissions only —
 * no virtual contests, no assessments.
 */
export function rankSolvedConditions(): SQL {
  return and(
    eq(submissions.status, "ACCEPTED"),
    isNull(submissions.virtualContestId),
    countedSubmission(),
  )!;
}

/** WHERE for the per-user submission aggregate shown on the rank board. */
export function rankSubmissionAggConditions(usernames: string[]): SQL {
  return and(
    inArray(users.username, usernames),
    isNull(submissions.virtualContestId),
    countedSubmission(),
  )!;
}

function buildTotals() {
  const db = getDb();
  const solved = db
    .select({
      userId: submissions.userId,
      problemId: submissions.problemId,
      points: problems.points,
    })
    .from(submissions)
    .innerJoin(problems, eq(problems.id, submissions.problemId))
    .where(rankSolvedConditions())
    .groupBy(submissions.userId, submissions.problemId, problems.points)
    .as("solved");

  return db
    .select({
      userId: solved.userId,
      points: sql<number>`sum(${solved.points})::int`.as("points"),
      solvedCount: sql<number>`count(*)::int`.as("solved_count"),
    })
    .from(solved)
    .groupBy(solved.userId)
    .as("totals");
}

export async function listRank(
  page: PaginationInput,
): Promise<{ items: RankRow[]; total: number }> {
  const db = getDb();
  const totals = buildTotals();

  const [totalRow] = await db
    .select({ value: count() })
    .from(totals);

  const rows = await db
    .select({
      username: users.username,
      displayName: users.displayName,
      institution: users.institution,
      country: users.country,
      points: totals.points,
      solvedCount: totals.solvedCount,
    })
    .from(totals)
    .innerJoin(users, eq(users.id, totals.userId))
    .orderBy(desc(totals.points), desc(totals.solvedCount), asc(users.username))
    .limit(page.pageSize)
    .offset(toOffset(page));

  const usernames = rows.map((row) => row.username);
  const submissionAgg =
    usernames.length > 0
      ? await db
          .select({
            username: users.username,
            submissionCount: sql<number>`count(*)::int`.as("submission_count"),
            acceptedCount: sql<number>`(count(*) filter (where ${submissions.status} = 'ACCEPTED'))::int`.as("accepted_count"),
            lastAcceptedAt: sql<Date | null>`max(${submissions.createdAt}) filter (where ${submissions.status} = 'ACCEPTED')`.as("last_accepted_at"),
          })
          .from(submissions)
          .innerJoin(users, eq(users.id, submissions.userId))
          .where(rankSubmissionAggConditions(usernames))
          .groupBy(users.username)
      : [];

  const aggByUser = new Map(submissionAgg.map((row) => [row.username, row]));

  return {
    total: Number(totalRow?.value ?? 0),
    items: rows.map((row, index) => {
      const agg = aggByUser.get(row.username);
      const submissionCount = Number(agg?.submissionCount ?? 0);
      const acceptedCount = Number(agg?.acceptedCount ?? 0);
      return {
        rank: toOffset(page) + index + 1,
        username: row.username,
        displayName: row.displayName,
        institution: row.institution,
        country: row.country,
        points: Number(row.points),
        solvedCount: Number(row.solvedCount),
        submissionCount,
        acceptanceRate:
          submissionCount > 0 ? (acceptedCount / submissionCount) * 100 : 0,
        lastAcceptedAt: agg?.lastAcceptedAt
          ? new Date(agg.lastAcceptedAt).toISOString()
          : null,
      };
    }),
  };
}

export async function getUserRank(userId: string): Promise<number | null> {
  const db = getDb();
  const totals = buildTotals();
  const rows = await db
    .select({ points: totals.points, solvedCount: totals.solvedCount })
    .from(totals)
    .where(eq(totals.userId, userId))
    .limit(1);
  const mine = rows[0];
  if (!mine) return null;

  const [better] = await db
    .select({ value: count() })
    .from(totals)
    .where(
      or(
        gt(totals.points, mine.points),
        and(
          eq(totals.points, mine.points),
          gt(totals.solvedCount, mine.solvedCount),
        ),
      ),
    );

  return Number(better?.value ?? 0) + 1;
}
