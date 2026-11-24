import {
  and,
  arrayContains,
  asc,
  count,
  desc,
  eq,
  exists,
  ilike,
  inArray,
  isNull,
  notInArray,
  or,
  sql,
} from "drizzle-orm";
import { ApiError } from "@/server/api/errors";
import { toOffset, type PaginationInput } from "@/server/api/validation";
import { getDb } from "@/server/db";
import {
  problemContributions,
  problemTags,
  problems,
  submissions,
  tags,
  testCases,
  users,
} from "@/server/db/schema";
import type {
  Difficulty,
  ProblemDetail,
  ProblemListItem,
  ProblemTag,
} from "@/lib/types";
import { getActiveAssessmentForProblem } from "./assessment-access";
import { getActiveContestForProblem } from "./contests";
import {
  assertProblemContextUnlocked,
  buildProblemContestView,
  enforceContestCrewGuard,
  getEndedContestForProblem,
} from "./problem-contest-guard";
import { getRestrictedProblemIds } from "./problem-access";
import { getProblemRating } from "./problem-extras";

export type ProblemListInput = {
  page: PaginationInput;
  q?: string;
  difficulty?: Difficulty;
  tag?: string;
  category?: string;
  subcategory?: string;
  company?: string;
  userId: string | null;
  isAdmin: boolean;
};

async function loadTagsForProblems(
  problemIds: string[],
): Promise<Map<string, ProblemTag[]>> {
  const result = new Map<string, ProblemTag[]>();
  if (problemIds.length === 0) return result;
  const rows = await getDb()
    .select({
      problemId: problemTags.problemId,
      name: tags.name,
      slug: tags.slug,
    })
    .from(problemTags)
    .innerJoin(tags, eq(tags.id, problemTags.tagId))
    .where(inArray(problemTags.problemId, problemIds))
    .orderBy(asc(tags.name));

  for (const row of rows) {
    const list = result.get(row.problemId) ?? [];
    list.push({ name: row.name, slug: row.slug });
    result.set(row.problemId, list);
  }
  return result;
}

export async function listProblems(
  input: ProblemListInput,
): Promise<{ items: ProblemListItem[]; total: number }> {
  const db = getDb();
  const restricted = await getRestrictedProblemIds(input.userId, input.isAdmin);
  const conditions = [eq(problems.isPublic, true)];
  if (!input.isAdmin) {
    const { getEntitledModuleSlugs } = await import(
      "@/server/services/learning-payments"
    );
    const entitled = input.userId
      ? [...(await getEntitledModuleSlugs(input.userId))] 
      : [];
    conditions.push(
      entitled.length > 0
        ? or(
            isNull(problems.premiumModuleSlug),
            inArray(problems.premiumModuleSlug, entitled),
          )!
        : isNull(problems.premiumModuleSlug),
    );
  }

  if (restricted.length > 0) {
    conditions.push(notInArray(problems.id, restricted));
  }
  if (input.q) {
    const term = `%${input.q.trim()}%`;
    const search = or(
      ilike(problems.title, term),
      ilike(problems.slug, term),
    );
    if (search) conditions.push(search);
  }
  if (input.difficulty) {
    conditions.push(eq(problems.difficulty, input.difficulty));
  }
  if (input.category) {
    conditions.push(eq(problems.category, input.category));
  }
  if (input.subcategory) {
    conditions.push(eq(problems.subcategory, input.subcategory));
  }
  if (input.company) {
    conditions.push(arrayContains(problems.companies, [input.company]));
  }
  if (input.tag) {
    conditions.push(
      exists(
        db
          .select({ one: sql`1` })
          .from(problemTags)
          .innerJoin(tags, eq(tags.id, problemTags.tagId))
          .where(
            and(
              eq(problemTags.problemId, problems.id),
              eq(tags.slug, input.tag),
            ),
          ),
      ),
    );
  }

  const where = and(...conditions);
  const [totalRow] = await db
    .select({ value: count() })
    .from(problems)
    .where(where);

  const rows = await db
    .select({
      id: problems.id,
      slug: problems.slug,
      title: problems.title,
      difficulty: problems.difficulty,
      points: problems.points,
      acceptedCount: problems.acceptedCount,
      submissionCount: problems.submissionCount,
    })
    .from(problems)
    .where(where)
    .orderBy(asc(problems.createdAt), asc(problems.title))
    .limit(input.page.pageSize)
    .offset(toOffset(input.page));

  const problemIds = rows.map((row) => row.id);
  const tagMap = await loadTagsForProblems(problemIds);
  const solved = new Set<string>();
  const attempted = new Set<string>();

  if (input.userId && problemIds.length > 0) {
    const userRows = await db
      .select({ problemId: submissions.problemId, status: submissions.status })
      .from(submissions)
      .where(
        and(
          eq(submissions.userId, input.userId),
          inArray(submissions.problemId, problemIds),
        ),
      );
    for (const row of userRows) {
      attempted.add(row.problemId);
      if (row.status === "ACCEPTED") solved.add(row.problemId);
    }
  }

  return {
    total: Number(totalRow?.value ?? 0),
    items: rows.map((row) => ({
      id: row.id,
      slug: row.slug,
      title: row.title,
      difficulty: row.difficulty,
      points: row.points,
      acceptedCount: row.acceptedCount,
      submissionCount: row.submissionCount,
      tags: tagMap.get(row.id) ?? [],
      solvedByMe: solved.has(row.id),
      attemptedByMe: attempted.has(row.id),
    })),
  };
}

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
    .select({ id: testCases.id, input: testCases.input, output: testCases.expectedOutput })
    .from(testCases)
    .where(and(eq(testCases.problemId, problem.id), eq(testCases.isSample, true)))
    .orderBy(asc(testCases.position));
  const rating = await getProblemRating(problem.id, userId);
  const [author] = problem.authorId
    ? await db
        .select({ username: users.username, displayName: users.displayName })
        .from(users)
        .where(eq(users.id, problem.authorId))
        .limit(1)
    : [];
  const [editorialCredit] = problem.editorial
    ? await db
        .select({ username: users.username, displayName: users.displayName })
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
    author: author ?? null,
    editorialCredit: editorialCredit ?? null,
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
