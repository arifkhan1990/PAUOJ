import { and, asc, count, desc, eq, inArray, sql } from "drizzle-orm";
import { errors } from "@/server/api/errors";
import { getDb } from "@/server/db";
import {
  problems,
  studyListItems,
  studyLists,
  submissions,
} from "@/server/db/schema";
import type {
  AdminStudyListDetail,
  AdminStudyListSummary,
  StudyListDetail,
  StudyListSummary,
} from "@/lib/types";
import type { StudyListInput } from "@/lib/schemas/study-list";
import { slugify } from "@/lib/utils";

async function listSolvedCounts(
  viewerId: string | null,
): Promise<Map<string, number>> {
  if (!viewerId) return new Map();
  const rows = await getDb()
    .select({
      listId: studyListItems.listId,
      solved: sql<number>`count(distinct ${studyListItems.problemId})::int`,
    })
    .from(studyListItems)
    .innerJoin(
      submissions,
      and(
        eq(submissions.problemId, studyListItems.problemId),
        eq(submissions.userId, viewerId),
        eq(submissions.status, "ACCEPTED"),
      ),
    )
    .groupBy(studyListItems.listId);
  return new Map(rows.map((row) => [row.listId, Number(row.solved)]));
}

async function listProblemCounts(): Promise<Map<string, number>> {
  const rows = await getDb()
    .select({ listId: studyListItems.listId, value: count() })
    .from(studyListItems)
    .groupBy(studyListItems.listId);
  return new Map(rows.map((row) => [row.listId, Number(row.value)]));
}

export async function listStudyLists(
  viewer: { id: string; role: "USER" | "TEACHER" | "ADMIN" } | null,
): Promise<StudyListSummary[]> {
  const isAdmin = viewer?.role === "ADMIN";
  const where = isAdmin ? undefined : eq(studyLists.isPublic, true);
  const [rows, solved] = await Promise.all([
    getDb()
      .select({
        id: studyLists.id,
        slug: studyLists.slug,
        title: studyLists.title,
        description: studyLists.description,
        isPublic: studyLists.isPublic,
      })
      .from(studyLists)
      .where(where)
      .orderBy(asc(studyLists.title)),
    listSolvedCounts(viewer?.id ?? null),
  ]);
  const counts = await listProblemCounts();
  return rows.map((row) => ({
    ...row,
    problemCount: counts.get(row.id) ?? 0,
    solvedCount: solved.get(row.id) ?? 0,
  }));
}

export async function getStudyList(
  slug: string,
  viewer: { id: string; role: "USER" | "TEACHER" | "ADMIN" } | null,
): Promise<StudyListDetail | null> {
  const db = getDb();
  const rows = await db
    .select()
    .from(studyLists)
    .where(eq(studyLists.slug, slug))
    .limit(1);
  const list = rows[0];
  if (!list) return null;
  if (!list.isPublic && viewer?.role !== "ADMIN") return null;

  const items = await db
    .select({
      slug: problems.slug,
      title: problems.title,
      difficulty: problems.difficulty,
      points: problems.points,
      position: studyListItems.position,
    })
    .from(studyListItems)
    .innerJoin(problems, eq(problems.id, studyListItems.problemId))
    .where(eq(studyListItems.listId, list.id))
    .orderBy(asc(studyListItems.position));

  const solved = new Set<string>();
  if (viewer && items.length > 0) {
    const solvedRows = await db
      .selectDistinct({ slug: problems.slug })
      .from(submissions)
      .innerJoin(problems, eq(problems.id, submissions.problemId))
      .where(
        and(
          eq(submissions.userId, viewer.id),
          eq(submissions.status, "ACCEPTED"),
          inArray(
            problems.slug,
            items.map((item) => item.slug),
          ),
        ),
      );
    for (const row of solvedRows) solved.add(row.slug);
  }

  return {
    id: list.id,
    slug: list.slug,
    title: list.title,
    description: list.description,
    isPublic: list.isPublic,
    problemCount: items.length,
    solvedCount: solved.size,
    problems: items.map((item) => ({
      ...item,
      solved: solved.has(item.slug),
    })),
  };
}

export async function listAdminStudyLists(): Promise<AdminStudyListSummary[]> {
  const db = getDb();
  const [rows, counts] = await Promise.all([
    db
      .select({
        id: studyLists.id,
        slug: studyLists.slug,
        title: studyLists.title,
        isPublic: studyLists.isPublic,
        updatedAt: studyLists.updatedAt,
      })
      .from(studyLists)
      .orderBy(desc(studyLists.updatedAt)),
    listProblemCounts(),
  ]);
  return rows.map((row) => ({
    ...row,
    updatedAt: row.updatedAt.toISOString(),
    problemCount: counts.get(row.id) ?? 0,
  }));
}

export async function getAdminStudyList(
  id: string,
): Promise<AdminStudyListDetail | null> {
  const db = getDb();
  const [list] = await db
    .select()
    .from(studyLists)
    .where(eq(studyLists.id, id))
    .limit(1);
  if (!list) return null;
  const items = await db
    .select({ problemId: studyListItems.problemId })
    .from(studyListItems)
    .where(eq(studyListItems.listId, id))
    .orderBy(asc(studyListItems.position));
  return {
    id: list.id,
    slug: list.slug,
    title: list.title,
    description: list.description,
    isPublic: list.isPublic,
    problemIds: items.map((item) => item.problemId),
  };
}

async function assertSlugAvailable(slug: string, excludeId?: string) {
  const [row] = await getDb()
    .select({ id: studyLists.id })
    .from(studyLists)
    .where(eq(studyLists.slug, slug))
    .limit(1);
  if (row && row.id !== excludeId) {
    throw errors.conflict("A study list with that slug already exists.");
  }
}

export async function createStudyList(
  adminId: string,
  input: StudyListInput,
): Promise<{ id: string; slug: string }> {
  const slug = input.slug || slugify(input.title);
  if (!slug) throw errors.validation("Give the list a valid slug.");
  await assertSlugAvailable(slug);
  const db = getDb();
  const id = await db.transaction(async (tx) => {
    const [created] = await tx
      .insert(studyLists)
      .values({
        slug,
        title: input.title,
        description: input.description,
        isPublic: input.isPublic,
        createdBy: adminId,
      })
      .returning({ id: studyLists.id });
    if (!created) throw errors.unavailable("Could not create the list.");
    await tx.insert(studyListItems).values(
      input.problemIds.map((problemId, index) => ({
        listId: created.id,
        problemId,
        position: index + 1,
      })),
    );
    return created.id;
  });
  return { id, slug };
}

export async function updateStudyList(
  id: string,
  input: StudyListInput,
): Promise<{ id: string; slug: string }> {
  const slug = input.slug || slugify(input.title);
  if (!slug) throw errors.validation("Give the list a valid slug.");
  await assertSlugAvailable(slug, id);
  const db = getDb();
  await db.transaction(async (tx) => {
    const [updated] = await tx
      .update(studyLists)
      .set({
        slug,
        title: input.title,
        description: input.description,
        isPublic: input.isPublic,
        updatedAt: new Date(),
      })
      .where(eq(studyLists.id, id))
      .returning({ id: studyLists.id });
    if (!updated) throw errors.notFound("Study list not found.");
    await tx
      .delete(studyListItems)
      .where(eq(studyListItems.listId, id));
    await tx.insert(studyListItems).values(
      input.problemIds.map((problemId, index) => ({
        listId: id,
        problemId,
        position: index + 1,
      })),
    );
  });
  return { id, slug };
}
