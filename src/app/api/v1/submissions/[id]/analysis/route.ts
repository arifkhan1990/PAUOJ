import type { NextRequest } from "next/server";
import { optionalApiUser } from "@/server/api/auth";
import { errors } from "@/server/api/errors";
import { apiError, apiOk } from "@/server/api/responses";
import { getSubmissionAnalysis } from "@/server/services/submission-analysis";
import { getSubmissionById } from "@/server/services/submissions";

/** Percentile + distribution data for an accepted submission, null otherwise. */
export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const viewer = await optionalApiUser();
    const submission = await getSubmissionById(id, viewer);
    if (!submission) throw errors.notFound("Submission not found.");
    return apiOk(await getSubmissionAnalysis(submission.id));
  } catch (error) {
    return apiError(error);
  }
}
