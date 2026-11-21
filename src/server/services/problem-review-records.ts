import { and, asc, count, eq, inArray, ne } from "drizzle-orm";
import { errors } from "@/server/api/errors";
import { getDb } from "@/server/db";
import {
  problems,
  problemTags,
  tags,
  testCases,
  users,
} from "@/server/db/schema";
import type {
  ProblemReviewDetail,
  ProblemReviewInbox,
} from "@/lib/problem-review-types";
import type { SafeUser } from "@/server/auth/session";
import type { UserRole } from "@/lib/types";
import {
  canHoldProblem,
  canPublishProblem,
  canRespondToHold,
  canResolveHold,
  canReviewProblem,
  canStartProblemRereview,
  canSubmitProblemForReview,
  evaluatePublicationGates,
  isProblemAuthor,
  isStaffRole,
} from "./problem-review-policy";
import {
  countProblemReviewCredits,
  countProblemReviewQueue,
  listProblemReviewCredits,
  listProblemReviewQueue,
} from "./problem-review-credits";
import {
  isBlockingHold,
  loadApprovalRows,
  loadHoldRows,
  mapApproval,
  mapHold,
  mapReviewUser,
  reviewAuthorUser,
} from "./problem-review-store";

export {
  isBlockingHold,
  loadApprovalRows,
  loadBlockingHoldRows,
  loadHoldRows,
  loadPublicationGates,
} from "./problem-review-store";
export type {
  ReviewApprovalRow,
  ReviewHoldRow,
} from "./problem-review-store";
export {
  countProblemReviewCredits,
  listProblemReviewCredits,
} from "./problem-review-credits";

type Viewer = Pick<SafeUser, "id" | "role">;

