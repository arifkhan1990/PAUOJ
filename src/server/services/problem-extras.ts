import {
  and,
  asc,
  count,
  desc,
  eq,
  inArray,
  ne,
  notInArray,
  sql,
} from "drizzle-orm";
import { errors } from "@/server/api/errors";
import { getDb } from "@/server/db";
import {
  problemRatings,
  problemResources,
  problemTags,
  problems,
  users,
} from "@/server/db/schema";
import type {
  ProblemRatingSummary,
  ProblemResourceItem,
  RelatedProblemItem,
} from "@/lib/types";
import type {
  ProblemRatingInput,
  ProblemResourceInput,
} from "@/lib/schemas/problem-extras";
import type { SafeUser } from "@/server/auth/session";
import {
  assertProblemNotInLiveContext,
  getRestrictedProblemIds,
} from "./problem-access";

async function loadProblem(slug: string, viewer: { role: "USER" | "TEACHER" | "ADMIN" } | null) {
  const rows = await getDb()
    .select({
      id: problems.id,
      isPublic: problems.isPublic,
      authorId: problems.authorId,
    })
    .from(problems)
    .where(eq(problems.slug, slug))
    .limit(1);
  const problem = rows[0];
  if (!problem) throw errors.notFound("Problem not found.");
  if (!problem.isPublic && viewer?.role !== "ADMIN") {
    throw errors.notFound("Problem not found.");
  }
  return problem;
}

export async function getProblemRating(
  problemId: string,
  viewerId: string | null,
): Promise<ProblemRatingSummary> {
  const db = getDb();
  const [aggregate, mine] = await Promise.all([
    db
      .select({
        average: sql<number | null>`avg(${problemRatings.value})`,
        count: count(),
      })
      .from(problemRatings)
      .where(eq(problemRatings.problemId, problemId)),
    viewerId
      ? db
          .select({ value: problemRatings.value })
          .from(problemRatings)
          .where(
            and(
              eq(problemRatings.problemId, problemId),
              eq(problemRatings.userId, viewerId),
            ),
          )
          .limit(1)
      : Promise.resolve([]),
  ]);
  const average = aggregate[0]?.average;
  return {
    average: average === null || average === undefined ? null : Number(average) / 2,
    count: Number(aggregate[0]?.count ?? 0),
    myRating: mine[0] ? mine[0].value / 2 : null,
  };
}

export async function rateProblem(
  slug: string,
  user: Pick<SafeUser, "id" | "role">,
  input: ProblemRatingInput,
): Promise<ProblemRatingSummary> {
  const problem = await loadProblem(slug, user);
  await assertProblemNotInLiveContext(
    problem.id,
    "RATING_LOCKED",
    "Ratings are hidden while this problem is part of a running contest or assessment.",
  );
  const value = Math.round(input.rating * 2);
  const now = new Date();
  await getDb()
    .insert(problemRatings)
    .values({
      problemId: problem.id,
      userId: user.id,
      value,
      createdAt: now,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: [problemRatings.problemId, problemRatings.userId],
      set: { value, updatedAt: now },
    });
  return getProblemRating(problem.id, user.id);
}

export async function listProblemResources(
  problemId: string,
): Promise<ProblemResourceItem[]> {
  const rows = await getDb()
    .select({
      id: problemResources.id,
      title: problemResources.title,
      url: problemResources.url,
      description: problemResources.description,
      isVerified: problemResources.isVerified,
      createdAt: problemResources.createdAt,
      username: users.username,
      displayName: users.displayName,
    })
    .from(problemResources)
    .leftJoin(users, eq(users.id, problemResources.createdById))
    .where(eq(problemResources.problemId, problemId))
    .orderBy(asc(problemResources.createdAt));

  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    url: row.url,
    description: row.description,
    isVerified: row.isVerified,
    createdAt: row.createdAt.toISOString(),
    author:
      row.username && row.displayName
        ? { username: row.username, displayName: row.displayName }
        : null,
  }));
}

