import { and, asc, desc, eq } from "drizzle-orm";
import { ApiError } from "@/server/api/errors";
import { getDb } from "@/server/db";
import {
  problemContributions,
  problems,
  submissions,
  testCases,
  users,
} from "@/server/db/schema";
import type { ProblemDetail } from "@/lib/types";
import { getActiveAssessmentForProblem } from "./assessment-access";
import { getActiveContestForProblem } from "./contests";
import {
  assertProblemContextUnlocked,
  buildProblemContestView,
  enforceContestCrewGuard,
  getEndedContestForProblem,
} from "./problem-contest-guard";
import { getProblemRating } from "./problem-extras";
import { loadTagsForProblems } from "./problem-tags";

export async function getProblemBySlug(
  slug: string,
  userId: string | null,
  isAdmin: boolean,
): Promise<ProblemDetail | null> {
  const db = getDb();
  const rows = await db
    .select()
    .from(problems)
    .where(eq(problems.slug, slug))
    .limit(1);
  const problem = rows[0];
  if (!problem) return null;

  const [contestAccess, assessmentAccess] = await Promise.all([
    getActiveContestForProblem(problem.id, userId, isAdmin),
    getActiveAssessmentForProblem(problem.id, userId, isAdmin),
  ]);
  const directorContext = await enforceContestCrewGuard(
    problem.id,
    userId,
    !isAdmin && Boolean(contestAccess.active || contestAccess.restricted),
  );
  const contestAllowed =
    Boolean(contestAccess.active) || Boolean(directorContext);
  const assessmentAllowed = Boolean(assessmentAccess.active);
  const archivedContest =
    !problem.isPublic && !contestAllowed && !assessmentAllowed
      ? await getEndedContestForProblem(problem.id)
      : null;
  const archivedAllowed = Boolean(archivedContest);
  if (
    !problem.isPublic &&
    !isAdmin &&
    !contestAllowed &&
    !assessmentAllowed &&
    !archivedAllowed
  ) {
    return null;
  }
  if (problem.premiumModuleSlug && !isAdmin) {
    const { hasModuleEntitlement } = await import(
      "@/server/services/learning-payments"
    );
    if (
      !userId ||
      !(await hasModuleEntitlement(userId, problem.premiumModuleSlug))
    ) {
      throw new ApiError(
        "PREMIUM_LOCKED",
        "This problem is part of a premium module. Unlock it from the learning pricing page.",
        403,
        {
          slug: problem.slug,
          title: problem.title,
          moduleSlug: problem.premiumModuleSlug,
        },
      );
    }
  }
  const hasActiveContext =
    contestAllowed ||
    contestAccess.restricted ||
    assessmentAllowed ||
    assessmentAccess.restricted;

  assertProblemContextUnlocked({
    hasActiveContext,
    contestAllowed,
    assessmentAllowed,
    isAdmin,
    blockingContest: contestAccess.blockingContest,
    assessmentRestricted: assessmentAccess.restricted,
    blockingAssessment: assessmentAccess.blockingAssessment,
  });

  const tagMap = await loadTagsForProblems([problem.id]);
  const samples = await db
    .select({
      id: testCases.id,
      input: testCases.input,
      output: testCases.expectedOutput,
    })
    .from(testCases)
    .where(
      and(eq(testCases.problemId, problem.id), eq(testCases.isSample, true)),
    )
    .orderBy(asc(testCases.position));
  const rating = await getProblemRating(problem.id, userId);
  const [author] = problem.authorId
    ? await db
        .select({
          username: users.username,
          displayName: users.displayName,
          avatarPreset: users.avatarPreset,
          avatarImageUpdatedAt: users.avatarImageUpdatedAt,
        })
        .from(users)
        .where(eq(users.id, problem.authorId))
        .limit(1)
    : [];
  const [editorialCredit] = problem.editorial
    ? await db
        .select({
          username: users.username,
          displayName: users.displayName,
          avatarPreset: users.avatarPreset,
          avatarImageUpdatedAt: users.avatarImageUpdatedAt,
        })
        .from(problemContributions)
        .innerJoin(users, eq(users.id, problemContributions.contributorId))
        .where(
          and(
            eq(problemContributions.problemId, problem.id),
            eq(problemContributions.kind, "EDITORIAL"),
            eq(problemContributions.status, "APPROVED"),
          ),
        )
        .orderBy(desc(problemContributions.reviewedAt))
        .limit(1)
    : [];

  let solvedByMe = false;
  let attemptedByMe = false;
  if (userId) {
    const userRows = await db
      .select({ status: submissions.status })
      .from(submissions)
      .where(
        and(
          eq(submissions.userId, userId),
          eq(submissions.problemId, problem.id),
        ),
      );
    attemptedByMe = userRows.length > 0;
    solvedByMe = userRows.some((row) => row.status === "ACCEPTED");
  }

  const contestView = await buildProblemContestView({
    contestAccess,
    directorContext,
    userId,
    isAdmin,
  });

  return {
    id: problem.id,
    slug: problem.slug,
    title: problem.title,
    isPublic: problem.isPublic,
    statement: problem.statement,
    inputFormat: problem.inputFormat,
    outputFormat: problem.outputFormat,
    constraints: problem.constraints,
    editorial: contestView.editorialSealed
      ? null
      : solvedByMe || isAdmin
        ? problem.editorial
        : null,
    editorialLocked: contestView.editorialSealed
      ? true
      : Boolean(problem.editorial) && !solvedByMe && !isAdmin,
    difficulty: problem.difficulty,
    points: problem.points,
    judgeLanguage: problem.judgeLanguage,
    premiumModuleSlug: problem.premiumModuleSlug,
    timeLimitMs: problem.timeLimitMs,
    memoryLimitMb: problem.memoryLimitMb,
    authorId: problem.authorId,
    author: author
      ? {
          username: author.username,
          displayName: author.displayName,
          avatarPreset: author.avatarPreset,
          avatarImageUpdatedAt:
            author.avatarImageUpdatedAt?.toISOString() ?? null,
        }
      : null,
    editorialCredit: editorialCredit
      ? {
          username: editorialCredit.username,
          displayName: editorialCredit.displayName,
          avatarPreset: editorialCredit.avatarPreset,
          avatarImageUpdatedAt:
            editorialCredit.avatarImageUpdatedAt?.toISOString() ?? null,
        }
      : null,
    acceptedCount: problem.acceptedCount,
    submissionCount: problem.submissionCount,
    tags: tagMap.get(problem.id) ?? [],
    samples,
    rating,
    solvedByMe,
    attemptedByMe,
    contestContext: contestView.activeContest
      ? {
          id: contestView.activeContest.contestId,
          slug: contestView.activeContest.slug,
          title: contestView.activeContest.title,
          label: contestView.activeContest.label,
          endAt: contestView.activeContest.endAt.toISOString(),
          status: contestView.status ?? "RUNNING",
          integrityWatermark: contestView.integrityWatermark,
          editorialLocked: contestView.editorialSealed,
        }
      : archivedContest
        ? {
            id: archivedContest.contestId,
            slug: archivedContest.slug,
            title: archivedContest.title,
            label: archivedContest.label,
            endAt: archivedContest.endAt.toISOString(),
            status: "ENDED",
            integrityWatermark: null,
            editorialLocked: false,
          }
        : null,
    assessmentContext: assessmentAccess.active
      ? {
          id: assessmentAccess.active.assessmentId,
          slug: assessmentAccess.active.slug,
          title: assessmentAccess.active.title,
          label: assessmentAccess.active.label,
          expiresAt: (
            assessmentAccess.active.expiresAt ?? assessmentAccess.active.endAt
          ).toISOString(),
        }
      : null,
  };
}
