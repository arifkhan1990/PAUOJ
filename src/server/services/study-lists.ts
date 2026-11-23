import { and, asc, desc, eq } from "drizzle-orm";
import type { UserRole } from "@/lib/types";
import type { StudyListDetail, StudyListSummary } from "@/lib/study-list-types";
import { errors } from "@/server/api/errors";
import { getDb } from "@/server/db";
import { studyListEnrollments, studyLists } from "@/server/db/schema";
import {
  buildStudyListSections,
  buildStudyListSummary,
  collectListTopics,
  countListSections,
  groupItemsByList,
  groupListProblems,
  loadProblemTopics,
  loadStudyListItems,
  loadStudyListSections,
  loadViewerEnrollments,
  loadViewerProblemState,
} from "./study-list-data";

export {
  createStudyList,
  getAdminStudyList,
  listAdminStudyLists,
  updateStudyList,
} from "./study-list-admin";

export type StudyListViewer = { id: string; role: UserRole } | null;

type ListRow = {
  id: string;
  slug: string;
  title: string;
  description: string;
  level: StudyListDetail["level"];
  estimatedMinutes: number | null;
  isFeatured: boolean;
  isPublic: boolean;
  updatedAt: Date;
};

function publicListColumns() {
  return {
    id: studyLists.id,
    slug: studyLists.slug,
    title: studyLists.title,
    description: studyLists.description,
    level: studyLists.level,
    estimatedMinutes: studyLists.estimatedMinutes,
    isFeatured: studyLists.isFeatured,
    isPublic: studyLists.isPublic,
    updatedAt: studyLists.updatedAt,
  };
}

function sectionTitlesOf(
  sections: ReadonlyArray<{ id: string; title: string }>,
): Map<string, string> {
  return new Map(sections.map((section) => [section.id, section.title]));
}

export async function listStudyLists(
  viewer: StudyListViewer,
): Promise<StudyListSummary[]> {
  const viewerId = viewer?.id ?? null;
  const lists: ListRow[] = await getDb()
    .select(publicListColumns())
    .from(studyLists)
    .where(eq(studyLists.isPublic, true))
    .orderBy(desc(studyLists.isFeatured), asc(studyLists.title));
  if (lists.length === 0) return [];

  const listIds = lists.map((list) => list.id);
  const [items, sectionsByList, enrollments] = await Promise.all([
    loadStudyListItems(listIds),
    loadStudyListSections(listIds),
    loadViewerEnrollments(viewerId, listIds),
  ]);
  const [problemState, problemTopics] = await Promise.all([
    loadViewerProblemState(
      viewerId,
      items.map((item) => item.problemId),
    ),
    loadProblemTopics(items.map((item) => item.slug)),
  ]);

  const itemsByList = groupItemsByList(items);
  return lists.map((list) => {
    const listItems = itemsByList.get(list.id) ?? [];
    const sections = sectionsByList.get(list.id) ?? [];
    const problems = groupListProblems(
      listItems,
      sectionTitlesOf(sections),
      problemState,
    );
    return buildStudyListSummary({
      list,
      problems,
      sectionCount: countListSections(sections, problems),
      topics: collectListTopics(problems, problemTopics),
      startedAt: enrollments.get(list.id) ?? null,
    });
  });
}

export async function getStudyList(
  slug: string,
  viewer: StudyListViewer,
): Promise<StudyListDetail | null> {
  const [list]: ListRow[] = await getDb()
    .select(publicListColumns())
    .from(studyLists)
    .where(eq(studyLists.slug, slug))
    .limit(1);
  if (!list) return null;
  if (!list.isPublic && viewer?.role !== "ADMIN") return null;

  const [items, sectionsByList] = await Promise.all([
    loadStudyListItems([list.id]),
    loadStudyListSections([list.id]),
  ]);
  const [problemState, problemTopics, enrollments] = await Promise.all([
    loadViewerProblemState(
      viewer?.id ?? null,
      items.map((item) => item.problemId),
    ),
    loadProblemTopics(items.map((item) => item.slug)),
    loadViewerEnrollments(viewer?.id ?? null, [list.id]),
  ]);

  const sections = sectionsByList.get(list.id) ?? [];
  const problems = groupListProblems(
    items,
    sectionTitlesOf(sections),
    problemState,
  );
  const startedAt = enrollments.get(list.id) ?? null;
  const summary = buildStudyListSummary({
    list,
    problems,
    sectionCount: countListSections(sections, problems),
    topics: collectListTopics(problems, problemTopics),
    startedAt,
  });

  return {
    ...summary,
    sections: buildStudyListSections(sections, problems),
    startedAt,
    updatedAt: list.updatedAt.toISOString(),
  };
}

async function findEnrollableListId(slug: string): Promise<string> {
  const rows = await getDb()
    .select({ id: studyLists.id })
    .from(studyLists)
    .where(and(eq(studyLists.slug, slug), eq(studyLists.isPublic, true)))
    .limit(1);
  const listId = rows[0]?.id;
  if (!listId) throw errors.notFound("Study list not found.");
  return listId;
}

export async function enrollStudyList(
  slug: string,
  userId: string,
): Promise<{ enrolled: boolean }> {
  const listId = await findEnrollableListId(slug);
  await getDb()
    .insert(studyListEnrollments)
    .values({ userId, listId })
    .onConflictDoNothing();
  return { enrolled: true };
}

export async function leaveStudyList(
  slug: string,
  userId: string,
): Promise<{ enrolled: boolean }> {
  const listId = await findEnrollableListId(slug);
  await getDb()
    .delete(studyListEnrollments)
    .where(
      and(
        eq(studyListEnrollments.userId, userId),
        eq(studyListEnrollments.listId, listId),
      ),
    );
  return { enrolled: false };
}
