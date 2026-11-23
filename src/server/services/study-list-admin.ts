import { and, asc, count, desc, eq, inArray, ne } from "drizzle-orm";
import type {
  StudyListInput,
  StudyListSectionInput,
} from "@/lib/schemas/study-list";
import { estimateStudyMinutes } from "@/lib/study-list";
import type {
  AdminStudyListDetail,
  AdminStudyListSection,
  AdminStudyListSummary,
  StudyListLevel,
} from "@/lib/study-list-types";
import { errors } from "@/server/api/errors";
import { getDb, type Database } from "@/server/db";
import {
  problems,
  studyListItems,
  studyListSections,
  studyLists,
} from "@/server/db/schema";
import { slugify } from "@/lib/utils";

type Transaction = Parameters<Parameters<Database["transaction"]>[0]>[0];

type AdminListRow = {
  id: string;
  slug: string;
  title: string;
  description: string;
  isPublic: boolean;
  level: StudyListLevel;
  estimatedMinutes: number | null;
  isFeatured: boolean;
  updatedAt: Date;
};

async function insertSectionsAndItems(
  tx: Transaction,
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
  const idByPosition = new Map(
    sectionRows.map((row) => [row.position, row.id]),
  );

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

function resolveSlug(input: StudyListInput): string {
  const slug = input.slug || slugify(input.title);
  if (!slug) throw errors.validation("Give the list a valid slug.");
  return slug;
}

/**
 * Study plans are public content, so they may only reference problems that are
 * public and fully published. Runs inside the caller's transaction.
 */
const PUBLISHED_ONLY_MESSAGE =
  "Study plans can only include published public problems.";

async function assertPublishedProblems(
  tx: Transaction,
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

export async function listAdminStudyLists(): Promise<AdminStudyListSummary[]> {
  const db = getDb();
  const [lists, sectionCounts, itemRows] = await Promise.all([
    db
      .select({
        id: studyLists.id,
        slug: studyLists.slug,
        title: studyLists.title,
        isPublic: studyLists.isPublic,
        level: studyLists.level,
        isFeatured: studyLists.isFeatured,
        estimatedMinutes: studyLists.estimatedMinutes,
        updatedAt: studyLists.updatedAt,
      })
      .from(studyLists)
      .orderBy(desc(studyLists.updatedAt), asc(studyLists.title)),
    db
      .select({ listId: studyListSections.listId, value: count() })
      .from(studyListSections)
      .groupBy(studyListSections.listId),
    db
      .select({
        listId: studyListItems.listId,
        difficulty: problems.difficulty,
        sectionId: studyListItems.sectionId,
      })
      .from(studyListItems)
      .innerJoin(problems, eq(problems.id, studyListItems.problemId)),
  ]);

  const sectionsByList = new Map(
    sectionCounts.map((row) => [row.listId, Number(row.value)]),
  );
  const problemsByList = new Map<string, string[]>();
  const listsWithGeneralSection = new Set<string>();
  for (const row of itemRows) {
    const bucket = problemsByList.get(row.listId) ?? [];
    bucket.push(row.difficulty);
    problemsByList.set(row.listId, bucket);
    if (!row.sectionId) listsWithGeneralSection.add(row.listId);
  }

  return lists.map((list) => {
    const difficulties = problemsByList.get(list.id) ?? [];
    return {
      id: list.id,
      slug: list.slug,
      title: list.title,
      isPublic: list.isPublic,
      level: list.level,
      isFeatured: list.isFeatured,
      problemCount: difficulties.length,
      sectionCount:
        (sectionsByList.get(list.id) ?? 0) +
        (listsWithGeneralSection.has(list.id) ? 1 : 0),
      estimatedMinutes: list.estimatedMinutes,
      durationMinutes:
        list.estimatedMinutes ??
        estimateStudyMinutes(
          difficulties.map((difficulty) => ({ difficulty })),
        ),
      updatedAt: list.updatedAt.toISOString(),
    };
  });
}

export async function getAdminStudyList(
  id: string,
): Promise<AdminStudyListDetail | null> {
  const db = getDb();
  const [list]: AdminListRow[] = await db
    .select()
    .from(studyLists)
    .where(eq(studyLists.id, id))
    .limit(1);
  if (!list) return null;

  const [sectionRows, itemRows] = await Promise.all([
    db
      .select({
        id: studyListSections.id,
        title: studyListSections.title,
        description: studyListSections.description,
      })
      .from(studyListSections)
      .where(eq(studyListSections.listId, id))
      .orderBy(asc(studyListSections.position)),
    db
      .select({
        problemId: studyListItems.problemId,
        sectionId: studyListItems.sectionId,
      })
      .from(studyListItems)
      .where(eq(studyListItems.listId, id))
      .orderBy(asc(studyListItems.position)),
  ]);

  const bySection = new Map<string, string[]>();
  const general: string[] = [];
  for (const item of itemRows) {
    if (!item.sectionId) {
      general.push(item.problemId);
      continue;
    }
    const bucket = bySection.get(item.sectionId) ?? [];
    bucket.push(item.problemId);
    bySection.set(item.sectionId, bucket);
  }

  const sections: AdminStudyListSection[] = sectionRows.map((section) => ({
    id: section.id,
    title: section.title,
    description: section.description,
    problemIds: bySection.get(section.id) ?? [],
  }));
  if (general.length > 0) {
    sections.push({
      id: null,
      title: "General",
      description: "",
      problemIds: general,
    });
  }

  return {
    id: list.id,
    slug: list.slug,
    title: list.title,
    description: list.description,
    isPublic: list.isPublic,
    level: list.level,
    estimatedMinutes: list.estimatedMinutes,
    isFeatured: list.isFeatured,
    sections,
  };
}

export async function createStudyList(
  adminId: string,
  input: StudyListInput,
): Promise<{ id: string; slug: string }> {
  const slug = resolveSlug(input);
  const db = getDb();
  const id = await db.transaction(async (tx) => {
    const [existing] = await tx
      .select({ id: studyLists.id })
      .from(studyLists)
      .where(eq(studyLists.slug, slug))
      .limit(1);
    if (existing) {
      throw errors.conflict("A study list with that slug already exists.");
    }
    await assertPublishedProblems(tx, input.sections);
    const [created] = await tx
      .insert(studyLists)
      .values({
        slug,
        title: input.title,
        description: input.description,
        isPublic: input.isPublic,
        level: input.level,
        estimatedMinutes: input.estimatedMinutes,
        isFeatured: input.isFeatured,
        createdBy: adminId,
      })
      .returning({ id: studyLists.id });
    if (!created) throw errors.unavailable("Could not create the list.");
    await insertSectionsAndItems(tx, created.id, input.sections);
    return created.id;
  });
  return { id, slug };
}

export async function updateStudyList(
  id: string,
  input: StudyListInput,
): Promise<{ id: string; slug: string }> {
  const slug = resolveSlug(input);
  const db = getDb();
  await db.transaction(async (tx) => {
    const [existing] = await tx
      .select({ id: studyLists.id })
      .from(studyLists)
      .where(eq(studyLists.id, id))
      .limit(1);
    if (!existing) throw errors.notFound("Study list not found.");

    const [conflict] = await tx
      .select({ id: studyLists.id })
      .from(studyLists)
      .where(and(eq(studyLists.slug, slug), ne(studyLists.id, id)))
      .limit(1);
    if (conflict) {
      throw errors.conflict("A study list with that slug already exists.");
    }

    await assertPublishedProblems(tx, input.sections);

    await tx
      .update(studyLists)
      .set({
        slug,
        title: input.title,
        description: input.description,
        isPublic: input.isPublic,
        level: input.level,
        estimatedMinutes: input.estimatedMinutes,
        isFeatured: input.isFeatured,
        updatedAt: new Date(),
      })
      .where(eq(studyLists.id, id));

    // Items go first so the section foreign key never blocks the deletion.
    await tx.delete(studyListItems).where(eq(studyListItems.listId, id));
    await tx.delete(studyListSections).where(eq(studyListSections.listId, id));
    await insertSectionsAndItems(tx, id, input.sections);
  });
  return { id, slug };
}
