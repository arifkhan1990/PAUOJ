export const PROBLEM_CONTRIBUTION_KINDS = [
  "STATEMENT",
  "TESTS",
  "EDITORIAL",
] as const;

export type ProblemContributionKind =
  (typeof PROBLEM_CONTRIBUTION_KINDS)[number];

export const PROBLEM_CONTRIBUTION_STATUSES = [
  "PENDING",
  "APPROVED",
  "REJECTED",
  "WITHDRAWN",
] as const;

export type ProblemContributionStatus =
  (typeof PROBLEM_CONTRIBUTION_STATUSES)[number];

export type ContributionTest = {
  input: string;
  expectedOutput: string;
  isSample: boolean;
};

export type StatementContributionPayload = {
  statement: string;
  inputFormat: string | null;
  outputFormat: string | null;
  constraints: string | null;
};

export type TestsContributionPayload = {
  tests: ContributionTest[];
};

export type EditorialContributionPayload = {
  editorial: string;
};

export type ProblemContributionPayload =
  | StatementContributionPayload
  | TestsContributionPayload
  | EditorialContributionPayload;

export type ContributionUser = {
  username: string;
  displayName: string;
};

export type ProblemContributionItem = {
  id: string;
  problemId: string;
  problemSlug: string;
  problemTitle: string;
  kind: ProblemContributionKind;
  status: ProblemContributionStatus;
  note: string | null;
  payload: ProblemContributionPayload;
  contributor: ContributionUser | null;
  reviewer: ContributionUser | null;
  reviewNote: string | null;
  reviewedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export const CONTRIBUTION_KIND_LABELS: Record<ProblemContributionKind, string> = {
  STATEMENT: "Statement",
  TESTS: "Test cases",
  EDITORIAL: "Editorial",
};
