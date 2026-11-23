import { and, eq } from "drizzle-orm";
import { studyListNoteInputSchema } from "@/lib/schemas/study-list";
import { errors } from "@/server/api/errors";
import { getDb } from "@/server/db";
import {
  problems,
  studyListItemNotes,
  studyListItems,
  studyLists,
  users,
} from "@/server/db/schema";

const NOT_FOUND_MESSAGE = "Study plan not found.";
const NOT_IN_PLAN_MESSAGE = "That problem is not part of this plan.";

type NoteTarget = { listId: string; problemId: string };

/** Public plans, the owner, and admins may annotate; everyone else gets a 404. */
async function canViewPlan(
  listId: string,
  isPublic: boolean,
  createdBy: string | null,
  userId: string,
): Promise<boolean> {
  if (isPublic || createdBy === userId) return true;
  const [viewer] = await getDb()
    .select({ role: users.role })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  return viewer?.role === "ADMIN";
}

async function resolveNoteTarget(
  slug: string,
  problemSlug: string,
  userId: string,
): Promise<NoteTarget> {
  const db = getDb();
  const [list] = await db
    .select({
      id: studyLists.id,
      isPublic: studyLists.isPublic,
      createdBy: studyLists.createdBy,
    })
    .from(studyLists)
    .where(eq(studyLists.slug, slug))
    .limit(1);
  if (!list) throw errors.notFound(NOT_FOUND_MESSAGE);
  if (!(await canViewPlan(list.id, list.isPublic, list.createdBy, userId))) {
    throw errors.notFound(NOT_FOUND_MESSAGE);
  }

  const [item] = await db
    .select({ problemId: problems.id })
    .from(problems)
    .innerJoin(studyListItems, eq(studyListItems.problemId, problems.id))
    .where(
      and(
        eq(problems.slug, problemSlug),
        eq(studyListItems.listId, list.id),
      ),
    )
    .limit(1);
  if (!item) throw errors.notFound(NOT_IN_PLAN_MESSAGE);
  return { listId: list.id, problemId: item.problemId };
}

export async function saveStudyListNote(
  slug: string,
  problemSlug: string,
  userId: string,
  body: string,
): Promise<{ note: string }> {
  const parsed = studyListNoteInputSchema.safeParse({ body });
  if (!parsed.success) {
    throw errors.validation(
      parsed.error.issues[0]?.message ?? "Notes can be up to 2000 characters.",
    );
  }
  const target = await resolveNoteTarget(slug, problemSlug, userId);
  const [saved] = await getDb()
    .insert(studyListItemNotes)
    .values({
      userId,
      listId: target.listId,
      problemId: target.problemId,
      body: parsed.data.body,
    })
    .onConflictDoUpdate({
      target: [
        studyListItemNotes.userId,
        studyListItemNotes.listId,
        studyListItemNotes.problemId,
      ],
      set: { body: parsed.data.body, updatedAt: new Date() },
    })
    .returning({ body: studyListItemNotes.body });
  return { note: saved?.body ?? parsed.data.body };
}

export async function deleteStudyListNote(
  slug: string,
  problemSlug: string,
  userId: string,
): Promise<{ note: null }> {
  const target = await resolveNoteTarget(slug, problemSlug, userId);
  await getDb()
    .delete(studyListItemNotes)
    .where(
      and(
        eq(studyListItemNotes.userId, userId),
        eq(studyListItemNotes.listId, target.listId),
        eq(studyListItemNotes.problemId, target.problemId),
      ),
    );
  return { note: null };
}