type LoadedProblem = {
  id: string;
  slug: string;
  title: string;
  statement: string;
  inputFormat: string | null;
  outputFormat: string | null;
  constraints: string | null;
  editorial: string | null;
  difficulty: ProblemReviewDetail["difficulty"];
  points: number;
  timeLimitMs: number;
  memoryLimitMb: number;
  authorId: string | null;
  authorUsername: string | null;
  authorDisplayName: string | null;
  authorRole: UserRole | null;
  publicationStatus: ProblemReviewDetail["publicationStatus"];
  reviewCycle: number;
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

async function loadProblem(problemId: string): Promise<LoadedProblem | null> {
  const [row] = await getDb()
    .select({
      id: problems.id,
      slug: problems.slug,
      title: problems.title,
      statement: problems.statement,
      inputFormat: problems.inputFormat,
      outputFormat: problems.outputFormat,
      constraints: problems.constraints,
      editorial: problems.editorial,
      difficulty: problems.difficulty,
      points: problems.points,
      timeLimitMs: problems.timeLimitMs,
      memoryLimitMb: problems.memoryLimitMb,
      authorId: problems.authorId,
      authorUsername: reviewAuthorUser.username,
      authorDisplayName: reviewAuthorUser.displayName,
      authorRole: reviewAuthorUser.role,
      publicationStatus: problems.publicationStatus,
      reviewCycle: problems.reviewCycle,
      publishedAt: problems.publishedAt,
      createdAt: problems.createdAt,
      updatedAt: problems.updatedAt,
    })
    .from(problems)
    .leftJoin(reviewAuthorUser, eq(reviewAuthorUser.id, problems.authorId))
    .where(eq(problems.id, problemId))
    .limit(1);
  return row ?? null;
}

async function loadTests(
  problemId: string,
): Promise<ProblemReviewDetail["testCases"]> {
  return getDb()
    .select({
      input: testCases.input,
      expectedOutput: testCases.expectedOutput,
      isSample: testCases.isSample,
    })
    .from(testCases)
    .where(eq(testCases.problemId, problemId))
    .orderBy(asc(testCases.position));
}

async function loadTags(problemId: string): Promise<string[]> {
  const rows = await getDb()
    .select({ name: tags.name })
    .from(problemTags)
    .innerJoin(tags, eq(tags.id, problemTags.tagId))
    .where(eq(problemTags.problemId, problemId))
    .orderBy(asc(tags.name));
  return rows.map((row) => row.name);
}

export async function getProblemReviewForViewer(
  problemId: string,
  viewer: Viewer,
): Promise<ProblemReviewDetail> {
  const problem = await loadProblem(problemId);
  if (!problem) throw errors.notFound("Problem not found.");
  const isAuthor = isProblemAuthor(viewer.id, problem.authorId);
  if (
    problem.publicationStatus === "DRAFT" &&
    !isAuthor &&
    viewer.role !== "ADMIN"
  ) {
    throw errors.notFound("Problem not found.");
  }
  if (!isAuthor && !isStaffRole(viewer.role)) {
    throw errors.forbidden(
      "Only the author or a setter can open this review workspace.",
    );
  }

  const reviewerCountQuery = getDb()
    .select({ value: count() })
    .from(users)
    .where(
      and(
        inArray(users.role, ["TEACHER", "ADMIN"]),
        eq(users.isBanned, false),
        problem.authorId ? ne(users.id, problem.authorId) : undefined,
      ),
    );
  const [approvals, holds, tests, problemTagNames, reviewerRows] =
    await Promise.all([
      loadApprovalRows(getDb(), problemId, problem.reviewCycle),
      loadHoldRows(getDb(), problemId),
      loadTests(problemId),
      loadTags(problemId),
      reviewerCountQuery,
    ]);
  const eligibleReviewerCount = Number(reviewerRows[0]?.value ?? 0);
  if (
    problem.publicationStatus === "PUBLISHED" &&
    !isAuthor &&
    viewer.role !== "ADMIN" &&
    !approvals.some(
      (approval) =>
        approval.reviewerId === viewer.id && approval.status === "ACTIVE",
    )
  ) {
    throw errors.notFound("Problem not found.");
  }
  const blockingHolds = holds.filter((hold) => isBlockingHold(hold.status));
  const gates = evaluatePublicationGates({
    approvals,
    holds: blockingHolds,
    editorial: problem.editorial,
    reviewerTests: approvals
      .filter((approval) => approval.status === "ACTIVE")
      .reduce((total, approval) => total + approval.testsAdded, 0),
  });

  const myApprovalRow =
    approvals.find(
      (approval) =>
        approval.reviewerId === viewer.id && approval.status === "ACTIVE",
    ) ?? null;
  const myHoldRow =
    holds.find(
      (hold) => hold.reviewerId === viewer.id && isBlockingHold(hold.status),
    ) ?? null;
  const respondableHoldIds = holds
    .filter((hold) =>
      canRespondToHold({
        viewerId: viewer.id,
        viewerRole: viewer.role,
        authorId: problem.authorId,
        status: problem.publicationStatus,
        holdStatus: hold.status,
      }),
    )
    .map((hold) => hold.id);
  const resolvableHoldIds = holds
    .filter((hold) =>
      canResolveHold({
        viewerId: viewer.id,
        viewerRole: viewer.role,
        reviewerId: hold.reviewerId,
        holdStatus: hold.status,
      }),
    )
    .map((hold) => hold.id);
  const samples = tests.filter((test) => test.isSample).length;

  return {
    problemId: problem.id,
    slug: problem.slug,
    title: problem.title,
    statement: problem.statement,
    inputFormat: problem.inputFormat,
    outputFormat: problem.outputFormat,
    constraints: problem.constraints,
    editorial: problem.editorial,
    difficulty: problem.difficulty,
    points: problem.points,
    timeLimitMs: problem.timeLimitMs,
    memoryLimitMb: problem.memoryLimitMb,
    tags: problemTagNames,
    author: mapReviewUser(
      problem.authorId,
      problem.authorUsername,
      problem.authorDisplayName,
      problem.authorRole,
    ),
    publicationStatus: problem.publicationStatus,
    reviewCycle: problem.reviewCycle,
    publishedAt: problem.publishedAt?.toISOString() ?? null,
    createdAt: problem.createdAt.toISOString(),
    updatedAt: problem.updatedAt.toISOString(),
    testCases: tests,
    testCounts: {
      total: tests.length,
      samples,
      hidden: tests.length - samples,
    },
    eligibleReviewerCount,
    approvals: approvals.map(mapApproval),
    holds: holds.map(mapHold),
    gates,
    viewer: {
      isAuthor,
      isEligibleReviewer: isStaffRole(viewer.role) && !isAuthor,
      canSubmit: canSubmitProblemForReview({
        viewerId: viewer.id,
        viewerRole: viewer.role,
        authorId: problem.authorId,
        status: problem.publicationStatus,
      }),
      canReview: canReviewProblem({
        viewerId: viewer.id,
        viewerRole: viewer.role,
        authorId: problem.authorId,
        status: problem.publicationStatus,
        activeHoldCount: blockingHolds.length,
        approvedThisCycle: myApprovalRow !== null,
      }),
      canHold: canHoldProblem({
        viewerId: viewer.id,
        viewerRole: viewer.role,
        authorId: problem.authorId,
        status: problem.publicationStatus,
        hasActiveHoldByViewer: myHoldRow !== null,
      }),
      canPublish: canPublishProblem({
        viewerId: viewer.id,
        viewerRole: viewer.role,
        authorId: problem.authorId,
        status: problem.publicationStatus,
        gatesReady: gates.ready,
      }),
      canRespond: respondableHoldIds.length > 0,
      canRereview: canStartProblemRereview({
        viewerId: viewer.id,
        viewerRole: viewer.role,
        authorId: problem.authorId,
        status: problem.publicationStatus,
      }),
      myApproval: myApprovalRow ? mapApproval(myApprovalRow) : null,
      myHold: myHoldRow ? mapHold(myHoldRow) : null,
      resolvableHoldIds,
      reopenableHoldIds: resolvableHoldIds,
      respondableHoldIds,
    },
  };
}

export async function listProblemReviewInbox(
  viewer: Pick<SafeUser, "id" | "role">,
): Promise<ProblemReviewInbox> {
  const [queue, credits, queueCounts, creditCount] = await Promise.all([
    listProblemReviewQueue(viewer),
    listProblemReviewCredits(viewer.id),
    countProblemReviewQueue(viewer),
    countProblemReviewCredits(viewer.id),
  ]);
  return {
    reviewQueue: queue.reviewQueue,
    myReviews: queue.myReviews,
    held: queue.held,
    credits,
    counts: {
      ...queueCounts,
      credits: creditCount,
    },
  };
}
