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
  user: {
    username: string;
    displayName: string;
    avatarPreset?: string | null;
    avatarImageUpdatedAt?: string | null;
  };
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
  problemId: string;
  sourceCode: string | null;
  compileOutput: string | null;
  errorMessage: string | null;
  judgedAt: string | null;
  results: SubmissionTestResult[];
  canViewSource: boolean;
  /** True when the viewer authored this submission (note ownership). */
  isOwner: boolean;
  /** Private note by the submission owner; null for everyone else. */
  note: string | null;
};

/** One bucket of a metric distribution; `max` is exclusive, null on the last. */
export type SubmissionBucket = {
  min: number;
  max: number | null;
  count: number;
  /** Share of the sample, 0-100. */
  share: number;
  /** The analysed submission falls in this bucket. */
  current: boolean;
};

export type SubmissionMetricAnalysis = {
  value: number | null;
  /** Percentage of comparable accepted runs this one beats, 0-100. */
  beats: number | null;
  sampleSize: number;
  /** "language" matches the run's language; "all" is the fallback scope. */
  scope: "language" | "all";
  buckets: SubmissionBucket[];
  median: number | null;
  best: number | null;
};

/** Null unless the submission was accepted and enough comparable runs exist. */
export type SubmissionAnalysis = {
  runtime: SubmissionMetricAnalysis;
  memory: SubmissionMetricAnalysis;
};
