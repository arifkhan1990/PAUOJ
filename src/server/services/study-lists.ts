import { and, asc, desc, eq, or } from "drizzle-orm";
import type { UserRole } from "@/lib/types";
import type { StudyListDetail, StudyListSummary } from "@/lib/study-list-types";
import { errors } from "@/server/api/errors";
import { getDb } from "@/server/db";
import { studyListEnrollments, studyLists } from "@/server/db/schema";
import { logger } from "@/server/logger";
import { notifyUser } from "./notifications";
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
  loadViewerNotes,
  loadViewerProblemState,
} from "./study-list-data";

export {
  createStudyList,
  getAdminStudyList,
  listAdminStudyLists,
  updateStudyList,
} from "./study-list-admin";
export {
  createUserStudyList,
  deleteUserStudyList,
  getUserStudyListForEdit,
  updateUserStudyList,
} from "./study-list-user";

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
  createdBy: string | null;
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
    createdBy: studyLists.createdBy,
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
  // Public catalog plus the viewer's own private plans (guests get public only).
  const visibility = viewerId
    ? or(eq(studyLists.isPublic, true), eq(studyLists.createdBy, viewerId))
    : eq(studyLists.isPublic, true);
  const lists: ListRow[] = await getDb()
    .select(publicListColumns())
    .from(studyLists)
    .where(visibility)
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
      viewerId,
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
  const viewerId = viewer?.id ?? null;
  const isOwner = viewerId !== null && list.createdBy === viewerId;
  if (!list.isPublic && !isOwner && viewer?.role !== "ADMIN") return null;

  const [items, sectionsByList] = await Promise.all([
    loadStudyListItems([list.id]),
    loadStudyListSections([list.id]),
  ]);
  const [problemState, problemTopics, enrollments, notes] = await Promise.all([
    loadViewerProblemState(
      viewerId,
      items.map((item) => item.problemId),
    ),
    loadProblemTopics(items.map((item) => item.slug)),
    loadViewerEnrollments(viewerId, [list.id]),
    loadViewerNotes(viewerId, list.id),
  ]);

  const sections = sectionsByList.get(list.id) ?? [];
  const problems = groupListProblems(
    items,
    sectionTitlesOf(sections),
    problemState,
    notes,
  );
  const startedAt = enrollments.get(list.id) ?? null;
  const summary = buildStudyListSummary({
    list,
    problems,
    sectionCount: countListSections(sections, problems),
    topics: collectListTopics(problems, problemTopics),
    startedAt,
    viewerId,
  });

  return {
    ...summary,
    sections: buildStudyListSections(sections, problems),
    startedAt,
    updatedAt: list.updatedAt.toISOString(),
  };
}

/** Public plans plus the owner's private plan; another user's private plan stays hidden. */
async function findEnrollableList(
  slug: string,
  userId: string,
): Promise<{ id: string; title: string }> {
  const rows = await getDb()
    .select({ id: studyLists.id, title: studyLists.title })
    .from(studyLists)
    .where(
      and(
        eq(studyLists.slug, slug),
        or(eq(studyLists.isPublic, true), eq(studyLists.createdBy, userId)),
      ),
    )
    .limit(1);
  const list = rows[0];
  if (!list) throw errors.notFound("Study list not found.");
  return list;
}

async function notifyEnrollment(
  userId: string,
  list: { id: string; title: string },
  slug: string,
  startedAt: Date,
): Promise<void> {
  try {
    await notifyUser({
      userId,
      type: "LEARNING_ENROLLMENT",
      title: `You're enrolled: ${list.title}`,
      body: "Your plan is ready. Open it to see the first unsolved problem.",
      href: `/lists/${slug}`,
      dedupeKey: `study-enroll:${list.id}:${startedAt.toISOString()}`,
    });
  } catch (error) {
    logger.warn("Could not send the study list enrollment notification", {
      userId,
      listId: list.id,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

export async function enrollStudyList(
  slug: string,
  userId: string,
): Promise<{ enrolled: boolean }> {
  const list = await findEnrollableList(slug, userId);
  const [created] = await getDb()
    .insert(studyListEnrollments)
    .values({ userId, listId: list.id })
    .onConflictDoNothing()
    .returning({ startedAt: studyListEnrollments.startedAt });
  // Only a genuinely new enrollment notifies; re-enrolling a plan says nothing.
  if (created) await notifyEnrollment(userId, list, slug, created.startedAt);
  return { enrolled: true };
}

export async function leaveStudyList(
  slug: string,
  userId: string,
): Promise<{ enrolled: boolean }> {
  const list = await findEnrollableList(slug, userId);
  await getDb()
    .delete(studyListEnrollments)
    .where(
      and(
        eq(studyListEnrollments.userId, userId),
        eq(studyListEnrollments.listId, list.id),
      ),
    );
  return { enrolled: false };
}
