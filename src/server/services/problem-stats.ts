import { and, asc, count, eq, isNull, lt, sql, type SQL } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { getDb } from "@/server/db";
import { submissions, users } from "@/server/db/schema";
import type {
  ProblemLanguageCount,
  ProblemRankboard,
  ProblemStatistics,
  ProblemVerdictCount,
} from "@/lib/types";
import type { Verdict } from "@/lib/verdicts";
import { countedSubmission } from "./submission-filters";

const VERDICT_ORDER: Verdict[] = [
  "ACCEPTED",
  "WRONG_ANSWER",
  "TIME_LIMIT_EXCEEDED",
  "RUNTIME_ERROR",
  "COMPILATION_ERROR",
  "MEMORY_LIMIT_EXCEEDED",
  "OUTPUT_LIMIT_EXCEEDED",
  "SYSTEM_ERROR",
  "JUDGING",
  "QUEUED",
];

type GroupRow = { value: number | string };

/**
 * WHERE shared by the verdict and language aggregates: public practice
 * submissions only — no virtual contests, no assessments.
 */
export function problemStatsConditions(problemId: string): SQL {
  return and(
    eq(submissions.problemId, problemId),
    isNull(submissions.virtualContestId),
    countedSubmission(),
  )!;
}

export function buildProblemStatistics(
  verdictRows: ({ status: Verdict } & GroupRow)[],
  languageRows: ({ language: string } & GroupRow)[],
): ProblemStatistics {
  const verdictCounts = new Map<Verdict, number>();
  for (const row of verdictRows) {
    verdictCounts.set(row.status, Number(row.value) || 0);
  }

  const submissionCount = [...verdictCounts.values()].reduce(
    (sum, value) => sum + value,
    0,
  );
  const acceptedCount = verdictCounts.get("ACCEPTED") ?? 0;

  const byVerdict: ProblemVerdictCount[] = VERDICT_ORDER.filter(
    (status) => (verdictCounts.get(status) ?? 0) > 0,
  ).map((status) => ({ status, count: verdictCounts.get(status) ?? 0 }));

  const byLanguage: ProblemLanguageCount[] = languageRows
    .map((row) => ({ language: row.language, count: Number(row.value) || 0 }))
    .filter((row) => row.count > 0)
    .sort((a, b) => b.count - a.count);

  return {
    submissionCount,
    acceptedCount,
    successRate:
      submissionCount > 0 ? (acceptedCount / submissionCount) * 100 : 0,
    byVerdict,
    byLanguage,
  };
}

export async function getProblemStatistics(
  problemId: string,
): Promise<ProblemStatistics> {
  const db = getDb();
  const [verdictRows, languageRows] = await Promise.all([
    db
      .select({ status: submissions.status, value: count() })
      .from(submissions)
      .where(problemStatsConditions(problemId))
      .groupBy(submissions.status),
    db
      .select({ language: submissions.language, value: count() })
      .from(submissions)
      .where(problemStatsConditions(problemId))
      .groupBy(submissions.language),
  ]);

  return buildProblemStatistics(verdictRows, languageRows);
}

function toIso(value: Date | string): string {
  return (value instanceof Date ? value : new Date(value)).toISOString();
}

export async function getProblemRankboard(
  problemId: string,
  limit = 10,
): Promise<ProblemRankboard> {
  const db = getDb();
  const firstAccepted = db
    .select({
      userId: submissions.userId,
      solvedAt: sql<Date | string>`min(${submissions.createdAt})`.as(
        "solved_at",
      ),
    })
    .from(submissions)
    .where(
      and(
        eq(submissions.problemId, problemId),
        eq(submissions.status, "ACCEPTED"),
        isNull(submissions.assessmentId),
        isNull(submissions.virtualContestId),
      ),
    )
    .groupBy(submissions.userId)
    .as("first_accepted");

  const acceptedSubmission = alias(submissions, "accepted_submission");

  const [totalRow, rows] = await Promise.all([
    db
      .select({ value: count() })
      .from(firstAccepted)
      .innerJoin(users, eq(users.id, firstAccepted.userId))
      .where(eq(users.isBanned, false)),
    db
      .select({
        username: users.username,
        displayName: users.displayName,
        solvedAt: firstAccepted.solvedAt,
        language: acceptedSubmission.language,
        runtimeMs: acceptedSubmission.runtimeMs,
        attempts: sql<number>`count(${submissions.id})::int`.as("attempts"),
      })
      .from(firstAccepted)
      .innerJoin(users, eq(users.id, firstAccepted.userId))
      .innerJoin(
        acceptedSubmission,
        and(
          eq(acceptedSubmission.userId, firstAccepted.userId),
          eq(acceptedSubmission.problemId, problemId),
          eq(acceptedSubmission.status, "ACCEPTED"),
          eq(acceptedSubmission.createdAt, firstAccepted.solvedAt),
          isNull(acceptedSubmission.assessmentId),
        ),
      )
      .leftJoin(
        submissions,
        and(
          eq(submissions.userId, firstAccepted.userId),
          eq(submissions.problemId, problemId),
          isNull(submissions.assessmentId),
          lt(submissions.createdAt, firstAccepted.solvedAt),
        ),
      )
      .where(eq(users.isBanned, false))
      .groupBy(
        users.username,
        users.displayName,
        firstAccepted.solvedAt,
        acceptedSubmission.language,
        acceptedSubmission.runtimeMs,
      )
      .orderBy(asc(firstAccepted.solvedAt), asc(users.username))
      .limit(limit),
  ]);

  return {
    totalSolvers: Number(totalRow[0]?.value ?? 0),
    solvers: rows.map((row, index) => ({
      rank: index + 1,
      username: row.username,
      displayName: row.displayName,
      attempts: Number(row.attempts) || 0,
      solvedAt: toIso(row.solvedAt),
      language: row.language,
      runtimeMs: row.runtimeMs,
    })),
  };
}
