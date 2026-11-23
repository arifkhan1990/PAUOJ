import { and, count, eq } from "drizzle-orm";
import type { StudyListInput } from "@/lib/schemas/study-list";
import { STUDY_PLAN_QUOTA } from "@/lib/study-list";
import type { AdminStudyListDetail } from "@/lib/study-list-types";
import { errors } from "@/server/api/errors";
import { getDb } from "@/server/db";
import {
  studyListItems,
  studyListSections,
  studyLists,
  users,
} from "@/server/db/schema";
import { getAdminStudyList } from "./study-list-admin";
import {
  assertPublishedProblems,
  assertSlugAvailable,
  insertSectionsAndItems,
  resolveSlug,
} from "./study-list-write";

const QUOTA_MESSAGE = `You can keep up to ${STUDY_PLAN_QUOTA} study plans. Delete one to make room.`;
const NOT_FOUND_MESSAGE = "Study plan not found.";

/** Private plans only; the owner is the signed-in learner. */
export async function createUserStudyList(
  userId: string,
  input: StudyListInput,
): Promise<{ id: string; slug: string }> {
  const slug = resolveSlug(input);
  const db = getDb();
  const id = await db.transaction(async (tx) => {
    // Serialise plan creation per user so the quota cannot be raced.
    await tx
      .select({ id: users.id })
      .from(users)
      .where(eq(users.id, userId))
      .for("update");
    const [owned] = await tx
      .select({ value: count() })
      .from(studyLists)
      .where(eq(studyLists.createdBy, userId));
    if (Number(owned?.value ?? 0) >= STUDY_PLAN_QUOTA) {
      throw errors.validation(QUOTA_MESSAGE);
    }
    await assertSlugAvailable(tx, slug);
    await assertPublishedProblems(tx, input.sections);
    const [created] = await tx
      .insert(studyLists)
      .values({
        slug,
        title: input.title,
        description: input.description,
        isPublic: false,
        isFeatured: false,
        level: input.level,
        estimatedMinutes: input.estimatedMinutes,
        createdBy: userId,
      })
      .returning({ id: studyLists.id });
    if (!created) throw errors.unavailable("Could not create the plan.");
    await insertSectionsAndItems(tx, created.id, input.sections);
    return created.id;
  });
  return { id, slug };
}

/** Owner-only replacement of sections/items; enrollments and notes stay. */
export async function updateUserStudyList(
  id: string,
  userId: string,
  input: StudyListInput,
): Promise<{ id: string; slug: string }> {
  const slug = resolveSlug(input);
  const db = getDb();
  await db.transaction(async (tx) => {
    const [existing] = await tx
      .select({ id: studyLists.id, createdBy: studyLists.createdBy })
      .from(studyLists)
      .where(eq(studyLists.id, id))
      .limit(1);
    if (!existing || existing.createdBy !== userId) {
      throw errors.notFound(NOT_FOUND_MESSAGE);
    }
    await assertSlugAvailable(tx, slug, id);
    await assertPublishedProblems(tx, input.sections);

    await tx
      .update(studyLists)
      .set({
        slug,
        title: input.title,
        description: input.description,
        isPublic: false,
        isFeatured: false,
        level: input.level,
        estimatedMinutes: input.estimatedMinutes,
        updatedAt: new Date(),
      })
      .where(and(eq(studyLists.id, id), eq(studyLists.createdBy, userId)));

    // Items first so the section foreign key never blocks the deletion.
    await tx.delete(studyListItems).where(eq(studyListItems.listId, id));
    await tx.delete(studyListSections).where(eq(studyListSections.listId, id));
    await insertSectionsAndItems(tx, id, input.sections);
  });
  return { id, slug };
}

/** Owner-only; the cascade removes its sections, items, enrollments and notes. */
export async function deleteUserStudyList(
  id: string,
  userId: string,
): Promise<void> {
  const deleted = await getDb()
    .delete(studyLists)
    .where(and(eq(studyLists.id, id), eq(studyLists.createdBy, userId)))
    .returning({ id: studyLists.id });
  if (deleted.length === 0) throw errors.notFound(NOT_FOUND_MESSAGE);
}

/** Resolve a slug to a plan the user owns, or 404. */
export async function resolveOwnedStudyListId(
  slug: string,
  userId: string,
): Promise<string> {
  const [row] = await getDb()
    .select({ id: studyLists.id })
    .from(studyLists)
    .where(and(eq(studyLists.slug, slug), eq(studyLists.createdBy, userId)))
    .limit(1);
  if (!row) throw errors.notFound(NOT_FOUND_MESSAGE);
  return row.id;
}

export async function updateUserStudyListBySlug(
  slug: string,
  userId: string,
  input: StudyListInput,
): Promise<{ id: string; slug: string }> {
  const id = await resolveOwnedStudyListId(slug, userId);
  return updateUserStudyList(id, userId, input);
}

export async function deleteUserStudyListBySlug(
  slug: string,
  userId: string,
): Promise<void> {
  const id = await resolveOwnedStudyListId(slug, userId);
  await deleteUserStudyList(id, userId);
}

/** Owner-only editor payload; other users get null even when the plan is public. */
export async function getUserStudyListForEdit(
  slug: string,
  userId: string,
): Promise<AdminStudyListDetail | null> {
  const [row] = await getDb()
    .select({ id: studyLists.id })
    .from(studyLists)
    .where(and(eq(studyLists.slug, slug), eq(studyLists.createdBy, userId)))
    .limit(1);
  if (!row) return null;
  return getAdminStudyList(row.id);
}
