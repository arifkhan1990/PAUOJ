import type { Verdict } from "./verdicts";

export type SubmissionListItem = {
  id: string;
  status: Verdict;
  language: string;
  createdAt: string;
  runtimeMs: number | null;
  memoryKb: number | null;
  passedTests: number;
  totalTests: number;
  problem: { slug: string; title: string };
  user: { username: string; displayName: string };
  contestSlug: string | null;
  assessmentSlug: string | null;
};

export type SubmissionTestResult = {
  position: number;
  status: Verdict;
  runtimeMs: number | null;
  memoryKb: number | null;
  message: string | null;
};

export type SubmissionDetail = SubmissionListItem & {
  sourceCode: string | null;
  compileOutput: string | null;
  errorMessage: string | null;
  judgedAt: string | null;
  results: SubmissionTestResult[];
  canViewSource: boolean;
};
