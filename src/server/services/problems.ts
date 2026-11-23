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
import { ApiError, errors } from "@/server/api/errors";
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
  const contestAllowed = Boolean(contestAccess.active);
  const assessmentAllowed = Boolean(assessmentAccess.active);
  if (!problem.isPublic && !isAdmin && !contestAllowed && !assessmentAllowed) {
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

  if (hasActiveContext && !isAdmin && !contestAllowed && !assessmentAllowed) {
    if (assessmentAccess.restricted && assessmentAccess.blockingAssessment) {
      throw new ApiError(
        "ASSESSMENT_LOCKED",
        "This problem belongs to a running coding assessment. Join the assessment with your access code to open it.",
        403,
        assessmentAccess.blockingAssessment,
      );
    }
    throw new ApiError(
      "CONTEST_LOCKED",
      "This problem belongs to a running contest. Register for the contest to open it.",
      403,
      contestAccess.blockingContest,
    );
  }

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

  return {
    id: problem.id,
    slug: problem.slug,
    title: problem.title,
    statement: problem.statement,
    inputFormat: problem.inputFormat,
    outputFormat: problem.outputFormat,
    constraints: problem.constraints,
    editorial: solvedByMe || isAdmin ? problem.editorial : null,
    editorialLocked: Boolean(problem.editorial) && !solvedByMe && !isAdmin,
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
    contestContext: contestAccess.active
      ? {
          id: contestAccess.active.contestId,
          slug: contestAccess.active.slug,
          title: contestAccess.active.title,
          label: contestAccess.active.label,
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

export async function getProblemForSubmission(
  problemId: string,
  userId: string | null,
  isAdmin: boolean,
): Promise<{
  problem: ProblemDetail;
  contestContext: { id: string; label: string } | null;
  assessmentContext: { id: string; label: string } | null;
}> {
  const db = getDb();
  const rows = await db
    .select({ slug: problems.slug })
    .from(problems)
    .where(eq(problems.id, problemId))
    .limit(1);
  const row = rows[0];
  if (!row) throw errors.notFound("Problem not found.");
  const problem = await getProblemBySlug(row.slug, userId, isAdmin);
  if (!problem) throw errors.notFound("Problem not found.");
  return {
    problem,
    contestContext: problem.contestContext
      ? { id: problem.contestContext.id, label: problem.contestContext.label }
      : null,
    assessmentContext: problem.assessmentContext
      ? {
          id: problem.assessmentContext.id,
          label: problem.assessmentContext.label,
        }
      : null,
  };
}
