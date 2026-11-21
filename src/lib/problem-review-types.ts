import type { Difficulty } from "./difficulty";

export const PROBLEM_PUBLICATION_STATUSES = [
  "DRAFT",
  "IN_REVIEW",
  "CHANGES_REQUESTED",
  "PUBLISHED",
] as const;

export type ProblemPublicationStatus =
  (typeof PROBLEM_PUBLICATION_STATUSES)[number];

export const REQUIRED_PUBLICATION_APPROVALS = 2;

export const PUBLICATION_STATUS_LABELS: Record<
  ProblemPublicationStatus,
  string
> = {
  DRAFT: "Draft",
  IN_REVIEW: "In review",
  CHANGES_REQUESTED: "Changes requested",
  PUBLISHED: "Published",
};

export type ProblemReviewUser = {
  id: string;
  username: string;
  displayName: string;
  role: "USER" | "TEACHER" | "ADMIN";
};

export type ProblemReviewApprovalStatus = "ACTIVE" | "SUPERSEDED";

export type ProblemReviewApprovalItem = {
  id: string;
  reviewer: ProblemReviewUser | null;
  status: ProblemReviewApprovalStatus;
  note: string | null;
  solutionLanguage: string;
  solutionSource: string;
  testsAdded: number;
  editorialProvided: boolean;
  createdAt: string;
};

export type ProblemReviewHoldStatus = "OPEN" | "ADDRESSED" | "RESOLVED";

export type ProblemReviewHoldItem = {
  id: string;
  reviewer: ProblemReviewUser | null;
  status: ProblemReviewHoldStatus;
  note: string;
  authorResponse: string | null;
  respondedAt: string | null;
  resolutionNote: string | null;
  resolver: ProblemReviewUser | null;
  resolvedAt: string | null;
  reopenNote: string | null;
  reopenedAt: string | null;
  createdAt: string;
};

export type ProblemReviewGates = {
  approvalCount: number;
  requiredApprovals: number;
  editorialReady: boolean;
  reviewerTestsReady: boolean;
  solutionReady: boolean;
  holdsClear: boolean;
  ready: boolean;
  missing: string[];
};

export type ProblemReviewTestCase = {
  input: string;
  expectedOutput: string;
  isSample: boolean;
};

export type ProblemReviewViewerState = {
  isAuthor: boolean;
  isEligibleReviewer: boolean;
  canSubmit: boolean;
  canReview: boolean;
  canHold: boolean;
  canPublish: boolean;
  canRespond: boolean;
  canRereview: boolean;
  myApproval: ProblemReviewApprovalItem | null;
  myHold: ProblemReviewHoldItem | null;
  resolvableHoldIds: string[];
  reopenableHoldIds: string[];
  respondableHoldIds: string[];
};

export type ProblemReviewDetail = {
  problemId: string;
  slug: string;
  title: string;
  statement: string;
  inputFormat: string | null;
  outputFormat: string | null;
  constraints: string | null;
  editorial: string | null;
  difficulty: Difficulty;
  points: number;
  timeLimitMs: number;
  memoryLimitMb: number;
  tags: string[];
  author: ProblemReviewUser | null;
  publicationStatus: ProblemPublicationStatus;
  reviewCycle: number;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  testCases: ProblemReviewTestCase[];
  testCounts: { total: number; samples: number; hidden: number };
  eligibleReviewerCount: number;
  approvals: ProblemReviewApprovalItem[];
  holds: ProblemReviewHoldItem[];
  gates: ProblemReviewGates;
  viewer: ProblemReviewViewerState;
};

export type ProblemReviewQueueItem = {
  problemId: string;
  slug: string;
  title: string;
  difficulty: Difficulty;
  author: ProblemReviewUser | null;
  publicationStatus: ProblemPublicationStatus;
  reviewCycle: number;
  approvalCount: number;
  requiredApprovals: number;
  openHoldCount: number;
  addressedHoldCount: number;
  approvedByMe: boolean;
  heldByMe: boolean;
  publishedAt: string | null;
  updatedAt: string;
};

export type ProblemReviewCredit = {
  problemId: string;
  slug: string;
  title: string;
  publishedAt: string;
  solutionLanguage: string;
  testsAdded: number;
  editorialProvided: boolean;
};

export type ProblemReviewInbox = {
  reviewQueue: ProblemReviewQueueItem[];
  myReviews: ProblemReviewQueueItem[];
  held: ProblemReviewQueueItem[];
  credits: ProblemReviewCredit[];
  counts: {
    reviewQueue: number;
    myReviews: number;
    held: number;
    credits: number;
  };
};

export type ProblemReviewActionResult = {
  review: ProblemReviewDetail;
  published: boolean;
  reopened: boolean;
};
