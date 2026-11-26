import { and, eq } from "drizzle-orm";
import { errors } from "@/server/api/errors";
import { getDb } from "@/server/db";
import {
  problemReferenceSolutions,
  problemReviewApprovals,
  problems,
} from "@/server/db/schema";
import type { ProblemReviewActionResult } from "@/lib/problem-review-types";
import type {
  ProblemReviewApproveInput,
  ProblemReviewRereviewInput,
} from "@/lib/schemas/problem-review";
import { assertProblemNotInLiveContext } from "./problem-access";
import { referenceFromApproval } from "./problem-reference-approval";
import {
  assertAuthorOrAdmin,
  assertEligibleReviewer,
  appendReviewerTests,
  countBlockingHolds,
  finish,
  lockProblem,
  publicationConflict,
  publishIfReady,
  REVIEW_LOCK_MESSAGE,
  writeAudit,
  type ProblemReviewActor,
} from "./problem-review-mutation-helpers";
import { loadPublicationGates } from "./problem-review-records";
import {
  notifyProblemPublished,
  notifyProblemReviewApproved,
  notifyProblemRereviewStarted,
  notifyProblemReviewRequested,
} from "./problem-review-notify";

export async function submitProblemForReview(
  actor: ProblemReviewActor,
  problemId: string,
): Promise<ProblemReviewActionResult> {
  let cycle = 0;
  await getDb().transaction(async (tx) => {
    const problem = await lockProblem(tx, problemId);
    assertAuthorOrAdmin(actor, problem);
    if (problem.publicationStatus !== "DRAFT") {
      throw errors.conflict(publicationConflict(problem.publicationStatus));
    }
    cycle = problem.reviewCycle + 1;
    await tx
      .update(problems)
      .set({
        publicationStatus: "IN_REVIEW",
        reviewCycle: cycle,
        updatedAt: new Date(),
      })
      .where(eq(problems.id, problemId));
    await writeAudit(tx, actor.id, "submit", problemId, {
      cycle,
      authorId: problem.authorId,
    });
  });
  await notifyProblemReviewRequested(problemId, cycle);
  return finish(problemId, actor, false, false);
}

export async function approveProblemReview(
  actor: ProblemReviewActor,
  problemId: string,
  input: ProblemReviewApproveInput,
): Promise<ProblemReviewActionResult> {
  await assertProblemNotInLiveContext(
    problemId,
    "REVIEW_LOCKED",
    REVIEW_LOCK_MESSAGE,
  );
  let published = false;
  let cycle = 0;
  await getDb().transaction(async (tx) => {
    const problem = await lockProblem(tx, problemId);
    if (problem.publicationStatus !== "IN_REVIEW") {
      throw errors.conflict(publicationConflict(problem.publicationStatus));
    }
    assertEligibleReviewer(actor, problem);
    if ((await countBlockingHolds(tx, problemId)) > 0) {
      throw errors.conflict(
        "This problem is on hold. Approvals reopen after the hold is resolved.",
      );
    }
    cycle = problem.reviewCycle;
    const [existing] = await tx
      .select({ id: problemReviewApprovals.id })
      .from(problemReviewApprovals)
      .where(
        and(
          eq(problemReviewApprovals.problemId, problemId),
          eq(problemReviewApprovals.reviewerId, actor.id),
          eq(problemReviewApprovals.cycle, cycle),
        ),
      )
      .limit(1);
    if (existing) {
      throw errors.conflict(
        "You already reviewed this problem in the current review cycle.",
      );
    }

    const testsAdded = await appendReviewerTests(tx, problemId, input.tests);
    const editorial = input.editorial?.trim() || null;
    if (editorial) {
      await tx
        .update(problems)
        .set({ editorial, updatedAt: new Date() })
        .where(eq(problems.id, problemId));
    }
    await tx.insert(problemReviewApprovals).values({
      problemId,
      reviewerId: actor.id,
      cycle,
      status: "ACTIVE",
      note: input.note?.trim() || null,
      solutionLanguage: input.solutionLanguage,
      solutionSource: input.solutionSource,
      testsAdded,
      editorialProvided: Boolean(editorial),
    });
    const reference = referenceFromApproval(input);
    if (reference) {
      const script = problem.judgeLanguage === "sql-script";
      const now = new Date();
      await tx
        .insert(problemReferenceSolutions)
        .values({
          problemId,
          language: reference.language,
          source: reference.source,
          script,
          updatedAt: now,
        })
        .onConflictDoUpdate({
          target: problemReferenceSolutions.problemId,
          set: {
            language: reference.language,
            source: reference.source,
            script,
            updatedAt: now,
          },
        });
    }
    published = await publishIfReady(tx, {
      problemId,
      cycle,
      editorial: editorial ?? problem.editorial,
    });
    await writeAudit(tx, actor.id, "approve", problemId, {
      cycle,
      testsAdded,
      editorialProvided: Boolean(editorial),
      published,
    });
    if (published) {
      await writeAudit(tx, actor.id, "publish", problemId, {
        cycle,
        automatic: true,
      });
    }
  });
  const result = await finish(problemId, actor, published, false);
  if (published) {
    await notifyProblemPublished(problemId, cycle);
  } else {
    await notifyProblemReviewApproved({
      problemId,
      cycle,
      actorId: actor.id,
      actorName: actor.displayName,
      approvalCount: result.review.gates.approvalCount,
    });
  }
  return result;
}