export async function getProblemResources(
  slug: string,
  viewer: { id: string; role: "USER" | "TEACHER" | "ADMIN" } | null,
): Promise<ProblemResourceItem[]> {
  const problem = await loadProblem(slug, viewer);
  await assertProblemNotInLiveContext(
    problem.id,
    "RESOURCES_LOCKED",
    "Resources are hidden while this problem is part of a running contest or assessment.",
  );
  return listProblemResources(problem.id);
}

export async function createProblemResource(
  slug: string,
  user: Pick<SafeUser, "id" | "role">,
  input: ProblemResourceInput,
): Promise<{ id: string }> {
  const problem = await loadProblem(slug, user);
  if (user.role !== "ADMIN" && problem.authorId !== user.id) {
    throw errors.forbidden(
      "Only the problem author or an admin can add resources.",
    );
  }
  await assertProblemNotInLiveContext(
    problem.id,
    "RESOURCES_LOCKED",
    "Resources are hidden while this problem is part of a running contest or assessment.",
  );
  const [row] = await getDb()
    .insert(problemResources)
    .values({
      problemId: problem.id,
      createdById: user.id,
      title: input.title,
      url: input.url,
      description: input.description?.trim() ? input.description.trim() : null,
    })
    .returning({ id: problemResources.id });
  if (!row) throw errors.unavailable("Could not save the resource.");
  return { id: row.id };
}

export async function deleteProblemResource(
  slug: string,
  user: Pick<SafeUser, "id" | "role">,
  resourceId: string,
): Promise<void> {
  const problem = await loadProblem(slug, user);
  const rows = await getDb()
    .select({
      id: problemResources.id,
      problemId: problemResources.problemId,
      createdById: problemResources.createdById,
    })
    .from(problemResources)
    .where(
      and(
        eq(problemResources.id, resourceId),
        eq(problemResources.problemId, problem.id),
      ),
    )
    .limit(1);
  const resource = rows[0];
  if (!resource) throw errors.notFound("Resource not found.");
  if (
    user.role !== "ADMIN" &&
    resource.createdById !== user.id &&
    problem.authorId !== user.id
  ) {
    throw errors.forbidden("You cannot delete this resource.");
  }
  await getDb().delete(problemResources).where(eq(problemResources.id, resource.id));
}

export async function getRelatedProblems(
  problemId: string,
  userId: string | null,
  isAdmin: boolean,
  limit = 4,
): Promise<RelatedProblemItem[]> {
  const db = getDb();
  const tagRows = await db
    .select({ tagId: problemTags.tagId })
    .from(problemTags)
    .where(eq(problemTags.problemId, problemId));
  const tagIds = tagRows.map((row) => row.tagId);
  if (tagIds.length === 0) return [];

  const restricted = await getRestrictedProblemIds(userId, isAdmin);
  const conditions = [
    eq(problems.isPublic, true),
    ne(problems.id, problemId),
    inArray(problemTags.tagId, tagIds),
  ];
  if (restricted.length > 0) {
    conditions.push(notInArray(problems.id, restricted));
  }

  const shared = sql<number>`count(${problemTags.tagId})::int`.as("shared");
  const rows = await db
    .select({
      slug: problems.slug,
      title: problems.title,
      difficulty: problems.difficulty,
      points: problems.points,
      sharedTags: shared,
    })
    .from(problemTags)
    .innerJoin(problems, eq(problems.id, problemTags.problemId))
    .where(and(...conditions))
    .groupBy(problems.id, problems.slug, problems.title, problems.difficulty, problems.points)
    .orderBy(desc(shared), asc(problems.points))
    .limit(limit);

  return rows.map((row) => ({
    slug: row.slug,
    title: row.title,
    difficulty: row.difficulty,
    points: row.points,
    sharedTags: Number(row.sharedTags),
  }));
}
