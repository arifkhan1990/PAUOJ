import { and, asc, eq, inArray, isNull, sql } from "drizzle-orm";
import type { Difficulty } from "@/lib/difficulty";
import {
  countStudyDifficulties,
  estimateStudyMinutes,
  pickNextStudyProblem,
  studyProgressPercent,
  uniqueStudyTopics,
} from "@/lib/study-list";
import type {
  StudyListLevel,
  StudyListProblem,
  StudyListSectionView,
  StudyListSummary,
} from "@/lib/study-list-types";
import { getDb } from "@/server/db";
import {
  problemTags,
  problems,
  studyListEnrollments,
  studyListItemNotes,
  studyListItems,
  studyListSections,
  submissions,
  tags,
} from "@/server/db/schema";

/** Columns of `study_lists` the public views need. */
export type StudyListRecord = {
  id: string;
  slug: string;
  title: string;
  description: string;
  level: StudyListLevel;
  estimatedMinutes: number | null;
  isFeatured: boolean;
  isPublic: boolean;
  /** Owner of the plan; null for plans seeded without an author. */
  createdBy: string | null;
};

export type StudyListItemRow = {
  listId: string;
  problemId: string;
  slug: string;
  title: string;
  difficulty: string;
  points: number;
  position: number;
  sectionId: string | null;
};

export type StudyListSectionRow = {
  id: string;
  title: string;
  description: string;
  position: number;
};

export type ViewerProblemState = { solved: boolean; attempted: boolean };

const GENERAL_SECTION_TITLE = "General";

export async function loadStudyListItems(
  listIds: readonly string[],
): Promise<StudyListItemRow[]> {
  if (listIds.length === 0) return [];
  return getDb()
    .select({
      listId: studyListItems.listId,
      problemId: studyListItems.problemId,
      slug: problems.slug,
      title: problems.title,
      difficulty: problems.difficulty,
      points: problems.points,
      position: studyListItems.position,
      sectionId: studyListItems.sectionId,
    })
    .from(studyListItems)
    .innerJoin(problems, eq(problems.id, studyListItems.problemId))
    .where(
      and(
        inArray(studyListItems.listId, [...listIds]),
        // A problem withdrawn after being added must not leak into a public plan.
        eq(problems.isPublic, true),
        eq(problems.publicationStatus, "PUBLISHED"),
      ),
    )
    .orderBy(asc(studyListItems.listId), asc(studyListItems.position));
}

export async function loadStudyListSections(
  listIds: readonly string[],
): Promise<Map<string, StudyListSectionRow[]>> {
  const grouped = new Map<string, StudyListSectionRow[]>();
  if (listIds.length === 0) return grouped;
  const rows = await getDb()
    .select({
      id: studyListSections.id,
      listId: studyListSections.listId,
      title: studyListSections.title,
      description: studyListSections.description,
      position: studyListSections.position,
    })
    .from(studyListSections)
    .where(inArray(studyListSections.listId, [...listIds]))
    .orderBy(asc(studyListSections.listId), asc(studyListSections.position));
  for (const row of rows) {
    const bucket = grouped.get(row.listId) ?? [];
    bucket.push({
      id: row.id,
      title: row.title,
      description: row.description,
      position: row.position,
    });
    grouped.set(row.listId, bucket);
  }
  return grouped;
}

/** Solved = accepted; attempted = any submission. Assessment attempts are ignored. */
export async function loadViewerProblemState(
  viewerId: string | null,
  problemIds: readonly string[],
): Promise<Map<string, ViewerProblemState>> {
  const state = new Map<string, ViewerProblemState>();
  if (!viewerId || problemIds.length === 0) return state;
  const rows = await getDb()
    .select({
      problemId: submissions.problemId,
      solved: sql<boolean>`bool_or(${submissions.status} = 'ACCEPTED')`,
    })
    .from(submissions)
    .where(
      and(
        eq(submissions.userId, viewerId),
        isNull(submissions.assessmentId),
        inArray(submissions.problemId, [...new Set(problemIds)]),
      ),
    )
    .groupBy(submissions.problemId);
  for (const row of rows) {
    state.set(row.problemId, { solved: row.solved, attempted: true });
  }
  return state;
}

/** Tag names per problem slug, used to rank the plan topics. */
export async function loadProblemTopics(
  problemSlugs: readonly string[],
): Promise<Map<string, string[]>> {
  const topics = new Map<string, string[]>();
  const slugs = [...new Set(problemSlugs)];
  if (slugs.length === 0) return topics;
  const rows = await getDb()
    .select({ slug: problems.slug, name: tags.name })
    .from(problemTags)
    .innerJoin(problems, eq(problems.id, problemTags.problemId))
    .innerJoin(tags, eq(tags.id, problemTags.tagId))
    .where(inArray(problems.slug, slugs));
  for (const row of rows) {
    const bucket = topics.get(row.slug) ?? [];
    bucket.push(row.name);
    topics.set(row.slug, bucket);
  }
  return topics;
}

/** The viewer's private notes for one plan, keyed by problem id. */
export async function loadViewerNotes(
  viewerId: string | null,
  listId: string,
): Promise<Map<string, string>> {
  const notes = new Map<string, string>();
  if (!viewerId) return notes;
  const rows = await getDb()
    .select({
      problemId: studyListItemNotes.problemId,
      body: studyListItemNotes.body,
    })
    .from(studyListItemNotes)
    .where(
      and(
        eq(studyListItemNotes.userId, viewerId),
        eq(studyListItemNotes.listId, listId),
      ),
    );
  for (const row of rows) {
    notes.set(row.problemId, row.body);
  }
  return notes;
}