export async function startProblemRereview(
  actor: ProblemReviewActor,
  problemId: string,
  input: ProblemReviewRereviewInput,
): Promise<ProblemReviewActionResult> {
  await assertProblemNotInLiveContext(
    problemId,
    "REVIEW_LOCKED",
    REVIEW_LOCK_MESSAGE,
  );
  let cycle = 0;
  await getDb().transaction(async (tx) => {
    const problem = await lockProblem(tx, problemId);
    if (problem.publicationStatus !== "PUBLISHED") {
      throw errors.conflict(
        "Only a published problem can be withdrawn for re-review.",
      );
    }
    assertAuthorOrAdmin(actor, problem);
    cycle = problem.reviewCycle;
    const now = new Date();
    await tx
      .update(problemReviewApprovals)
      .set({ status: "SUPERSEDED", updatedAt: now })
      .where(
        and(
          eq(problemReviewApprovals.problemId, problemId),
          eq(problemReviewApprovals.cycle, cycle),
          eq(problemReviewApprovals.status, "ACTIVE"),
        ),
      );
    await tx
      .update(problems)
      .set({
        publicationStatus: "DRAFT",
        isPublic: false,
        updatedAt: now,
      })
      .where(eq(problems.id, problemId));
    await writeAudit(tx, actor.id, "rereview", problemId, {
      cycle,
      note: input.note.trim(),
    });
  });
  await notifyProblemRereviewStarted({
    problemId,
    cycle,
    actorId: actor.id,
    actorName: actor.displayName,
    note: input.note,
  });
  return finish(problemId, actor, false, true);
}

export async function publishProblem(
  actor: ProblemReviewActor,
  problemId: string,
): Promise<ProblemReviewActionResult> {
  await assertProblemNotInLiveContext(
    problemId,
    "REVIEW_LOCKED",
    REVIEW_LOCK_MESSAGE,
  );
  let cycle = 0;
  await getDb().transaction(async (tx) => {
    const problem = await lockProblem(tx, problemId);
    if (problem.publicationStatus !== "IN_REVIEW") {
      throw errors.conflict(publicationConflict(problem.publicationStatus));
    }
    assertAuthorOrAdmin(actor, problem);
    cycle = problem.reviewCycle;
    const gates = await loadPublicationGates(tx, {
      problemId,
      cycle,
      editorial: problem.editorial,
    });
    if (!gates.ready) {
      throw errors.validation(
        `This problem is not ready to publish. Still missing: ${gates.missing.join(", ")}.`,
        { missing: gates.missing },
      );
    }
    const now = new Date();
    await tx
      .update(problems)
      .set({
        publicationStatus: "PUBLISHED",
        isPublic: true,
        publishedAt: now,
        updatedAt: now,
      })
      .where(eq(problems.id, problemId));
    await writeAudit(tx, actor.id, "publish", problemId, {
      cycle,
      automatic: false,
    });
  });
  await notifyProblemPublished(problemId, cycle);
  return finish(problemId, actor, true, false);
}
