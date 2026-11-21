import { and, count, desc, eq, sql, type SQL } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { getDb } from "@/server/db";
import {
  problemReviewApprovals,
  problems,
  users,
} from "@/server/db/schema";
import {
  REQUIRED_PUBLICATION_APPROVALS,
  type ProblemPublicationStatus,
  type ProblemReviewCredit,
  type ProblemReviewQueueItem,
} from "@/lib/problem-review-types";
import type { SafeUser } from "@/server/auth/session";
import type { Difficulty, UserRole } from "@/lib/types";
import { isStaffRole } from "./problem-review-policy";

const QUEUE_LIMIT = 50;
const CREDIT_LIMIT = 20;

const authorUser = alias(users, "queue_author");

type QueueRow = {
  problemId: string;
  slug: string;
  title: string;
  difficulty: Difficulty;
  authorId: string | null;
  authorUsername: string | null;
  authorDisplayName: string | null;
  authorRole: UserRole | null;
  publicationStatus: ProblemPublicationStatus;
  reviewCycle: number;
  publishedAt: Date | null;
  updatedAt: Date;
  approvalCount: number;
  openHoldCount: number;
  addressedHoldCount: number;
  approvedByMe: boolean;
  heldByMe: boolean;
};

function queueSelection(viewerId: string) {
  return {
    problemId: problems.id,
    slug: problems.slug,
    title: problems.title,
    difficulty: problems.difficulty,
    authorId: problems.authorId,
    authorUsername: authorUser.username,
    authorDisplayName: authorUser.displayName,
    authorRole: authorUser.role,
    publicationStatus: problems.publicationStatus,
    reviewCycle: problems.reviewCycle,
    publishedAt: problems.publishedAt,
    updatedAt: problems.updatedAt,
    approvalCount: sql<number>`(
      select count(*)::int from "problem_review_approvals" a
      where a."problem_id" = ${problems.id}
        and a."cycle" = ${problems.reviewCycle}
        and a."status" = 'ACTIVE'
    )`,
    openHoldCount: sql<number>`(
      select count(*)::int from "problem_review_holds" h
      where h."problem_id" = ${problems.id} and h."status" = 'OPEN'
    )`,
    addressedHoldCount: sql<number>`(
      select count(*)::int from "problem_review_holds" h
      where h."problem_id" = ${problems.id} and h."status" = 'ADDRESSED'
    )`,
    approvedByMe: sql<boolean>`exists (
      select 1 from "problem_review_approvals" a
      where a."problem_id" = ${problems.id}
        and a."reviewer_id" = ${viewerId}
        and a."cycle" = ${problems.reviewCycle}
    )`,
    heldByMe: sql<boolean>`exists (
      select 1 from "problem_review_holds" h
      where h."problem_id" = ${problems.id}
        and h."reviewer_id" = ${viewerId}
        and h."status" in ('OPEN', 'ADDRESSED')
    )`,
  };
}

function queueQuery(viewerId: string) {
  return getDb()
    .select(queueSelection(viewerId))
    .from(problems)
    .leftJoin(authorUser, eq(authorUser.id, problems.authorId));
}

function mapQueueRow(row: QueueRow): ProblemReviewQueueItem {
  return {
    problemId: row.problemId,
    slug: row.slug,
    title: row.title,
    difficulty: row.difficulty,
    author:
      row.authorId &&
      row.authorUsername &&
      row.authorDisplayName &&
      row.authorRole
        ? {
            id: row.authorId,
            username: row.authorUsername,
            displayName: row.authorDisplayName,
            role: row.authorRole,
          }
        : null,
    publicationStatus: row.publicationStatus,
    reviewCycle: row.reviewCycle,
    approvalCount: Number(row.approvalCount),
    requiredApprovals: REQUIRED_PUBLICATION_APPROVALS,
    openHoldCount: Number(row.openHoldCount),
    addressedHoldCount: Number(row.addressedHoldCount),
    approvedByMe: Boolean(row.approvedByMe),
    heldByMe: Boolean(row.heldByMe),
    publishedAt: row.publishedAt?.toISOString() ?? null,
    updatedAt: row.updatedAt.toISOString(),
  };
}

function authorScope(
  viewerId: string,
  staff: boolean,
): SQL<unknown> | undefined {
  if (staff) return undefined;
  return sql`${problems.authorId} = ${viewerId}`;
}

function reviewQueueWhere(viewerId: string) {
  return and(
    eq(problems.publicationStatus, "IN_REVIEW"),
    sql`${problems.authorId} is null or ${problems.authorId} <> ${viewerId}`,
    sql`not exists (
      select 1 from "problem_review_holds" h
      where h."problem_id" = ${problems.id} and h."status" in ('OPEN', 'ADDRESSED')
    )`,
  );
}

