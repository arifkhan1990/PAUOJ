import type { ContestProblemApprovalSummary } from "./contest-approval-types";
import type { ContestDivision } from "./types";

export type AdminContestListItem = {
  id: string;
  slug: string;
  title: string;
  startAt: string;
  endAt: string;
  isPublic: boolean;
  division: ContestDivision;
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
  startAt: string;
  endAt: string;
  isPublic: boolean;
  division: ContestDivision;
  freezeMinutes: number;
  problemIds: string[];
  problemApprovals: ContestProblemApprovalSummary[];
};
