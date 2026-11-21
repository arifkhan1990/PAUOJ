import { and, desc, eq, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import type { Database } from "@/server/db";
import {
  problemReviewApprovals,
  problemReviewHolds,
  users,
} from "@/server/db/schema";
import type {
  ProblemReviewApprovalItem,
  ProblemReviewApprovalStatus,
  ProblemReviewGates,
  ProblemReviewHoldItem,
  ProblemReviewHoldStatus,
  ProblemReviewUser,
} from "@/lib/problem-review-types";
import type { UserRole } from "@/lib/types";
import { evaluatePublicationGates } from "./problem-review-policy";

type Transaction = Parameters<
  Parameters<Database["transaction"]>[0]
>[0];
export type ReviewExecutor = Database | Transaction;

export const reviewAuthorUser = alias(users, "review_author");
const reviewerUser = alias(users, "review_approver");
const holdReviewerUser = alias(users, "review_hold_reviewer");
const holdResolverUser = alias(users, "review_hold_resolver");

const approvalColumns = {
  id: problemReviewApprovals.id,
  reviewerId: problemReviewApprovals.reviewerId,
  status: problemReviewApprovals.status,
  note: problemReviewApprovals.note,
  solutionLanguage: problemReviewApprovals.solutionLanguage,
  solutionSource: problemReviewApprovals.solutionSource,
  testsAdded: problemReviewApprovals.testsAdded,
  editorialProvided: problemReviewApprovals.editorialProvided,
  createdAt: problemReviewApprovals.createdAt,
  reviewerUsername: reviewerUser.username,
  reviewerDisplayName: reviewerUser.displayName,
  reviewerRole: reviewerUser.role,
};

const holdColumns = {
  id: problemReviewHolds.id,
  reviewerId: problemReviewHolds.reviewerId,
  status: problemReviewHolds.status,
  note: problemReviewHolds.note,
  authorResponse: problemReviewHolds.authorResponse,
  respondedAt: problemReviewHolds.respondedAt,
  resolutionNote: problemReviewHolds.resolutionNote,
  resolvedById: problemReviewHolds.resolvedById,
  resolvedAt: problemReviewHolds.resolvedAt,
  reopenNote: problemReviewHolds.reopenNote,
  reopenedAt: problemReviewHolds.reopenedAt,
  createdAt: problemReviewHolds.createdAt,
  reviewerUsername: holdReviewerUser.username,
  reviewerDisplayName: holdReviewerUser.displayName,
  reviewerRole: holdReviewerUser.role,
  resolverUsername: holdResolverUser.username,
  resolverDisplayName: holdResolverUser.displayName,
  resolverRole: holdResolverUser.role,
};

export type ReviewApprovalRow = {
  id: string;
  reviewerId: string;
  status: ProblemReviewApprovalStatus;
  note: string | null;
  solutionLanguage: string;
  solutionSource: string;
  testsAdded: number;
  editorialProvided: boolean;
  createdAt: Date;
  reviewerUsername: string | null;
  reviewerDisplayName: string | null;
  reviewerRole: UserRole | null;
};

export type ReviewHoldRow = {
  id: string;
  reviewerId: string;
  status: ProblemReviewHoldStatus;
  note: string;
  authorResponse: string | null;
  respondedAt: Date | null;
  resolutionNote: string | null;
  resolvedById: string | null;
  resolvedAt: Date | null;
  reopenNote: string | null;
  reopenedAt: Date | null;
  createdAt: Date;
  reviewerUsername: string | null;
  reviewerDisplayName: string | null;
  reviewerRole: UserRole | null;
  resolverUsername: string | null;
  resolverDisplayName: string | null;
  resolverRole: UserRole | null;
};

export function mapReviewUser(
  id: string | null,
  username: string | null,
  displayName: string | null,
  role: UserRole | null,
): ProblemReviewUser | null {
  if (!id || !username || !displayName || !role) return null;
  return { id, username, displayName, role };
}

export function mapApproval(row: ReviewApprovalRow): ProblemReviewApprovalItem {
  return {
    id: row.id,
    reviewer: mapReviewUser(
      row.reviewerId,
      row.reviewerUsername,
      row.reviewerDisplayName,
      row.reviewerRole,
    ),
    status: row.status,
    note: row.note,
    solutionLanguage: row.solutionLanguage,
    solutionSource: row.solutionSource,
    testsAdded: row.testsAdded,
    editorialProvided: row.editorialProvided,
    createdAt: row.createdAt.toISOString(),
  };
}

export function mapHold(row: ReviewHoldRow): ProblemReviewHoldItem {
  return {
    id: row.id,
    reviewer: mapReviewUser(
      row.reviewerId,
      row.reviewerUsername,
      row.reviewerDisplayName,
      row.reviewerRole,
    ),
    status: row.status,
    note: row.note,
    authorResponse: row.authorResponse,
    respondedAt: row.respondedAt?.toISOString() ?? null,
    resolutionNote: row.resolutionNote,
    resolver: mapReviewUser(
      row.resolvedById,
      row.resolverUsername,
      row.resolverDisplayName,
      row.resolverRole,
    ),
    resolvedAt: row.resolvedAt?.toISOString() ?? null,
    reopenNote: row.reopenNote,
    reopenedAt: row.reopenedAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
  };
}

export function isBlockingHold(status: ProblemReviewHoldStatus): boolean {
  return status === "OPEN" || status === "ADDRESSED";
}

export async function loadApprovalRows(
  executor: ReviewExecutor,
  problemId: string,
  cycle: number,
): Promise<ReviewApprovalRow[]> {
  return executor
    .select(approvalColumns)
    .from(problemReviewApprovals)
    .leftJoin(
      reviewerUser,
      eq(reviewerUser.id, problemReviewApprovals.reviewerId),
    )
    .where(
      and(
        eq(problemReviewApprovals.problemId, problemId),
        eq(problemReviewApprovals.cycle, cycle),
      ),
    )
    .orderBy(desc(problemReviewApprovals.createdAt));
}

export async function loadHoldRows(
  executor: ReviewExecutor,
  problemId: string,
): Promise<ReviewHoldRow[]> {
  return executor
    .select(holdColumns)
    .from(problemReviewHolds)
    .leftJoin(
      holdReviewerUser,
      eq(holdReviewerUser.id, problemReviewHolds.reviewerId),
    )
    .leftJoin(
      holdResolverUser,
      eq(holdResolverUser.id, problemReviewHolds.resolvedById),
    )
    .where(eq(problemReviewHolds.problemId, problemId))
    .orderBy(desc(problemReviewHolds.createdAt));
}

export async function loadBlockingHoldRows(
  executor: ReviewExecutor,
  problemId: string,
): Promise<ReviewHoldRow[]> {
  const rows = await loadHoldRows(executor, problemId);
  return rows.filter((row) => isBlockingHold(row.status));
}

export async function countReviewerTests(
  executor: ReviewExecutor,
  problemId: string,
  cycle: number,
): Promise<number> {
  const [row] = await executor
    .select({
      value: sql<number>`coalesce(sum(${problemReviewApprovals.testsAdded}), 0)::int`,
    })
    .from(problemReviewApprovals)
    .where(
      and(
        eq(problemReviewApprovals.problemId, problemId),
        eq(problemReviewApprovals.cycle, cycle),
        eq(problemReviewApprovals.status, "ACTIVE"),
      ),
    );
  return Number(row?.value ?? 0);
}

export async function loadPublicationGates(
  executor: ReviewExecutor,
  input: { problemId: string; cycle: number; editorial: string | null },
): Promise<ProblemReviewGates> {
  const [approvals, holds, reviewerTests] = await Promise.all([
    loadApprovalRows(executor, input.problemId, input.cycle),
    loadBlockingHoldRows(executor, input.problemId),
    countReviewerTests(executor, input.problemId, input.cycle),
  ]);
  return evaluatePublicationGates({
    approvals,
    holds,
    editorial: input.editorial,
    reviewerTests,
  });
}
