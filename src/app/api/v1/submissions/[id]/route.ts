import type { NextRequest } from "next/server";
import { optionalApiUser } from "@/server/api/auth";
import { errors } from "@/server/api/errors";
import { apiError, apiOk } from "@/server/api/responses";
import { getSubmissionById } from "@/server/services/submissions";

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const viewer = await optionalApiUser();
    const submission = await getSubmissionById(id, viewer);
    if (!submission) throw errors.notFound("Submission not found.");
    return apiOk(submission);
  } catch (error) {
    return apiError(error);
  }
}
