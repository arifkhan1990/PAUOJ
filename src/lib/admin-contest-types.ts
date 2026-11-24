import type { ContestProblemApprovalSummary } from "./contest-approval-types";
import type { ContestFormat } from "./contest-ops";
import type { ContestDivision } from "./types";

export type AdminContestListItem = {
  id: string;
  slug: string;
  title: string;
  startAt: string;
  endAt: string;
  isPublic: boolean;
  division: ContestDivision;
  format: ContestFormat;
  teamSize: number;
  isOfficial: boolean;
  feeStatus: "NOT_REQUIRED" | "PENDING" | "PAID" | "WAIVED" | "REFUNDED";
  freezeMinutes: number;
  problemCount: number;
  participantCount: number;
  pendingApprovals: number;
};

export type AdminContestDetail = {
  id: string;
  slug: string;
  title: string;
  description: string;
  bannerUrl: string | null;
  startAt: string;
  endAt: string;
  isPublic: boolean;
  division: ContestDivision;
  format: ContestFormat;
  teamSize: number;
  isOfficial: boolean;
  feeStatus: "NOT_REQUIRED" | "PENDING" | "PAID" | "WAIVED" | "REFUNDED";
  feeBdt: number | null;
  feeReference: string | null;
  requiresFreshProblems: boolean;
  eligibility: string | null;
  rules: string | null;
  prizes: string | null;
  seriesId: string | null;
  freezeMinutes: number;
  problemIds: string[];
  problemApprovals: ContestProblemApprovalSummary[];
};
