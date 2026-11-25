import { and, asc, eq, inArray, lt, sql } from "drizzle-orm";
import { getDb, type Database } from "@/server/db";
import {
  problems,
  submissionResults,
  submissions,
  testCases,
} from "@/server/db/schema";
import type { JudgeOutcome, JudgeTest } from "@/server/judge/types";
import type { Language } from "@/server/db/schema";
import type { Verdict } from "@/lib/verdicts";
import { VERDICT_META } from "@/lib/verdicts";
import { getLanguage } from "@/lib/languages";
import { afterAcceptedSubmission } from "@/server/services/achievement-notifications";
import { notifyUser } from "@/server/services/notifications";

export type JudgeSubmission = {
  id: string;
  userId: string;
  problemId: string;
  problemSlug: string;
  problemTitle: string;
  checkerType: "EXACT" | "TOKEN" | "FLOAT" | "CUSTOM";
  checkerSource: string | null;
  floatTolerance: number;
  language: Language;
  sourceCode: string;
  timeLimitMs: number;
  memoryLimitMb: number;
  tests: JudgeTest[];
  /** Problem allows a multi-statement SQL script (DDL/DML/transactions). */
  sqlScript: boolean;
};

export async function claimSubmission(
  submissionId: string,
): Promise<JudgeSubmission | null> {
  const db = getDb();
  const claimed = await db
    .update(submissions)
    .set({ status: "JUDGING", judgedAt: null, errorMessage: null })
    .where(
      and(eq(submissions.id, submissionId), eq(submissions.status, "QUEUED")),
    )
    .returning({ id: submissions.id });

  if (claimed.length === 0) return null;

  const rows = await db
    .select({
      id: submissions.id,
      userId: submissions.userId,
      problemId: submissions.problemId,
      problemSlug: problems.slug,
      problemTitle: problems.title,
      checkerType: problems.checkerType,
      checkerSource: problems.checkerSource,
      floatTolerance: problems.floatTolerance,
      language: submissions.language,
      sourceCode: submissions.sourceCode,
      timeLimitMs: problems.timeLimitMs,
      memoryLimitMb: problems.memoryLimitMb,
      judgeLanguage: problems.judgeLanguage,
    })
    .from(submissions)
    .innerJoin(problems, eq(problems.id, submissions.problemId))
    .where(eq(submissions.id, submissionId))
    .limit(1);

  const row = rows[0];
  if (!row) return null;

  const tests = await db
    .select({
      id: testCases.id,
      position: testCases.position,
      input: testCases.input,
      expectedOutput: testCases.expectedOutput,
      isSample: testCases.isSample,
    })
    .from(testCases)
    .where(eq(testCases.problemId, row.problemId))
    .orderBy(asc(testCases.position));

  return {
    id: row.id,
    userId: row.userId,
    problemId: row.problemId,
    problemSlug: row.problemSlug,
    problemTitle: row.problemTitle,
    checkerType: row.checkerType,
    checkerSource: row.checkerSource,
    floatTolerance: row.floatTolerance,
    language: row.language,
    sourceCode: row.sourceCode,
    timeLimitMs: row.timeLimitMs,
    memoryLimitMb: row.memoryLimitMb,
    tests: tests.map((test) => ({
      id: test.id,
      position: test.position,
      input: test.input,
      expectedOutput: test.expectedOutput,
      isSample: test.isSample,
    })),
    sqlScript: row.judgeLanguage === "sql-script",
  };
}

