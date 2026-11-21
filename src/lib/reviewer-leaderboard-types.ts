import type { UserRole } from "./types";

export type ReviewerLeaderboardRange = "7" | "30" | "all";

export type ReviewerLeaderboardRow = {
  userId: string;
  username: string;
  displayName: string;
  role: UserRole;
  /** approved + rejected */
  decisions: number;
  approved: number;
  rejected: number;
  /** 0..100, one decimal */
  approvalRate: number;
  /** one decimal */
  averageReviewHours: number | null;
  /** ISO */
  lastReviewedAt: string | null;
};

export type ReviewerLeaderboard = {
  range: ReviewerLeaderboardRange;
  rows: ReviewerLeaderboardRow[];
  totalDecisions: number;
  totalReviewers: number;
  averageReviewHours: number | null;
};

const DAY_MS = 86_400_000;

export function parseReviewerRange(
  value: string | undefined,
): ReviewerLeaderboardRange {
  return value === "7" || value === "30" ? value : "all";
}

export function reviewerRangeStart(
  range: ReviewerLeaderboardRange,
  now: Date = new Date(),
): Date | null {
  if (range === "all") return null;
  return new Date(now.getTime() - Number(range) * DAY_MS);
}
