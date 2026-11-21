import {
  REQUIRED_PUBLICATION_APPROVALS,
  type ProblemPublicationStatus,
  type ProblemReviewApprovalStatus,
  type ProblemReviewGates,
  type ProblemReviewHoldStatus,
} from "@/lib/problem-review-types";
import type { UserRole } from "@/lib/types";

export { REQUIRED_PUBLICATION_APPROVALS };

export function isStaffRole(role: UserRole): boolean {
  return role === "TEACHER" || role === "ADMIN";
}

export function isProblemAuthor(
  viewerId: string,
  authorId: string | null,
): boolean {
  return authorId !== null && authorId === viewerId;
}

export function countActiveApprovals(
  approvals: { status: ProblemReviewApprovalStatus }[],
): number {
  return approvals.filter((approval) => approval.status === "ACTIVE").length;
}

export function countBlockingHolds(
  holds: { status: ProblemReviewHoldStatus }[],
): number {
  return holds.filter(
    (hold) => hold.status === "OPEN" || hold.status === "ADDRESSED",
  ).length;
}

export function evaluatePublicationGates(input: {
  approvals: {
    status: ProblemReviewApprovalStatus;
    solutionSource?: string | null;
  }[];
  holds: { status: ProblemReviewHoldStatus }[];
  editorial: string | null;
  reviewerTests: number;
}): ProblemReviewGates {
  const approvalCount = countActiveApprovals(input.approvals);
  const editorialReady = Boolean(input.editorial?.trim());
  const reviewerTestsReady = input.reviewerTests >= 1;
  const solutionReady = input.approvals.some(
    (approval) =>
      approval.status === "ACTIVE" &&
      Boolean(approval.solutionSource?.trim()),
  );
  const holdsClear = countBlockingHolds(input.holds) === 0;
  const missing: string[] = [];

  if (approvalCount < REQUIRED_PUBLICATION_APPROVALS) {
    const remaining = REQUIRED_PUBLICATION_APPROVALS - approvalCount;
    missing.push(
      `${remaining} more setter approval${remaining === 1 ? "" : "s"}`,
    );
  }
  if (!editorialReady) missing.push("an editorial");
  if (!reviewerTestsReady) {
    missing.push("at least one reviewer-added test case");
  }
  if (!solutionReady) missing.push("a reference solution from a reviewer");
  if (!holdsClear) missing.push("resolving every open hold");

  return {
    approvalCount,
    requiredApprovals: REQUIRED_PUBLICATION_APPROVALS,
    editorialReady,
    reviewerTestsReady,
    solutionReady,
    holdsClear,
    ready: missing.length === 0,
    missing,
  };
}

export function canSubmitProblemForReview(input: {
  viewerId: string;
  viewerRole: UserRole;
  authorId: string | null;
  status: ProblemPublicationStatus;
}): boolean {
  if (input.status !== "DRAFT") return false;
  return (
    input.viewerRole === "ADMIN" ||
    isProblemAuthor(input.viewerId, input.authorId)
  );
}

/**
 * Content edits are only safe before review starts or while the author is
 * fixing a hold. Once the problem is in review or published, a rewrite would
 * invalidate the approvals already recorded.
 */
export function canEditProblemContent(input: {
  viewerId: string;
  viewerRole: UserRole;
  authorId: string | null;
  status: ProblemPublicationStatus;
}): boolean {
  if (input.status !== "DRAFT" && input.status !== "CHANGES_REQUESTED") {
    return false;
  }
  return (
    input.viewerRole === "ADMIN" ||
    isProblemAuthor(input.viewerId, input.authorId)
  );
}

export function canReviewProblem(input: {
  viewerId: string;
  viewerRole: UserRole;
  authorId: string | null;
  status: ProblemPublicationStatus;
  activeHoldCount: number;
  approvedThisCycle: boolean;
}): boolean {
  if (!isStaffRole(input.viewerRole)) return false;
  if (isProblemAuthor(input.viewerId, input.authorId)) return false;
  if (input.status !== "IN_REVIEW") return false;
  if (input.activeHoldCount > 0) return false;
  return !input.approvedThisCycle;
}

export function canHoldProblem(input: {
  viewerId: string;
  viewerRole: UserRole;
  authorId: string | null;
  status: ProblemPublicationStatus;
  hasActiveHoldByViewer: boolean;
}): boolean {
  if (!isStaffRole(input.viewerRole)) return false;
  if (isProblemAuthor(input.viewerId, input.authorId)) return false;
  if (input.status !== "IN_REVIEW") return false;
  return !input.hasActiveHoldByViewer;
}

export function canPublishProblem(input: {
  viewerId: string;
  viewerRole: UserRole;
  authorId: string | null;
  status: ProblemPublicationStatus;
  gatesReady: boolean;
}): boolean {
  if (input.status !== "IN_REVIEW" || !input.gatesReady) return false;
  return (
    input.viewerRole === "ADMIN" ||
    isProblemAuthor(input.viewerId, input.authorId)
  );
}

/**
 * A published problem can be withdrawn into a fresh draft review. It leaves
 * the public list while the author edits it and must pass the two-setter gate
 * again before it returns.
 */
export function canStartProblemRereview(input: {
  viewerId: string;
  viewerRole: UserRole;
  authorId: string | null;
  status: ProblemPublicationStatus;
}): boolean {
  if (input.status !== "PUBLISHED") return false;
  return (
    input.viewerRole === "ADMIN" ||
    isProblemAuthor(input.viewerId, input.authorId)
  );
}

export function canRespondToHold(input: {
  viewerId: string;
  viewerRole: UserRole;
  authorId: string | null;
  status: ProblemPublicationStatus;
  holdStatus: ProblemReviewHoldStatus;
}): boolean {
  if (input.status !== "CHANGES_REQUESTED") return false;
  if (input.holdStatus !== "OPEN") return false;
  return (
    input.viewerRole === "ADMIN" ||
    isProblemAuthor(input.viewerId, input.authorId)
  );
}

export function canResolveHold(input: {
  viewerId: string;
  viewerRole: UserRole;
  reviewerId: string | null;
  holdStatus: ProblemReviewHoldStatus;
}): boolean {
  if (input.holdStatus !== "ADDRESSED") return false;
  return (
    input.viewerRole === "ADMIN" ||
    (input.reviewerId !== null && input.reviewerId === input.viewerId)
  );
}

export function canReopenHold(input: {
  viewerId: string;
  viewerRole: UserRole;
  reviewerId: string | null;
  holdStatus: ProblemReviewHoldStatus;
}): boolean {
  return canResolveHold(input);
}
