import type { NextRequest } from "next/server";
import { submissionNoteInputSchema } from "@/lib/schemas/submission";
import { assertSameOrigin, requireApiUser } from "@/server/api/auth";
import { enforceRateLimit } from "@/server/api/rate-limit";
import { apiError, apiOk } from "@/server/api/responses";
import { parseJson } from "@/server/api/validation";
import {
  deleteSubmissionNote,
  saveSubmissionNote,
} from "@/server/services/submission-notes";

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    assertSameOrigin(request);
    const user = await requireApiUser();
    await enforceRateLimit(`submission:note:${user.id}`, 60, 60);
    const { id } = await context.params;
    const input = await parseJson(request, submissionNoteInputSchema);
    return apiOk(await saveSubmissionNote(id, user.id, input.body));
  } catch (error) {
    return apiError(error);
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    assertSameOrigin(request);
    const user = await requireApiUser();
    await enforceRateLimit(`submission:note:${user.id}`, 60, 60);
    const { id } = await context.params;
    return apiOk(await deleteSubmissionNote(id, user.id));
  } catch (error) {
    return apiError(error);
  }
}