function myReviewsWhere(viewerId: string) {
  return and(
    eq(problems.authorId, viewerId),
    sql`${problems.publicationStatus} in ('IN_REVIEW', 'CHANGES_REQUESTED')`,
  );
}

function heldWhere(viewerId: string, staff: boolean) {
  return and(
    sql`${problems.publicationStatus} in ('IN_REVIEW', 'CHANGES_REQUESTED')`,
    sql`exists (
      select 1 from "problem_review_holds" h
      where h."problem_id" = ${problems.id}
        and h."status" in ('OPEN', 'ADDRESSED')
        and h."cycle" = ${problems.reviewCycle}
    )`,
    authorScope(viewerId, staff),
  );
}

export async function listProblemReviewQueue(
  viewer: Pick<SafeUser, "id" | "role">,
): Promise<{
  reviewQueue: ProblemReviewQueueItem[];
  myReviews: ProblemReviewQueueItem[];
  held: ProblemReviewQueueItem[];
}> {
  const staff = isStaffRole(viewer.role);
  const [reviewQueueRows, myReviewRows, heldRows] = await Promise.all([
    staff
      ? queueQuery(viewer.id)
          .where(reviewQueueWhere(viewer.id))
          .orderBy(desc(problems.updatedAt))
          .limit(QUEUE_LIMIT)
      : Promise.resolve([] as QueueRow[]),
    queueQuery(viewer.id)
      .where(myReviewsWhere(viewer.id))
      .orderBy(desc(problems.updatedAt))
      .limit(QUEUE_LIMIT),
    queueQuery(viewer.id)
      .where(heldWhere(viewer.id, staff))
      .orderBy(desc(problems.updatedAt))
      .limit(QUEUE_LIMIT),
  ]);
  return {
    reviewQueue: (reviewQueueRows as QueueRow[]).map(mapQueueRow),
    myReviews: (myReviewRows as QueueRow[]).map(mapQueueRow),
    held: (heldRows as QueueRow[]).map(mapQueueRow),
  };
}

export async function countProblemReviewQueue(
  viewer: Pick<SafeUser, "id" | "role">,
): Promise<{ reviewQueue: number; myReviews: number; held: number }> {
  const staff = isStaffRole(viewer.role);
  const [reviewQueue, myReviews, held] = await Promise.all([
    staff
      ? getDb()
          .select({ value: count() })
          .from(problems)
          .where(reviewQueueWhere(viewer.id))
      : Promise.resolve([{ value: 0 }]),
    getDb()
      .select({ value: count() })
      .from(problems)
      .where(myReviewsWhere(viewer.id)),
    getDb()
      .select({ value: count() })
      .from(problems)
      .where(heldWhere(viewer.id, staff)),
  ]);
  return {
    reviewQueue: Number(reviewQueue[0]?.value ?? 0),
    myReviews: Number(myReviews[0]?.value ?? 0),
    held: Number(held[0]?.value ?? 0),
  };
}

export function creditWhere(userId: string) {
  return and(
    eq(problemReviewApprovals.reviewerId, userId),
    eq(problemReviewApprovals.status, "ACTIVE"),
    eq(problems.publicationStatus, "PUBLISHED"),
  );
}

export async function listProblemReviewCredits(
  userId: string,
  limit = CREDIT_LIMIT,
): Promise<ProblemReviewCredit[]> {
  const rows = await getDb()
    .select({
      problemId: problems.id,
      slug: problems.slug,
      title: problems.title,
      publishedAt: problems.publishedAt,
      solutionLanguage: problemReviewApprovals.solutionLanguage,
      testsAdded: problemReviewApprovals.testsAdded,
      editorialProvided: problemReviewApprovals.editorialProvided,
    })
    .from(problemReviewApprovals)
    .innerJoin(problems, eq(problems.id, problemReviewApprovals.problemId))
    .where(creditWhere(userId))
    .orderBy(desc(problems.publishedAt))
    .limit(limit);

  const seen = new Set<string>();
  const credits: ProblemReviewCredit[] = [];
  for (const row of rows) {
    if (!row.publishedAt || seen.has(row.problemId)) continue;
    seen.add(row.problemId);
    credits.push({
      problemId: row.problemId,
      slug: row.slug,
      title: row.title,
      publishedAt: row.publishedAt.toISOString(),
      solutionLanguage: row.solutionLanguage,
      testsAdded: row.testsAdded,
      editorialProvided: row.editorialProvided,
    });
  }
  return credits;
}

export async function countProblemReviewCredits(
  userId: string,
): Promise<number> {
  const [row] = await getDb()
    .select({ value: count() })
    .from(problemReviewApprovals)
    .innerJoin(problems, eq(problems.id, problemReviewApprovals.problemId))
    .where(creditWhere(userId));
  return Number(row?.value ?? 0);
}