export async function completeSubmission(
  submission: JudgeSubmission,
  outcome: JudgeOutcome,
): Promise<void> {
  const db = getDb();
  await db.transaction(async (tx) => {
    await tx
      .delete(submissionResults)
      .where(eq(submissionResults.submissionId, submission.id));

    if (outcome.results.length > 0) {
      const testsByPosition = new Map(
        submission.tests.map((test) => [test.position, test]),
      );
      await tx.insert(submissionResults).values(
        outcome.results.map((result) => ({
          submissionId: submission.id,
          testCaseId: testsByPosition.get(result.position)?.id ?? null,
          position: result.position,
          status: result.status,
          runtimeMs: result.runtimeMs,
          memoryKb: result.memoryKb,
          message: result.message,
        })),
      );
    }

    await tx
      .update(submissions)
      .set({
        status: outcome.status,
        passedTests: outcome.passedTests,
        totalTests: outcome.totalTests,
        runtimeMs: outcome.runtimeMs,
        memoryKb: outcome.memoryKb,
        compileOutput: outcome.compileOutput,
        errorMessage: outcome.errorMessage,
        judgedAt: new Date(),
      })
      .where(
        and(
          eq(submissions.id, submission.id),
          eq(submissions.status, "JUDGING"),
        ),
      );

    await tx
      .update(problems)
      .set({
        acceptedCount: sql`(select count(*)::int from submissions s where s.problem_id = ${submission.problemId} and s.status = 'ACCEPTED' and s.virtual_contest_id is null and s.assessment_id is null)`,
        submissionCount: sql`(select count(*)::int from submissions s where s.problem_id = ${submission.problemId} and s.virtual_contest_id is null and s.assessment_id is null)`,
      })
      .where(eq(problems.id, submission.problemId));
  });

  try {
    const meta = VERDICT_META[outcome.status];
    await notifyUser({
      userId: submission.userId,
      type: "VERDICT",
      title: `${meta.label}: ${submission.problemTitle}`,
      body:
        outcome.status === "ACCEPTED"
          ? `All ${outcome.totalTests} tests passed.`
          : `${outcome.passedTests}/${outcome.totalTests} tests passed · ${getLanguage(submission.language).shortLabel}`,
      href: `/submissions/${submission.id}`,
      dedupeKey: `verdict:${submission.id}`,
    });
  } catch (error) {
    console.error("Could not create verdict notification", error);
  }

  if (outcome.status === "ACCEPTED") {
    try {
      await afterAcceptedSubmission(submission.userId, submission.problemSlug);
    } catch (error) {
      console.error("Could not create achievement notifications", error);
    }
  }
}

export async function failSubmission(
  submission: Pick<
    JudgeSubmission,
    "id" | "userId" | "problemId" | "problemTitle"
  >,
  message: string,
): Promise<void> {
  const db = getDb();
  await db.transaction(async (tx) => {
    await tx
      .update(submissions)
      .set({
        status: "SYSTEM_ERROR",
        errorMessage: message.slice(0, 2000),
        judgedAt: new Date(),
      })
      .where(
        and(
          eq(submissions.id, submission.id),
          eq(submissions.status, "JUDGING"),
        ),
      );
    await tx
      .update(problems)
      .set({
        acceptedCount: sql`(select count(*)::int from submissions s where s.problem_id = ${submission.problemId} and s.status = 'ACCEPTED' and s.virtual_contest_id is null and s.assessment_id is null)`,
        submissionCount: sql`(select count(*)::int from submissions s where s.problem_id = ${submission.problemId} and s.virtual_contest_id is null and s.assessment_id is null)`,
      })
      .where(eq(problems.id, submission.problemId));
  });

  try {
    await notifyUser({
      userId: submission.userId,
      type: "VERDICT",
      title: `Judge error: ${submission.problemTitle}`,
      body: "The judge could not finish this run. Rejudge it from the submission page or contact an administrator.",
      href: `/submissions/${submission.id}`,
      dedupeKey: `verdict:${submission.id}`,
    });
  } catch (error) {
    console.error("Could not create judge error notification", error);
  }
}

export async function recoverStaleSubmissions(): Promise<string[]> {
  const db = getDb();
  const cutoff = new Date(Date.now() - 15 * 60 * 1000);
  const stale = await db
    .update(submissions)
    .set({ status: "QUEUED", errorMessage: "Requeued after a stale judging run." })
    .where(
      and(
        inArray(submissions.status, ["QUEUED", "JUDGING"]),
        lt(submissions.createdAt, cutoff),
      ),
    )
    .returning({ id: submissions.id });
  return stale.map((row) => row.id);
}

type Transaction = Parameters<Parameters<Database["transaction"]>[0]>[0];

/**
 * Resets a submission for judging. Pass a transaction when this must be atomic
 * with another lock (for example the contest-only rejudge guard).
 */
export async function markSubmissionQueued(
  submissionId: string,
  db: Database | Transaction = getDb(),
): Promise<void> {
  await db
    .update(submissions)
    .set({
      status: "QUEUED",
      passedTests: 0,
      runtimeMs: null,
      memoryKb: null,
      compileOutput: null,
      errorMessage: null,
      judgedAt: null,
    })
    .where(eq(submissions.id, submissionId));
  await db
    .delete(submissionResults)
    .where(eq(submissionResults.submissionId, submissionId));
}

export type StoredTestResult = {
  position: number;
  status: Verdict;
  runtimeMs: number | null;
  memoryKb: number | null;
  message: string | null;
};
