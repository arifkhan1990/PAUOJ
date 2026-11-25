import { and, eq } from "drizzle-orm";
import { submissionNoteInputSchema } from "@/lib/schemas/submission";
import { errors } from "@/server/api/errors";
import { getDb } from "@/server/db";
import { submissionNotes, submissions } from "@/server/db/schema";

const NOT_FOUND_MESSAGE = "Submission not found.";

/** Owner-only guard; unknown ids and other users' submissions look identical. */
async function assertOwnedSubmission(
  submissionId: string,
  userId: string,
): Promise<void> {
  const [row] = await getDb()
    .select({ id: submissions.id })
    .from(submissions)
    .where(
      and(eq(submissions.id, submissionId), eq(submissions.userId, userId)),
    )
    .limit(1);
  if (!row) throw errors.notFound(NOT_FOUND_MESSAGE);
}

/** The viewer's own note; null for unknown ids and other users' submissions. */
export async function getSubmissionNote(
  submissionId: string,
  userId: string,
): Promise<string | null> {
  const rows = await getDb()
    .select({ body: submissionNotes.body })
    .from(submissionNotes)
    .innerJoin(submissions, eq(submissions.id, submissionNotes.submissionId))
    .where(
      and(
        eq(submissionNotes.submissionId, submissionId),
        eq(submissionNotes.userId, userId),
        eq(submissions.userId, userId),
      ),
    )
    .limit(1);
  return rows[0]?.body ?? null;
}

export async function saveSubmissionNote(
  submissionId: string,
  userId: string,
  body: string,
): Promise<{ note: string }> {
  const parsed = submissionNoteInputSchema.safeParse({ body });
  if (!parsed.success) {
    throw errors.validation(
      parsed.error.issues[0]?.message ??
        "Notes can be up to 2000 characters.",
    );
  }

  await assertOwnedSubmission(submissionId, userId);

  const [saved] = await getDb()
    .insert(submissionNotes)
    .values({
      submissionId,
      userId,
      body: parsed.data.body,
    })
    .onConflictDoUpdate({
      target: submissionNotes.submissionId,
      set: { body: parsed.data.body, updatedAt: new Date() },
    })
    .returning({ body: submissionNotes.body });
  return { note: saved?.body ?? parsed.data.body };
}

export async function deleteSubmissionNote(
  submissionId: string,
  userId: string,
): Promise<{ note: null }> {
  await assertOwnedSubmission(submissionId, userId);
  await getDb()
    .delete(submissionNotes)
    .where(
      and(
        eq(submissionNotes.submissionId, submissionId),
        eq(submissionNotes.userId, userId),
      ),
    );
  return { note: null };
}
