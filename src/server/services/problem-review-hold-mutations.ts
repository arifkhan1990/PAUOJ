import { and, eq, sql } from "drizzle-orm";
import { errors } from "@/server/api/errors";
import { getDb } from "@/server/db";
import {
  problemReviewApprovals,
  problemReviewHolds,
  problems,
} from "@/server/db/schema";
import type { ProblemReviewActionResult } from "@/lib/problem-review-types";
import type {
  ProblemReviewHoldInput,
  ProblemReviewReopenInput,
  ProblemReviewResolveInput,
  ProblemReviewRespondInput,
} from "@/lib/schemas/problem-review";
import {
  assertAuthorOrAdmin,
  assertEligibleReviewer,
  assertHoldActor,
  countBlockingHolds,
  finish,
  lockProblem,
  publicationConflict,
  writeAudit,
  type ProblemReviewActor,
  type Transaction,
} from "./problem-review-mutation-helpers";
import {
  notifyProblemReviewHeld,
  notifyProblemReviewReopened,
  notifyProblemReviewResolved,
  notifyProblemReviewResponded,
} from "./problem-review-notify";

async function lockHold(
  tx: Transaction,
  problemId: string,
  holdId: string,
): Promise<{
  id: string;
  status: "OPEN" | "ADDRESSED" | "RESOLVED";
  reviewerId: string;
}> {
  const [hold] = await tx
    .select({
      id: problemReviewHolds.id,
      status: problemReviewHolds.status,
      reviewerId: problemReviewHolds.reviewerId,
    })
    .from(problemReviewHolds)
    .where(
      and(
        eq(problemReviewHolds.id, holdId),
        eq(problemReviewHolds.problemId, problemId),
      ),
    )
    .for("update");
  if (!hold) throw errors.notFound("Hold not found.");
  return hold;
}

export async function holdProblemReview(
  actor: ProblemReviewActor,
  problemId: string,
  input: ProblemReviewHoldInput,
): Promise<ProblemReviewActionResult> {
  let cycle = 0;
  let holdId = "";
  await getDb().transaction(async (tx) => {
    const problem = await lockProblem(tx, problemId);
    if (problem.publicationStatus !== "IN_REVIEW") {
      throw errors.conflict(publicationConflict(problem.publicationStatus));
    }
    assertEligibleReviewer(actor, problem);
    cycle = problem.reviewCycle;
    const [activeHold] = await tx
      .select({ id: problemReviewHolds.id })
      .from(problemReviewHolds)
      .where(
        and(
          eq(problemReviewHolds.problemId, problemId),
          eq(problemReviewHolds.reviewerId, actor.id),
          sql`${problemReviewHolds.status} in ('OPEN', 'ADDRESSED')`,
        ),
      )
      .limit(1);
    if (activeHold) {
      throw errors.conflict("You already have an active hold on this problem.");
    }
    const [created] = await tx
      .insert(problemReviewHolds)
      .values({
        problemId,
        reviewerId: actor.id,
        cycle,
        status: "OPEN",
        note: input.note.trim(),
      })
      .returning({ id: problemReviewHolds.id });
    if (!created) throw errors.conflict("Could not record the hold.");
    holdId = created.id;
    await tx
      .update(problemReviewApprovals)
      .set({ status: "SUPERSEDED", updatedAt: new Date() })
      .where(
        and(
          eq(problemReviewApprovals.problemId, problemId),
          eq(problemReviewApprovals.cycle, cycle),
          eq(problemReviewApprovals.status, "ACTIVE"),
        ),
      );
    await tx
      .update(problems)
      .set({ publicationStatus: "CHANGES_REQUESTED", updatedAt: new Date() })
      .where(eq(problems.id, problemId));
    await writeAudit(tx, actor.id, "hold", problemId, { cycle, holdId });
  });
  await notifyProblemReviewHeld({
    problemId,
    cycle,
    holdId,
    actorId: actor.id,
    actorName: actor.displayName,
    note: input.note,
  });
  return finish(problemId, actor, false, false);
}

