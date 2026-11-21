import { and, count, eq, sql } from "drizzle-orm";
import { errors } from "@/server/api/errors";
import type { Database } from "@/server/db";
import {
  auditLogs,
  problemReviewHolds,
  problems,
  testCases,
} from "@/server/db/schema";
import type {
  ProblemPublicationStatus,
  ProblemReviewActionResult,
} from "@/lib/problem-review-types";
import type { ProblemReviewApproveInput } from "@/lib/schemas/problem-review";
import type { SafeUser } from "@/server/auth/session";
import { isProblemAuthor, isStaffRole } from "./problem-review-policy";
import {
  getProblemReviewForViewer,
  loadPublicationGates,
} from "./problem-review-records";

export type ProblemReviewActor = Pick<
  SafeUser,
  "id" | "role" | "displayName"
>;

export type Transaction = Parameters<
  Parameters<Database["transaction"]>[0]
>[0];

export type LockedProblem = {
  id: string;
  title: string;
  authorId: string | null;
  publicationStatus: ProblemPublicationStatus;
  reviewCycle: number;
  editorial: string | null;
};

export const REVIEW_LOCK_MESSAGE =
  "This problem belongs to a running contest or assessment. Review it after it ends.";

export function publicationConflict(
  status: ProblemPublicationStatus,
): string {
  if (status === "PUBLISHED") return "This problem is already published.";
  if (status === "IN_REVIEW") return "This problem is already in review.";
  if (status === "CHANGES_REQUESTED") {
    return "This problem has an unresolved hold. Resolve it before continuing.";
  }
  return "Submit this problem for review first.";
}

export async function lockProblem(
  tx: Transaction,
  problemId: string,
): Promise<LockedProblem> {
  const [row] = await tx
    .select({
      id: problems.id,
      title: problems.title,
      authorId: problems.authorId,
      publicationStatus: problems.publicationStatus,
      reviewCycle: problems.reviewCycle,
      editorial: problems.editorial,
    })
    .from(problems)
    .where(eq(problems.id, problemId))
    .for("update");
  if (!row) throw errors.notFound("Problem not found.");
  return row;
}

export async function writeAudit(
  tx: Transaction,
  actorId: string,
  event: string,
  problemId: string,
  metadata: Record<string, unknown>,
): Promise<void> {
  await tx.insert(auditLogs).values({
    actorId,
    action: `problem.review.${event}`,
    entityType: "problem",
    entityId: problemId,
    metadata,
  });
}

export function assertEligibleReviewer(
  actor: ProblemReviewActor,
  problem: LockedProblem,
): void {
  if (!isStaffRole(actor.role) || isProblemAuthor(actor.id, problem.authorId)) {
    throw errors.forbidden(
      "Only another teacher or admin can review this problem.",
    );
  }
}

export function assertAuthorOrAdmin(
  actor: ProblemReviewActor,
  problem: LockedProblem,
): void {
  if (actor.role !== "ADMIN" && !isProblemAuthor(actor.id, problem.authorId)) {
    throw errors.forbidden("Only the problem author or an admin can do that.");
  }
}

export function assertHoldActor(
  actor: ProblemReviewActor,
  holdReviewerId: string,
): void {
  if (actor.role !== "ADMIN" && holdReviewerId !== actor.id) {
    throw errors.forbidden(
      "Only the reviewer who raised the hold or an admin can do that.",
    );
  }
}

export async function appendReviewerTests(
  tx: Transaction,
  problemId: string,
  tests: ProblemReviewApproveInput["tests"],
): Promise<number> {
  if (tests.length === 0) return 0;
  const [existingRow] = await tx
    .select({ value: count() })
    .from(testCases)
    .where(eq(testCases.problemId, problemId));
  if (Number(existingRow?.value ?? 0) + tests.length > 200) {
    throw errors.validation(
      "This problem already has the maximum number of test cases (200).",
    );
  }
  const [maxRow] = await tx
    .select({
      value: sql<number>`coalesce(max(${testCases.position}), 0)::int`,
    })
    .from(testCases)
    .where(eq(testCases.problemId, problemId));
  const start = Number(maxRow?.value ?? 0) + 1;
  await tx.insert(testCases).values(
    tests.map((test, index) => ({
      problemId,
      input: test.input,
      expectedOutput: test.expectedOutput,
      isSample: test.isSample,
      position: start + index,
    })),
  );
  return tests.length;
}

export async function countBlockingHolds(
  tx: Transaction,
  problemId: string,
): Promise<number> {
  const [row] = await tx
    .select({ value: count() })
    .from(problemReviewHolds)
    .where(
      and(
        eq(problemReviewHolds.problemId, problemId),
        sql`${problemReviewHolds.status} in ('OPEN', 'ADDRESSED')`,
      ),
    );
  return Number(row?.value ?? 0);
}

export async function publishIfReady(
  tx: Transaction,
  input: { problemId: string; cycle: number; editorial: string | null },
): Promise<boolean> {
  const gates = await loadPublicationGates(tx, input);
  if (!gates.ready) return false;
  const now = new Date();
  await tx
    .update(problems)
    .set({
      publicationStatus: "PUBLISHED",
      isPublic: true,
      publishedAt: now,
      updatedAt: now,
    })
    .where(eq(problems.id, input.problemId));
  return true;
}

export async function finish(
  problemId: string,
  actor: ProblemReviewActor,
  published: boolean,
  reopened: boolean,
): Promise<ProblemReviewActionResult> {
  return {
    review: await getProblemReviewForViewer(problemId, actor),
    published,
    reopened,
  };
}
