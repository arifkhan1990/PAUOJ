import { asc, eq, inArray } from "drizzle-orm";
import { getDb } from "@/server/db";
import { problemTags, tags } from "@/server/db/schema";
import type { ProblemTag } from "@/lib/types";

/** Tags for a batch of problems, grouped and ordered by tag name. */
export async function loadTagsForProblems(
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
