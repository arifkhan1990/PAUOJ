import {
  and,
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
  submissions,
  testCases,
  users,
} from "@/server/db/schema";
import type { CreateSubmissionInput } from "@/lib/schemas/submission";
import type { SubmissionListItem } from "@/lib/types";
import { isPendingVerdict, VERDICT_META } from "@/lib/verdicts";
import { isContestRatingLocked } from "@/lib/contest-rating";
import type { LanguageId } from "@/lib/languages";
import {
  enqueueSubmission,
  submissionPriority,
} from "@/server/judge/queue";
import { markSubmissionQueued } from "@/server/judge/submission-runner";
import { publishSubmissionChanged } from "@/server/judge/submission-events";
import { getAssessmentForSubmission } from "./assessment-access";
import { getVirtualSubmissionContext } from "./virtual-contests";
import {
  getActiveContestForProblem,
  getContestForSubmission,
} from "./contests";
import { getProblemForSubmission } from "./problem-submission-context";
import { languageFilterCondition, publicSubmissionCondition } from "./submission-filters";

export type SubmissionListFilters = PaginationInput & {
  mine?: "true" | "false";
  status?: string;
  language?: LanguageId;
  problem?: string;
  user?: string;
  contest?: string;
  assessment?: string;
  /** Public landing feeds: only published problems in public, ended contests. */
  publicOnly?: boolean;
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

  const sqlProblem =
    problem.judgeLanguage === "sql" || problem.judgeLanguage === "sql-script";
  if (sqlProblem) {
    const allowed =
      problem.judgeLanguage === "sql-script"
        ? ["sql", "sqlite"]
        : ["sql", "sqlite", "mysql", "postgresql"];
    if (!allowed.includes(input.language)) {
      throw errors.validation(
        problem.judgeLanguage === "sql-script"
          ? "This SQL script lab runs on SQLite; choose SQL or SQLite 3."
          : "This problem accepts SQL, SQLite, MySQL or PostgreSQL solutions.",
      );
    }
  }
  // Real engines: SQLite for sql/sqlite, MariaDB for mysql, PostgreSQL for postgresql.
  // Defense in depth: getProblemForSubmission already throws PREMIUM_LOCKED.
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
    await enqueueSubmission(submission.id, {
      priority: submissionPriority({ contestId, assessmentId, virtualContestId }),
    });
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
        ? or(isNull(submissions.assessmentId), eq(submissions.userId, viewer.id))!
        : isNull(submissions.assessmentId),
    );
  }
  if (filters.publicOnly) {
    conditions.push(publicSubmissionCondition());
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
    conditions.push(languageFilterCondition(filters.language));
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
      premiumModuleSlug: problems.premiumModuleSlug,
      username: users.username,
      displayName: users.displayName,
      avatarPreset: users.avatarPreset,
      avatarImageUpdatedAt: users.avatarImageUpdatedAt,
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
      user: {
        username: row.username,
        displayName: row.displayName,
        avatarPreset: row.avatarPreset,
        avatarImageUpdatedAt:
          row.avatarImageUpdatedAt?.toISOString() ?? null,
      },
      contestSlug: row.contestSlug,
      assessmentSlug: row.assessmentSlug,
    })),
  };
}

export { getSubmissionById } from "./submission-detail";

export async function rejudgeSubmission(
  adminId: string,
  id: string,
): Promise<void> {
  const db = getDb();
  const rows = await db
    .select({
      id: submissions.id,
      status: submissions.status,
      contestId: submissions.contestId,
    })
    .from(submissions)
    .where(eq(submissions.id, id))
    .limit(1);
  const submission = rows[0];
  if (!submission) throw errors.notFound("Submission not found.");
  if (isPendingVerdict(submission.status)) {
    throw errors.conflict("This submission is already queued or running.");
  }

  const audit = {
    actorId: adminId,
    action: "submission.rejudge",
    entityType: "submission",
    entityId: id,
  } as const;

  if (submission.contestId) {
    // Serialise with the rating finalizer on the contest row. Either we queue
    // the rejudge first (and the finalizer sees a pending verdict, so it
    // defers), or the finalizer sets rated_at first (and the rejudge is
    // rejected). The audit row commits together with the queued status.
    const contestId = submission.contestId;
    await db.transaction(async (tx) => {
      const [contest] = await tx
        .select({ id: contests.id, ratedAt: contests.ratedAt })
        .from(contests)
        .where(eq(contests.id, contestId))
        .for("update")
        .limit(1);
      const [fresh] = await tx
        .select({ status: submissions.status })
        .from(submissions)
        .where(eq(submissions.id, id))
        .limit(1);
      if (!fresh) throw errors.notFound("Submission not found.");
      if (isPendingVerdict(fresh.status)) {
        throw errors.conflict("This submission is already queued or running.");
      }
      if (contest && isContestRatingLocked(contest.ratedAt)) {
        throw errors.conflict(
          "Contest ratings are finalized; this contest submission can no longer be rejudged.",
        );
      }
      await markSubmissionQueued(id, tx);
      await tx.insert(auditLogs).values(audit);
    });
  } else {
    await markSubmissionQueued(id);
    await db.insert(auditLogs).values(audit);
  }

  // Best-effort fanout: only after the queued status is committed.
  publishSubmissionChanged(id);

  try {
    await enqueueSubmission(id);
  } catch (error) {
    console.error("Could not enqueue rejudge", error);
    await db
      .update(submissions)
      .set({ status: "SYSTEM_ERROR", errorMessage: "The judge queue is unavailable.", judgedAt: new Date() })
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
    rows.filter((row) => isPendingVerdict(row.status)).map((row) => row.id),
  );
}
