import type { Difficulty } from "./difficulty";
import type {
  ContestFormat,
  ContestSponsorBadge,
  ContestStaffRole,
  ContestStaffStatus,
  ContestTeamInviteView,
  ContestTeamView,
} from "./contest-ops";

export type ContestStatus = "UPCOMING" | "RUNNING" | "ENDED";

export type ContestDivision = "OPEN" | "DIV1" | "DIV2" | "DIV3" | "DIV4";

export type ContestListItem = {
  id: string;
  slug: string;
  title: string;
  description: string;
  bannerUrl: string | null;
  startAt: string;
  endAt: string;
  status: ContestStatus;
  division: ContestDivision;
  format: ContestFormat;
  teamSize: number;
  isOfficial: boolean;
  seriesId: string | null;
  feeStatus: "NOT_REQUIRED" | "PENDING" | "PAID" | "WAIVED" | "REFUNDED";
  sponsor: ContestSponsorBadge | null;
  freezeMinutes: number;
  participantCount: number;
  problemCount: number;
  registered: boolean;
};

export type ContestProblemItem = {
  label: string;
  slug: string;
  title: string;
  difficulty: Difficulty;
  points: number;
  solvedByMe: boolean;
  attemptedByMe: boolean;
};

/** Full contest page payload, including the rating review/finalisation state. */
export type ContestDetail = ContestListItem & {
  problems: ContestProblemItem[];
  canRegister: boolean;
  registrationCount: number;
  teamCount: number;
  sponsors: ContestSponsorBadge[];
  viewerTeam: ContestTeamView | null;
  incomingTeamInvite: ContestTeamInviteView | null;
  canCreateTeam: boolean;
  canJoinTeam: boolean;
  eligibility: string | null;
  rules: string | null;
  prizes: string | null;
  editorialLocked: boolean;
  integrityWatermark: string | null;
  viewerStaffRole: ContestStaffRole | null;
  viewerStaffStatus: ContestStaffStatus | null;
  /** When ratings were finalised, or null while the review window is open. */
  ratingFinalizedAt: string | null;
  /** endAt + 1 hour: the moment rating finalisation becomes eligible. */
  ratingReviewEndsAt: string;
};

export type ScoreboardCell = {
  solved: boolean;
  attempts: number;
  solveTimeMinutes: number | null;
  firstBlood: boolean;
};

export type ScoreboardRow = {
  rank: number;
  user: {
    username: string;
    displayName: string;
    avatarPreset?: string | null;
    avatarImageUpdatedAt?: string | null;
  };
  team: {
    id: string;
    name: string;
    memberCount: number;
    members: {
      username: string;
      displayName: string;
      avatarPreset?: string | null;
      avatarImageUpdatedAt?: string | null;
    }[];
  } | null;
  solved: number;
  penalty: number;
  problems: Record<string, ScoreboardCell>;
};

export type VirtualContestInfo = {
  id: string;
  contestSlug: string;
  contestTitle: string;
  startedAt: string;
  endsAt: string;
  finishedAt: string | null;
  problems: ContestProblemItem[];
  solved: number;
  penalty: number;
};

export type ContestScoreboardPagination = {
  /** 1-based page that was actually served (clamped into range). */
  page: number;
  pageSize: number;
  /** Total ranked rows before slicing. */
  total: number;
  totalPages: number;
};

export type ContestScoreboard = {
  contest: {
    slug: string;
    title: string;
    startAt: string;
    endAt: string;
    status: ContestStatus;
    freezeMinutes: number;
    format: ContestFormat;
    teamSize: number;
    /** When ratings were finalised, or null while the review window is open. */
    ratingFinalizedAt: string | null;
    /** endAt + 1 hour: the moment rating finalisation becomes eligible. */
    ratingReviewEndsAt: string;
  };
  frozen: boolean;
  freezeAt: string | null;
  labels: string[];
  /** When this board snapshot was computed (cache-friendly). */
  generatedAt: string;
  pagination: ContestScoreboardPagination;
  /** Only the requested page of ranked rows. */
  rows: ScoreboardRow[];
};

/** 50 keeps the live payload and SSR/RSC work small at 10k participants. */
export const SCOREBOARD_DEFAULT_PAGE_SIZE = 50;
export const SCOREBOARD_MAX_PAGE_SIZE = 200;
