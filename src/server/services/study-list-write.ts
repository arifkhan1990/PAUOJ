import { and, eq, inArray, ne } from "drizzle-orm";
import type { StudyListInput, StudyListSectionInput } from "@/lib/schemas/study-list";
import { isReservedStudyListSlug } from "@/lib/study-list";
import { slugify } from "@/lib/utils";
import { errors } from "@/server/api/errors";
import type { Database } from "@/server/db";
import { problems, studyListItems, studyListSections, studyLists } from "@/server/db/schema";

export type StudyListTransaction = Parameters<
  Parameters<Database["transaction"]>[0]
>[0];

export async function insertSectionsAndItems(
  tx: StudyListTransaction,
  listId: string,
  sections: readonly StudyListSectionInput[],
): Promise<void> {
  const sectionRows = await tx
    .insert(studyListSections)
    .values(
      sections.map((section, index) => ({
        listId,
        title: section.title,
        description: section.description,
        position: index + 1,
      })),
    )
    .returning({ id: studyListSections.id, position: studyListSections.position });
  const idByPosition = new Map(sectionRows.map((row) => [row.position, row.id]));

  const items: Array<{
    listId: string;
    problemId: string;
    sectionId: string;
    position: number;
  }> = [];
  let position = 0;
  sections.forEach((section, index) => {
    const sectionId = idByPosition.get(index + 1);
    if (!sectionId) return;
    for (const problemId of section.problemIds) {
      position += 1;
      items.push({ listId, problemId, sectionId, position });
    }
  });
  if (items.length > 0) {
    await tx.insert(studyListItems).values(items);
  }
}

export function resolveSlug(input: StudyListInput): string {
  const slug = input.slug || slugify(input.title);
  if (!slug) throw errors.validation("Give the list a valid slug.");
  if (isReservedStudyListSlug(slug)) {
    throw errors.validation("That slug is reserved. Choose another one.");
  }
  return slug;
}

/**
 * Study plans may only reference problems that are public and fully published.
 * Runs inside the caller's transaction.
 */
const PUBLISHED_ONLY_MESSAGE =
  "Study plans can only include published public problems.";

export async function assertPublishedProblems(
  tx: StudyListTransaction,
  sections: readonly StudyListSectionInput[],
): Promise<void> {
  const problemIds = [
    ...new Set(sections.flatMap((section) => section.problemIds)),
  ];
  if (problemIds.length === 0) {
    throw errors.validation(PUBLISHED_ONLY_MESSAGE);
  }
  const rows = await tx
    .select({ id: problems.id })
    .from(problems)
    .where(
      and(
        inArray(problems.id, problemIds),
        eq(problems.isPublic, true),
        eq(problems.publicationStatus, "PUBLISHED"),
      ),
    );
  if (rows.length !== problemIds.length) {
    throw errors.validation(PUBLISHED_ONLY_MESSAGE);
  }
}

/** Throws a 409 when another plan already uses the slug. */
export async function assertSlugAvailable(
  tx: StudyListTransaction,
  slug: string,
  excludeId?: string,
): Promise<void> {
  const where = excludeId
    ? and(eq(studyLists.slug, slug), ne(studyLists.id, excludeId))
    : eq(studyLists.slug, slug);
  const [existing] = await tx
    .select({ id: studyLists.id })
    .from(studyLists)
    .where(where)
    .limit(1);
  if (existing) {
    throw errors.conflict("A study list with that slug already exists.");
  }
}
