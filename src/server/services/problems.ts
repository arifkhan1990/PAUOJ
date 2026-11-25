import {
  and,
  arrayContains,
  asc,
  count,
  eq,
  exists,
  ilike,
  inArray,
  isNull,
  notInArray,
  or,
  sql,
} from "drizzle-orm";
import { toOffset, type PaginationInput } from "@/server/api/validation";
import { getDb } from "@/server/db";
import {
  problemTags,
  problems,
  submissions,
  tags,
} from "@/server/db/schema";
import type { Difficulty, ProblemListItem } from "@/lib/types";
import { getRestrictedProblemIds } from "./problem-access";
import { loadTagsForProblems } from "./problem-tags";

export { getProblemBySlug } from "./problem-detail";

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

