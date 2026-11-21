import { errors } from "@/server/api/errors";
import type { ProblemReviewActionResult } from "@/lib/problem-review-types";
import type { ProblemReviewActionInput } from "@/lib/schemas/problem-review";
import type { ProblemReviewActor } from "./problem-review-mutation-helpers";
import {
  approveProblemReview,
  publishProblem,
  startProblemRereview,
  submitProblemForReview,
} from "./problem-review-mutations";
import {
  holdProblemReview,
  reopenProblemReviewHold,
  resolveProblemReviewHold,
  respondToProblemReviewHold,
} from "./problem-review-hold-mutations";

export type { ProblemReviewActionInput } from "@/lib/schemas/problem-review";
export type { ProblemReviewActor };

export {
  approveProblemReview,
  publishProblem,
  startProblemRereview,
  submitProblemForReview,
} from "./problem-review-mutations";
export {
  holdProblemReview,
  reopenProblemReviewHold,
  resolveProblemReviewHold,
  respondToProblemReviewHold,
} from "./problem-review-hold-mutations";
export {
  getProblemReviewForViewer,
  listProblemReviewInbox,
} from "./problem-review-records";
export { listProblemReviewCredits } from "./problem-review-credits";
export { notifyProblemReviewRequested } from "./problem-review-notify";

export async function actOnProblemReview(
  actor: ProblemReviewActor,
  problemId: string,
  input: ProblemReviewActionInput,
): Promise<ProblemReviewActionResult> {
  switch (input.action) {
    case "submit":
      return submitProblemForReview(actor, problemId);
    case "approve":
      return approveProblemReview(actor, problemId, input);
    case "hold":
      return holdProblemReview(actor, problemId, input);
    case "respond":
      return respondToProblemReviewHold(actor, problemId, input);
    case "resolve":
      return resolveProblemReviewHold(actor, problemId, input);
    case "reopen":
      return reopenProblemReviewHold(actor, problemId, input);
    case "publish":
      return publishProblem(actor, problemId);
    case "reopen_publication":
      return startProblemRereview(actor, problemId, input);
    default: {
      const exhaustive: never = input;
      throw errors.validation("Unknown review action.", exhaustive);
    }
  }
}
