import { notFound } from "next/navigation";
import { isApiError } from "@/server/api/errors";
import type { SafeUser } from "@/server/auth/session";
import { getProblemReviewForViewer } from "@/server/services/problem-review-records";
import type { ProblemReviewDetail } from "@/lib/problem-review-types";

/**
 * Loads a review workspace and turns authorization/not-found failures into the
 * route's 404. Unexpected failures still bubble up to the error boundary.
 */
export async function loadProblemReview(
  problemId: string,
  viewer: Pick<SafeUser, "id" | "role">,
): Promise<ProblemReviewDetail> {
  try {
    return await getProblemReviewForViewer(problemId, viewer);
  } catch (error) {
    if (isApiError(error) && (error.status === 403 || error.status === 404)) {
      notFound();
    }
    throw error;
  }
}
