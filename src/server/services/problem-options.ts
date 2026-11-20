import { and, asc, eq, isNotNull, notInArray, or } from "drizzle-orm";
import { getDb } from "@/server/db";
import { problemTags, problems, tags } from "@/server/db/schema";
import type { ProblemOption, ProblemTag } from "@/lib/types";
import { getRestrictedProblemIds } from "./problem-access";

export type ProblemFacets = {
  categories: string[];
  subcategories: string[];
  companies: string[];
};

export async function listProblemOptions(
  authorId?: string,
): Promise<ProblemOption[]> {
  const rows = await getDb()
    .select({
      id: problems.id,
      title: problems.title,
      slug: problems.slug,
      difficulty: problems.difficulty,
    })
    .from(problems)
    .where(
      authorId
        ? or(eq(problems.isPublic, true), eq(problems.authorId, authorId))
        : undefined,
    )
    .orderBy(asc(problems.title));
  return rows;
}

export async function listProblemTags(
  userId: string | null,
  isAdmin: boolean,
): Promise<ProblemTag[]> {
  const restricted = await getRestrictedProblemIds(userId, isAdmin);
  const conditions = [eq(problems.isPublic, true)];
  if (restricted.length > 0) {
    conditions.push(notInArray(problems.id, restricted));
  }
  return getDb()
    .selectDistinct({ name: tags.name, slug: tags.slug })
    .from(tags)
    .innerJoin(problemTags, eq(problemTags.tagId, tags.id))
    .innerJoin(problems, eq(problems.id, problemTags.problemId))
    .where(and(...conditions))
    .orderBy(asc(tags.name));
}

export async function listProblemFacets(
  userId: string | null,
  isAdmin: boolean,
): Promise<ProblemFacets> {
  const db = getDb();
  const restricted = await getRestrictedProblemIds(userId, isAdmin);
  const conditions = [eq(problems.isPublic, true)];
  if (restricted.length > 0) {
    conditions.push(notInArray(problems.id, restricted));
  }

  const [categoryRows, subcategoryRows, companyRows] = await Promise.all([
    db
      .selectDistinct({ value: problems.category })
      .from(problems)
      .where(and(...conditions, isNotNull(problems.category)))
      .orderBy(asc(problems.category)),
    db
      .selectDistinct({ value: problems.subcategory })
      .from(problems)
      .where(and(...conditions, isNotNull(problems.subcategory)))
      .orderBy(asc(problems.subcategory)),
    db
      .select({ companies: problems.companies })
      .from(problems)
      .where(and(...conditions)),
  ]);

  return {
    categories: categoryRows
      .map((row) => row.value)
      .filter((value): value is string => Boolean(value)),
    subcategories: subcategoryRows
      .map((row) => row.value)
      .filter((value): value is string => Boolean(value)),
    companies: [...new Set(companyRows.flatMap((row) => row.companies))].sort(
      (left, right) => left.localeCompare(right),
    ),
  };
}
