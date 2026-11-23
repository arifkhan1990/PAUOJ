import {
  and,
  asc,
  count,
  desc,
  eq,
  inArray,
  isNull,
  or,
  type SQL,
} from "drizzle-orm";
import { ApiError, errors } from "@/server/api/errors";
import { toOffset, type PaginationInput } from "@/server/api/validation";
import { getDb } from "@/server/db";
import {
  assessments,
  auditLogs,
  contests,
  problems,
  submissionResults,
  submissions,
  testCases,
  users,
} from "@/server/db/schema";
import type { CreateSubmissionInput } from "@/lib/schemas/submission";
import type {
  SubmissionDetail,
  SubmissionListItem,
} from "@/lib/types";
import { isPendingVerdict, VERDICT_META } from "@/lib/verdicts";
import type { LanguageId } from "@/lib/languages";
import { enqueueSubmission } from "@/server/judge/queue";
import { markSubmissionQueued } from "@/server/judge/submission-runner";
import { getAssessmentForSubmission } from "./assessment-access";
import { getVirtualSubmissionContext } from "./virtual-contests";
import {
  getActiveContestForProblem,
  getContestForSubmission,
} from "./contests";
import { getProblemForSubmission } from "./problems";

export type SubmissionListFilters = PaginationInput & {
  mine?: "true" | "false";
  status?: string;
  language?: LanguageId;
  problem?: string;
  user?: string;
  contest?: string;
  assessment?: string;
};

export async function createSubmission(
  user: { id: string; role: "USER" | "TEACHER" | "ADMIN" },
  input: CreateSubmissionInput,
): Promise<{ id: string; status: "QUEUED" }> {
  const byteLength = Buffer.byteLength(input.source, "utf8");
  if (byteLength > 65_536) {
    throw errors.validation("Source code must be at most 64 KB.");
  }

  const db = getDb();
  const isAdmin = user.role === "ADMIN";
  const { problem, contestContext, assessmentContext } =
    await getProblemForSubmission(input.problemId, user.id, isAdmin);

  if (
    problem.judgeLanguage === "sql" &&
    !["sql", "mysql", "postgresql"].includes(input.language)
  ) {
    throw errors.validation(
      "This problem accepts SQL, MySQL or PostgreSQL solutions.",
    );
  }
  if (problem.premiumModuleSlug && !isAdmin) {
    const { hasModuleEntitlement } = await import(
      "@/server/services/learning-payments"
    );
    if (!(await hasModuleEntitlement(user.id, problem.premiumModuleSlug))) {
      throw errors.forbidden(
        "This problem is part of a premium module. Unlock it from the learning pricing page.",
      );
    }
  }

  let assessmentId = input.assessmentId ?? null;
  if (assessmentId) {
    await getAssessmentForSubmission(assessmentId, problem.id, user.id);
  } else if (assessmentContext) {
    assessmentId = assessmentContext.id;
  }

  let contestId = input.contestId ?? null;
  const virtualContestId = input.virtualContestId ?? null;
  if (virtualContestId) {
    const virtual = await getVirtualSubmissionContext(
      problem.slug,
      virtualContestId,
      user.id,
    );
    if (!virtual.problemIds.includes(problem.id)) {
      throw errors.validation("That problem is not part of this virtual contest.");
    }
    contestId = virtual.contestId;
  } else if (contestId) {
    await getContestForSubmission(contestId, problem.id, user.id);
  } else if (!assessmentId && contestContext) {
    contestId = contestContext.id;
  } else if (!assessmentId) {
    const access = await getActiveContestForProblem(
      problem.id,
      user.id,
      isAdmin,
    );
    if (access.restricted) {
      throw errors.forbidden(
        "This problem belongs to a running contest. Register for the contest first.",
      );
    }
  }

  const [testRow] = await db
    .select({ value: count() })
    .from(testCases)
    .where(eq(testCases.problemId, problem.id));
  const totalTests = Number(testRow?.value ?? 0);
  if (totalTests === 0) {
    throw errors.validation("This problem is not ready for submissions yet.");
  }

  const rows = await db
    .insert(submissions)
    .values({
      userId: user.id,
      problemId: problem.id,
      contestId,
      virtualContestId,
      assessmentId,
      language: input.language,
      sourceCode: input.source,
      totalTests,
    })
    .returning({ id: submissions.id });

  const submission = rows[0];
  if (!submission) {
    throw new ApiError("SUBMIT_FAILED", "Could not create the submission.", 500);
  }

  try {
    await enqueueSubmission(submission.id);
  } catch (error) {
    console.error("Could not enqueue submission", error);
    await db
      .update(submissions)
      .set({
        status: "SYSTEM_ERROR",
        errorMessage: "The judge queue is unavailable.",
        judgedAt: new Date(),
      })
      .where(eq(submissions.id, submission.id));
    throw errors.unavailable(
      "The judge is unavailable right now. Please try again shortly.",
    );
  }

  return { id: submission.id, status: "QUEUED" };
}

