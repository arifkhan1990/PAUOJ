export const CONTEST_PROBLEM_APPROVAL_STATUSES = [
  "PENDING",
  "APPROVED",
  "REJECTED",
] as const;

export type ContestProblemApprovalStatus =
  (typeof CONTEST_PROBLEM_APPROVAL_STATUSES)[number];

export type ContestProblemApprovalItem = {
  id: string;
  contestId: string;
  contestSlug: string;
  contestTitle: string;
  contestStartAt: string;
  problemId: string;
  problemSlug: string;
  problemTitle: string;
  status: ContestProblemApprovalStatus;
  reviewNote: string | null;
  requester: { username: string; displayName: string } | null;
  reviewer: { username: string; displayName: string } | null;
  reviewedAt: string | null;
  createdAt: string;
};

export type ContestProblemApprovalSummary = {
  problemId: string;
  problemTitle: string;
  status: ContestProblemApprovalStatus;
  reviewNote: string | null;
};
