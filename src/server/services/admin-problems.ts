import { and, asc, count, desc, eq, ilike, sql } from "drizzle-orm";
import { ApiError, errors } from "@/server/api/errors";
import { toOffset, type PaginationInput } from "@/server/api/validation";
import type { Database } from "@/server/db";
import { getDb } from "@/server/db";
import {
  problemTags,
  problems,
  tags,
  testCases,
} from "@/server/db/schema";
import type { ProblemInput } from "@/lib/schemas/problem";
import type {
  AdminProblemDetail,
  AdminProblemListItem,
} from "@/lib/types";
import { slugify } from "@/lib/utils";
import type { SafeUser } from "@/server/auth/session";
import { countPendingContributions } from "./problem-contributions";
import { assertProblemNotInLiveContext } from "./problem-access";
import { notifyProblemReviewRequested } from "./problem-review-notify";
import { canEditProblemContent } from "./problem-review-policy";

type Transaction = Parameters<
  Parameters<Database["transaction"]>[0]
>[0];

async function syncTags(
  tx: Transaction,
  problemId: string,
  tagNames: string[],
): Promise<void> {
  for (const name of tagNames) {
    const slug = slugify(name);
    if (!slug) continue;
    const [tag] = await tx
      .insert(tags)
      .values({ name: name.trim(), slug })
      .onConflictDoUpdate({ target: tags.slug, set: { name: name.trim() } })
      .returning({ id: tags.id });
    if (tag) {
      await tx
        .insert(problemTags)
        .values({ problemId, tagId: tag.id })
        .onConflictDoNothing();
    }
  }
}

async function assertSlugAvailable(
  slug: string,
  excludeId?: string,
): Promise<void> {
  const rows = await getDb()
    .select({ id: problems.id })
    .from(problems)
    .where(eq(problems.slug, slug))
    .limit(1);
  const row = rows[0];
  if (row && row.id !== excludeId) {
    throw errors.conflict("A problem with that slug already exists.");
  }
}

export async function createProblem(
  authorId: string,
  input: ProblemInput,
): Promise<{ id: string; slug: string }> {
  const db = getDb();
  const slug = input.slug || slugify(input.title);
  if (!slug) throw errors.validation("Give the problem a valid slug.");
  await assertSlugAvailable(slug);

  const id = await db.transaction(async (tx) => {
    const [created] = await tx
      .insert(problems)
      .values({
        slug,
        title: input.title,
        statement: input.statement,
        inputFormat: input.inputFormat || null,
        outputFormat: input.outputFormat || null,
        constraints: input.constraints || null,
        editorial: input.editorial || null,
        category: input.category?.trim() || null,
        subcategory: input.subcategory?.trim() || null,
        companies: input.companies,
        checkerType: input.checkerType,
        checkerSource: input.checkerSource || null,
        floatTolerance: input.floatTolerance,
        difficulty: input.difficulty,
        points: input.points,
        timeLimitMs: input.timeLimitMs,
        memoryLimitMb: input.memoryLimitMb,
        isPublic: false,
        publicationStatus: "IN_REVIEW",
        reviewCycle: 1,
        publishedAt: null,
        authorId,
      })
      .returning({ id: problems.id });
    if (!created) {
      throw new ApiError("CREATE_FAILED", "Could not create the problem.", 500);
    }
    await syncTags(tx, created.id, input.tags);
    await tx.insert(testCases).values(
      input.tests.map((test, index) => ({
        problemId: created.id,
        input: test.input,
        expectedOutput: test.expectedOutput,
        isSample: test.isSample,
        position: index + 1,
      })),
    );
    return created.id;
  });

  await notifyProblemReviewRequested(id, 1);
  return { id, slug };
}

export async function updateProblem(
  id: string,
  input: ProblemInput,
  actor: Pick<SafeUser, "id" | "role">,
): Promise<{ id: string; slug: string }> {
  const db = getDb();
  const slug = input.slug || slugify(input.title);
  if (!slug) throw errors.validation("Give the problem a valid slug.");
  await assertSlugAvailable(slug, id);
  await assertProblemNotInLiveContext(
    id,
    "PROBLEM_LOCKED",
    "This problem belongs to a running contest or assessment. Edit it after the round ends.",
  );

  await db.transaction(async (tx) => {
    const [problem] = await tx
      .select({
        id: problems.id,
        authorId: problems.authorId,
        publicationStatus: problems.publicationStatus,
      })
      .from(problems)
      .where(
        actor.role === "ADMIN"
          ? eq(problems.id, id)
          : and(eq(problems.id, id), eq(problems.authorId, actor.id)),
      )
      .for("update")
      .limit(1);
    if (!problem) throw errors.notFound("Problem not found.");
    if (
      !canEditProblemContent({
        viewerId: actor.id,
        viewerRole: actor.role,
        authorId: problem.authorId,
        status: problem.publicationStatus,
      })
    ) {
      throw errors.conflict(
        problem.publicationStatus === "PUBLISHED"
          ? "Published problems are locked. Publication review is terminal for this workflow."
          : "This problem is locked while two setters review it. Ask a reviewer to put it on hold before editing.",
      );
    }

    await tx
      .update(problems)
      .set({
        slug,
        title: input.title,
        statement: input.statement,
        inputFormat: input.inputFormat || null,
        outputFormat: input.outputFormat || null,
        constraints: input.constraints || null,
        editorial: input.editorial || null,
        category: input.category?.trim() || null,
        subcategory: input.subcategory?.trim() || null,
        companies: input.companies,
        checkerType: input.checkerType,
        checkerSource: input.checkerSource || null,
        floatTolerance: input.floatTolerance,
        difficulty: input.difficulty,
        points: input.points,
        timeLimitMs: input.timeLimitMs,
        memoryLimitMb: input.memoryLimitMb,
        updatedAt: new Date(),
      })
      .where(eq(problems.id, id));
    await tx.delete(problemTags).where(eq(problemTags.problemId, id));
    await tx.delete(testCases).where(eq(testCases.problemId, id));
    await syncTags(tx, id, input.tags);
    await tx.insert(testCases).values(
      input.tests.map((test, index) => ({
        problemId: id,
        input: test.input,
        expectedOutput: test.expectedOutput,
        isSample: test.isSample,
        position: index + 1,
      })),
    );
  });

  return { id, slug };
}