export async function listSubmissions(
  filters: SubmissionListFilters,
  viewer: { id: string; role: "USER" | "TEACHER" | "ADMIN" } | null,
): Promise<{ items: SubmissionListItem[]; total: number }> {
  const db = getDb();
  const conditions: SQL[] = [];

  if (filters.mine === "true") {
    if (!viewer) throw errors.unauthorized();
    conditions.push(eq(submissions.userId, viewer.id));
  }
  if (viewer?.role !== "ADMIN") {
    conditions.push(
      viewer
        ? or(
            isNull(submissions.assessmentId),
            eq(submissions.userId, viewer.id),
          )!
        : isNull(submissions.assessmentId),
    );
  }
  if (filters.status) {
    if (!(filters.status in VERDICT_META)) {
      throw errors.validation("Unknown verdict filter.");
    }
    conditions.push(
      eq(
        submissions.status,
        filters.status as (typeof submissions.$inferSelect)["status"],
      ),
    );
  }
  if (filters.language) {
    conditions.push(eq(submissions.language, filters.language));
  }
  if (filters.problem) {
    conditions.push(eq(problems.slug, filters.problem));
  }
  if (filters.user) {
    conditions.push(eq(users.username, filters.user.toLowerCase()));
  }
  if (filters.contest) {
    conditions.push(eq(contests.slug, filters.contest));
    conditions.push(isNull(submissions.virtualContestId));
  }
  if (filters.assessment) {
    conditions.push(eq(assessments.slug, filters.assessment));
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [totalRow] = await db
    .select({ value: count() })
    .from(submissions)
    .innerJoin(problems, eq(problems.id, submissions.problemId))
    .innerJoin(users, eq(users.id, submissions.userId))
    .leftJoin(contests, eq(contests.id, submissions.contestId))
    .leftJoin(assessments, eq(assessments.id, submissions.assessmentId))
    .where(where);

  const rows = await db
    .select({
      id: submissions.id,
      status: submissions.status,
      language: submissions.language,
      createdAt: submissions.createdAt,
      runtimeMs: submissions.runtimeMs,
      memoryKb: submissions.memoryKb,
      passedTests: submissions.passedTests,
      totalTests: submissions.totalTests,
      problemSlug: problems.slug,
      problemTitle: problems.title,
      username: users.username,
      displayName: users.displayName,
      contestSlug: contests.slug,
      assessmentSlug: assessments.slug,
    })
    .from(submissions)
    .innerJoin(problems, eq(problems.id, submissions.problemId))
    .innerJoin(users, eq(users.id, submissions.userId))
    .leftJoin(contests, eq(contests.id, submissions.contestId))
    .leftJoin(assessments, eq(assessments.id, submissions.assessmentId))
    .where(where)
    .orderBy(desc(submissions.createdAt))
    .limit(filters.pageSize)
    .offset(toOffset(filters));

  return {
    total: Number(totalRow?.value ?? 0),
    items: rows.map((row) => ({
      id: row.id,
      status: row.status,
      language: row.language,
      createdAt: row.createdAt.toISOString(),
      runtimeMs: row.runtimeMs,
      memoryKb: row.memoryKb,
      passedTests: row.passedTests,
      totalTests: row.totalTests,
      problem: { slug: row.problemSlug, title: row.problemTitle },
      user: { username: row.username, displayName: row.displayName },
      contestSlug: row.contestSlug,
      assessmentSlug: row.assessmentSlug,
    })),
  };
}

export async function getSubmissionById(
  id: string,
  viewer: { id: string; role: "USER" | "TEACHER" | "ADMIN" } | null,
): Promise<SubmissionDetail | null> {
  const db = getDb();
  const rows = await db
    .select({
      id: submissions.id,
      userId: submissions.userId,
      status: submissions.status,
      language: submissions.language,
      sourceCode: submissions.sourceCode,
      createdAt: submissions.createdAt,
      runtimeMs: submissions.runtimeMs,
      memoryKb: submissions.memoryKb,
      passedTests: submissions.passedTests,
      totalTests: submissions.totalTests,
      compileOutput: submissions.compileOutput,
      errorMessage: submissions.errorMessage,
      judgedAt: submissions.judgedAt,
      problemSlug: problems.slug,
      problemTitle: problems.title,
      username: users.username,
      displayName: users.displayName,
      contestSlug: contests.slug,
      contestEndAt: contests.endAt,
      assessmentSlug: assessments.slug,
      assessmentEndAt: assessments.endAt,
    })
    .from(submissions)
    .innerJoin(problems, eq(problems.id, submissions.problemId))
    .innerJoin(users, eq(users.id, submissions.userId))
    .leftJoin(contests, eq(contests.id, submissions.contestId))
    .leftJoin(assessments, eq(assessments.id, submissions.assessmentId))
    .where(eq(submissions.id, id))
    .limit(1);

  const row = rows[0];
  if (!row) return null;

  const isOwner = viewer?.id === row.userId;
  const isAdmin = viewer?.role === "ADMIN";
  if (row.assessmentSlug && !isOwner && !isAdmin) return null;
  const now = Date.now();
  const contestActive = row.contestEndAt
    ? row.contestEndAt.getTime() > now
    : false;
  const assessmentActive = row.assessmentEndAt
    ? row.assessmentEndAt.getTime() > now
    : false;
  const canViewSource =
    isOwner ||
    isAdmin ||
    (!row.assessmentSlug && !contestActive && !assessmentActive);

  const resultRows = await db
    .select({
      position: submissionResults.position,
      status: submissionResults.status,
      runtimeMs: submissionResults.runtimeMs,
      memoryKb: submissionResults.memoryKb,
      message: submissionResults.message,
    })
    .from(submissionResults)
    .where(eq(submissionResults.submissionId, id))
    .orderBy(asc(submissionResults.position));

  return {
    id: row.id,
    status: row.status,
    language: row.language,
    createdAt: row.createdAt.toISOString(),
    runtimeMs: row.runtimeMs,
    memoryKb: row.memoryKb,
    passedTests: row.passedTests,
    totalTests: row.totalTests,
    problem: { slug: row.problemSlug, title: row.problemTitle },
    user: { username: row.username, displayName: row.displayName },
    contestSlug: row.contestSlug,
    assessmentSlug: row.assessmentSlug,
    sourceCode: canViewSource ? row.sourceCode : null,
    compileOutput: canViewSource ? row.compileOutput : null,
    errorMessage: canViewSource ? row.errorMessage : null,
    judgedAt: row.judgedAt?.toISOString() ?? null,
    results: resultRows,
    canViewSource,
  };
}

export async function rejudgeSubmission(
  adminId: string,
  id: string,
): Promise<void> {
  const db = getDb();
  const rows = await db
    .select({ id: submissions.id, status: submissions.status })
    .from(submissions)
    .where(eq(submissions.id, id))
    .limit(1);
  const submission = rows[0];
  if (!submission) throw errors.notFound("Submission not found.");
  if (isPendingVerdict(submission.status)) {
    throw errors.conflict("This submission is already queued or running.");
  }

  await markSubmissionQueued(id);
  await db.insert(auditLogs).values({
    actorId: adminId,
    action: "submission.rejudge",
    entityType: "submission",
    entityId: id,
  });

  try {
    await enqueueSubmission(id);
  } catch (error) {
    console.error("Could not enqueue rejudge", error);
    await db
      .update(submissions)
      .set({
        status: "SYSTEM_ERROR",
        errorMessage: "The judge queue is unavailable.",
        judgedAt: new Date(),
      })
      .where(eq(submissions.id, id));
    throw errors.unavailable("The judge queue is unavailable.");
  }
}

export async function getPendingSubmissionIds(
  ids: string[],
): Promise<Set<string>> {
  if (ids.length === 0) return new Set();
  const rows = await getDb()
    .select({ id: submissions.id, status: submissions.status })
    .from(submissions)
    .where(inArray(submissions.id, ids));
  return new Set(
    rows
      .filter((row) => isPendingVerdict(row.status))
      .map((row) => row.id),
  );
}