export async function loadViewerEnrollments(
  viewerId: string | null,
  listIds: readonly string[],
): Promise<Map<string, string>> {
  const enrollments = new Map<string, string>();
  if (!viewerId || listIds.length === 0) return enrollments;
  const rows = await getDb()
    .select({
      listId: studyListEnrollments.listId,
      startedAt: studyListEnrollments.startedAt,
    })
    .from(studyListEnrollments)
    .where(
      and(
        eq(studyListEnrollments.userId, viewerId),
        inArray(studyListEnrollments.listId, [...listIds]),
      ),
    );
  for (const row of rows) {
    enrollments.set(row.listId, row.startedAt.toISOString());
  }
  return enrollments;
}

export function groupItemsByList(
  items: readonly StudyListItemRow[],
): Map<string, StudyListItemRow[]> {
  const grouped = new Map<string, StudyListItemRow[]>();
  for (const item of items) {
    const bucket = grouped.get(item.listId) ?? [];
    bucket.push(item);
    grouped.set(item.listId, bucket);
  }
  return grouped;
}

export function groupListProblems(
  items: readonly StudyListItemRow[],
  sectionTitles: ReadonlyMap<string, string>,
  state: ReadonlyMap<string, ViewerProblemState>,
  notes: ReadonlyMap<string, string> = new Map(),
): StudyListProblem[] {
  return items
    .map((item) => {
      const viewerState = state.get(item.problemId);
      return {
        slug: item.slug,
        title: item.title,
        difficulty: item.difficulty as Difficulty,
        points: item.points,
        position: item.position,
        sectionId: item.sectionId,
        sectionTitle: item.sectionId
          ? (sectionTitles.get(item.sectionId) ?? null)
          : null,
        solved: viewerState?.solved ?? false,
        attempted: viewerState?.attempted ?? false,
        note: notes.get(item.problemId) ?? null,
      };
    })
    .sort((left, right) => left.position - right.position);
}

/** Most frequent problem tags, capped for display. */
export function collectListTopics(
  problemsList: readonly StudyListProblem[],
  problemTopics: ReadonlyMap<string, string[]>,
  limit = 4,
): string[] {
  const counts = new Map<string, { label: string; value: number }>();
  for (const problem of problemsList) {
    const seen = new Set<string>();
    for (const tag of problemTopics.get(problem.slug) ?? []) {
      const label = tag.trim();
      const key = label.toLowerCase();
      if (!label || seen.has(key)) continue;
      seen.add(key);
      const entry = counts.get(key);
      counts.set(key, {
        label: entry?.label ?? label,
        value: (entry?.value ?? 0) + 1,
      });
    }
  }
  const ranked = [...counts.values()]
    .sort(
      (left, right) =>
        right.value - left.value ||
        left.label.localeCompare(right.label, "en", { sensitivity: "base" }),
    )
    .map((entry) => entry.label);
  return uniqueStudyTopics(ranked, limit);
}

export function countListSections(
  sections: readonly StudyListSectionRow[],
  problemsList: readonly StudyListProblem[],
): number {
  const hasGeneral = problemsList.some((problem) => !problem.sectionId);
  return sections.length + (hasGeneral ? 1 : 0);
}

export function buildStudyListSummary(input: {
  list: StudyListRecord;
  problems: StudyListProblem[];
  sectionCount: number;
  topics: string[];
  startedAt: string | null;
  viewerId: string | null;
}): StudyListSummary {
  const { list, problems: problemsList } = input;
  const problemCount = problemsList.length;
  const solvedCount = problemsList.filter((problem) => problem.solved).length;
  const attemptedCount = problemsList.filter(
    (problem) => problem.attempted,
  ).length;
  return {
    id: list.id,
    slug: list.slug,
    title: list.title,
    description: list.description,
    level: list.level,
    isFeatured: list.isFeatured,
    estimatedMinutes: list.estimatedMinutes,
    durationMinutes:
      list.estimatedMinutes ?? estimateStudyMinutes(problemsList),
    problemCount,
    solvedCount,
    attemptedCount,
    progressPercent: studyProgressPercent(solvedCount, problemCount),
    sectionCount: input.sectionCount,
    difficultyCounts: countStudyDifficulties(problemsList),
    topics: input.topics,
    enrolled: input.startedAt !== null,
    completed: problemCount > 0 && solvedCount === problemCount,
    nextProblem: pickNextStudyProblem(problemsList),
    isPublic: list.isPublic,
    isOwned: input.viewerId !== null && list.createdBy === input.viewerId,
  };
}

/** Sections in plan order; legacy items without a section form the "General" first block. */
export function buildStudyListSections(
  sections: readonly StudyListSectionRow[],
  problemsList: readonly StudyListProblem[],
): StudyListSectionView[] {
  const bySection = new Map<string, StudyListProblem[]>();
  const general: StudyListProblem[] = [];
  for (const problem of problemsList) {
    if (!problem.sectionId) {
      general.push(problem);
      continue;
    }
    const bucket = bySection.get(problem.sectionId) ?? [];
    bucket.push(problem);
    bySection.set(problem.sectionId, bucket);
  }

  const views: StudyListSectionView[] = [];
  if (general.length > 0) {
    views.push({
      id: null,
      title: GENERAL_SECTION_TITLE,
      description: "",
      position: 0,
      problemCount: general.length,
      solvedCount: general.filter((problem) => problem.solved).length,
      problems: general,
    });
  }
  for (const section of sections) {
    const sectionProblems = bySection.get(section.id) ?? [];
    views.push({
      id: section.id,
      title: section.title,
      description: section.description,
      position: section.position,
      problemCount: sectionProblems.length,
      solvedCount: sectionProblems.filter((problem) => problem.solved).length,
      problems: sectionProblems,
    });
  }
  return views;
}