export async function getAdminProblemDetail(
  id: string,
  authorId?: string,
): Promise<AdminProblemDetail | null> {
  const db = getDb();
  const rows = await db
    .select()
    .from(problems)
    .where(
      authorId
        ? and(eq(problems.id, id), eq(problems.authorId, authorId))
        : eq(problems.id, id),
    )
    .limit(1);
  const problem = rows[0];
  if (!problem) return null;

  const tagRows = await db
    .select({ name: tags.name })
    .from(problemTags)
    .innerJoin(tags, eq(tags.id, problemTags.tagId))
    .where(eq(problemTags.problemId, id))
    .orderBy(asc(tags.name));

  const testRows = await db
    .select({
      input: testCases.input,
      expectedOutput: testCases.expectedOutput,
      isSample: testCases.isSample,
    })
    .from(testCases)
    .where(eq(testCases.problemId, id))
    .orderBy(asc(testCases.position));

  const pendingContributions = await countPendingContributions(id);

  return {
    id: problem.id,
    slug: problem.slug,
    title: problem.title,
    statement: problem.statement,
    inputFormat: problem.inputFormat,
    outputFormat: problem.outputFormat,
    constraints: problem.constraints,
    editorial: problem.editorial,
    category: problem.category,
    subcategory: problem.subcategory,
    companies: problem.companies,
    checkerType: problem.checkerType,
    checkerSource: problem.checkerSource,
    floatTolerance: problem.floatTolerance,
    difficulty: problem.difficulty,
    points: problem.points,
    timeLimitMs: problem.timeLimitMs,
    memoryLimitMb: problem.memoryLimitMb,
    isPublic: problem.isPublic,
    publicationStatus: problem.publicationStatus,
    reviewCycle: problem.reviewCycle,
    publishedAt: problem.publishedAt?.toISOString() ?? null,
    tags: tagRows.map((row) => row.name),
    tests: testRows,
    pendingContributions,
  };
}

export async function listAdminProblems(
  page: PaginationInput,
  q?: string,
  authorId?: string,
): Promise<{ items: AdminProblemListItem[]; total: number }> {
  const db = getDb();
  const where = and(
    q ? ilike(problems.title, `%${q}%`) : undefined,
    authorId ? eq(problems.authorId, authorId) : undefined,
  );
  const [totalRow] = await db
    .select({ value: count() })
    .from(problems)
    .where(where);
  const testCount = sql<number>`(select count(*)::int from test_cases tc where tc.problem_id = "problems"."id")`;
  const pendingContributions = sql<number>`(select count(*)::int from problem_contributions pc where pc.problem_id = "problems"."id" and pc.status = 'PENDING')`;
  const approvalCount = sql<number>`(select count(*)::int from problem_review_approvals pra where pra.problem_id = "problems"."id" and pra.cycle = "problems"."review_cycle" and pra.status = 'ACTIVE')`;
  const openHoldCount = sql<number>`(select count(*)::int from problem_review_holds prh where prh.problem_id = "problems"."id" and prh.status in ('OPEN', 'ADDRESSED'))`;
  const rows = await db
    .select({
      id: problems.id,
      slug: problems.slug,
      title: problems.title,
      difficulty: problems.difficulty,
      isPublic: problems.isPublic,
      publicationStatus: problems.publicationStatus,
      reviewCycle: problems.reviewCycle,
      publishedAt: problems.publishedAt,
      submissionCount: problems.submissionCount,
      testCount,
      pendingContributions,
      approvalCount,
      openHoldCount,
      updatedAt: problems.updatedAt,
    })
    .from(problems)
    .where(where)
    .orderBy(desc(problems.updatedAt))
    .limit(page.pageSize)
    .offset(toOffset(page));

  return {
    total: Number(totalRow?.value ?? 0),
    items: rows.map((row) => ({
      id: row.id,
      slug: row.slug,
      title: row.title,
      difficulty: row.difficulty,
      isPublic: row.isPublic,
      publicationStatus: row.publicationStatus,
      reviewCycle: row.reviewCycle,
      approvalCount: Number(row.approvalCount),
      openHoldCount: Number(row.openHoldCount),
      publishedAt: row.publishedAt?.toISOString() ?? null,
      submissionCount: row.submissionCount,
      testCount: Number(row.testCount),
      pendingContributions: Number(row.pendingContributions),
      updatedAt: row.updatedAt.toISOString(),
    })),
  };
}
