import type { Difficulty } from "./difficulty";
import type { ProblemPublicationStatus } from "./problem-review-types";

export type ProblemCheckerType = "EXACT" | "TOKEN" | "FLOAT" | "CUSTOM";

export type AdminProblemListItem = {
  id: string;
  slug: string;
  title: string;
  difficulty: Difficulty;
  isPublic: boolean;
  publicationStatus: ProblemPublicationStatus;
  reviewCycle: number;
  approvalCount: number;
  openHoldCount: number;
  publishedAt: string | null;
  submissionCount: number;
  testCount: number;
  pendingContributions: number;
  updatedAt: string;
};

export type AdminProblemDetail = {
  id: string;
  slug: string;
  title: string;
  statement: string;
  inputFormat: string | null;
  outputFormat: string | null;
  constraints: string | null;
  editorial: string | null;
  category: string | null;
  subcategory: string | null;
  companies: string[];
  checkerType: ProblemCheckerType;
  checkerSource: string | null;
  floatTolerance: number;
  difficulty: Difficulty;
  points: number;
  timeLimitMs: number;
  memoryLimitMb: number;
  isPublic: boolean;
  publicationStatus: ProblemPublicationStatus;
  reviewCycle: number;
  publishedAt: string | null;
  tags: string[];
  tests: { input: string; expectedOutput: string; isSample: boolean }[];
  pendingContributions: number;
};
