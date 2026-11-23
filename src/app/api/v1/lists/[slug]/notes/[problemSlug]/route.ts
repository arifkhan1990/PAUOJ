import type { NextRequest } from "next/server";
import {
  parseStudyListSlug,
  studyListNoteInputSchema,
} from "@/lib/schemas/study-list";
import { assertSameOrigin, requireApiUser } from "@/server/api/auth";
import { errors } from "@/server/api/errors";
import { enforceRateLimit } from "@/server/api/rate-limit";
import { apiError, apiOk } from "@/server/api/responses";
import { parseJson } from "@/server/api/validation";
import {
  deleteStudyListNote,
  saveStudyListNote,
} from "@/server/services/study-list-notes";

function validatedSlug(value: string): string {
  const slug = parseStudyListSlug(value);
  if (!slug) throw errors.notFound("Study plan not found.");
  return slug;
}

function validatedProblemSlug(value: string): string {
  const slug = parseStudyListSlug(value);
  if (!slug) throw errors.notFound("Problem is not part of this plan.");
  return slug;
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ slug: string; problemSlug: string }> },
) {
  try {
    assertSameOrigin(request);
    const user = await requireApiUser();
    await enforceRateLimit(`study:note:${user.id}`, 60, 60);
    const { slug, problemSlug } = await context.params;
    const input = await parseJson(request, studyListNoteInputSchema);
    return apiOk(
      await saveStudyListNote(
        validatedSlug(slug),
        validatedProblemSlug(problemSlug),
        user.id,
        input.body,
      ),
    );
  } catch (error) {
    return apiError(error);
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ slug: string; problemSlug: string }> },
) {
  try {
    assertSameOrigin(request);
    const user = await requireApiUser();
    await enforceRateLimit(`study:note:${user.id}`, 60, 60);
    const { slug, problemSlug } = await context.params;
    return apiOk(
      await deleteStudyListNote(
        validatedSlug(slug),
        validatedProblemSlug(problemSlug),
        user.id,
      ),
    );
  } catch (error) {
    return apiError(error);
  }
}