export async function respondToProblemReviewHold(
  actor: ProblemReviewActor,
  problemId: string,
  input: ProblemReviewRespondInput,
): Promise<ProblemReviewActionResult> {
  let cycle = 0;
  const respondedAt = new Date();
  await getDb().transaction(async (tx) => {
    const problem = await lockProblem(tx, problemId);
    assertAuthorOrAdmin(actor, problem);
    if (problem.publicationStatus !== "CHANGES_REQUESTED") {
      throw errors.conflict(publicationConflict(problem.publicationStatus));
    }
    const hold = await lockHold(tx, problemId, input.holdId);
    if (hold.status !== "OPEN") {
      throw errors.conflict("This hold is not waiting for an author response.");
    }
    cycle = problem.reviewCycle;
    await tx
      .update(problemReviewHolds)
      .set({
        status: "ADDRESSED",
        authorResponse: input.response.trim(),
        respondedAt,
        updatedAt: respondedAt,
      })
      .where(eq(problemReviewHolds.id, input.holdId));
    await writeAudit(tx, actor.id, "respond", problemId, {
      cycle,
      holdId: input.holdId,
    });
  });
  await notifyProblemReviewResponded({
    problemId,
    cycle,
    holdId: input.holdId,
    actorName: actor.displayName,
    response: input.response,
    respondedAt,
  });
  return finish(problemId, actor, false, false);
}

export async function resolveProblemReviewHold(
  actor: ProblemReviewActor,
  problemId: string,
  input: ProblemReviewResolveInput,
): Promise<ProblemReviewActionResult> {
  let cycle = 0;
  let reopened = false;
  await getDb().transaction(async (tx) => {
    const problem = await lockProblem(tx, problemId);
    if (problem.publicationStatus !== "CHANGES_REQUESTED") {
      throw errors.conflict(publicationConflict(problem.publicationStatus));
    }
    const hold = await lockHold(tx, problemId, input.holdId);
    if (hold.status !== "ADDRESSED") {
      throw errors.conflict("The author has not responded to this hold yet.");
    }
    assertHoldActor(actor, hold.reviewerId);
    cycle = problem.reviewCycle;
    const now = new Date();
    await tx
      .update(problemReviewHolds)
      .set({
        status: "RESOLVED",
        resolutionNote: input.note?.trim() || null,
        resolvedById: actor.id,
        resolvedAt: now,
        updatedAt: now,
      })
      .where(eq(problemReviewHolds.id, input.holdId));
    if ((await countBlockingHolds(tx, problemId)) === 0) {
      reopened = true;
      await tx
        .update(problems)
        .set({
          publicationStatus: "IN_REVIEW",
          reviewCycle: sql`${problems.reviewCycle} + 1`,
          updatedAt: now,
        })
        .where(eq(problems.id, problemId));
    }
    await writeAudit(tx, actor.id, "resolve", problemId, {
      cycle,
      holdId: input.holdId,
      reopened,
    });
  });
  await notifyProblemReviewResolved({
    problemId,
    cycle,
    holdId: input.holdId,
    actorName: actor.displayName,
    note: input.note,
    reopened,
  });
  return finish(problemId, actor, false, reopened);
}

export async function reopenProblemReviewHold(
  actor: ProblemReviewActor,
  problemId: string,
  input: ProblemReviewReopenInput,
): Promise<ProblemReviewActionResult> {
  let cycle = 0;
  await getDb().transaction(async (tx) => {
    const problem = await lockProblem(tx, problemId);
    if (problem.publicationStatus !== "CHANGES_REQUESTED") {
      throw errors.conflict(publicationConflict(problem.publicationStatus));
    }
    const hold = await lockHold(tx, problemId, input.holdId);
    if (hold.status !== "ADDRESSED") {
      throw errors.conflict("Only an addressed hold can be reopened.");
    }
    assertHoldActor(actor, hold.reviewerId);
    cycle = problem.reviewCycle;
    const now = new Date();
    await tx
      .update(problemReviewHolds)
      .set({
        status: "OPEN",
        reopenNote: input.note.trim(),
        reopenedAt: now,
        updatedAt: now,
      })
      .where(eq(problemReviewHolds.id, input.holdId));
    await writeAudit(tx, actor.id, "reopen", problemId, {
      cycle,
      holdId: input.holdId,
    });
  });
  await notifyProblemReviewReopened({
    problemId,
    cycle,
    holdId: input.holdId,
    actorName: actor.displayName,
    note: input.note,
  });
  return finish(problemId, actor, false, false);
}
