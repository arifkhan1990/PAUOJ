import type { NextRequest } from "next/server";
import { z } from "zod";
import { assertSameOrigin, requireApiUser } from "@/server/api/auth";
import { errors } from "@/server/api/errors";
import { enforceRateLimit } from "@/server/api/rate-limit";
import { apiError, apiOk } from "@/server/api/responses";
import { parseJson } from "@/server/api/validation";
import { problemReviewActionSchema } from "@/lib/schemas/problem-review";
import {
  getProblemReviewForViewer,
} from "@/server/services/problem-review-records";
import { actOnProblemReview } from "@/server/services/problem-reviews";

function validatedProblemId(problemId: string): string {
  if (!z.uuid().safeParse(problemId).success) {
    throw errors.notFound("Problem not found.");
  }
  return problemId;
}

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ problemId: string }> },
) {
  try {
    const viewer = await requireApiUser();
    const { problemId } = await context.params;
    const review = await getProblemReviewForViewer(
      validatedProblemId(problemId),
      viewer,
    );
    return apiOk(review);
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ problemId: string }> },
) {
  try {
    assertSameOrigin(request);
    const actor = await requireApiUser();
    await enforceRateLimit(`problem:review:${actor.id}`, 30, 60);
    const { problemId } = await context.params;
    const input = await parseJson(request, problemReviewActionSchema);
    const result = await actOnProblemReview(
      actor,
      validatedProblemId(problemId),
      input,
    );
    return apiOk(result);
  } catch (error) {
    return apiError(error);
  }
}
