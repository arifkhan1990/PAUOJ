import type { ContestDivision } from "./types";

export type ContestFormat = "SINGLE" | "GROUP";

export type ContestStaffRole =
  | "DIRECTOR"
  | "SETTER"
  | "EDITORIAL"
  | "TESTER"
  | "OBSERVER";

export type ContestStaffStatus = "INVITED" | "ACCEPTED" | "DECLINED" | "REMOVED";

export type ContestCandidateStatus = "PROPOSED" | "SHORTLISTED" | "REJECTED";

export type ContestSponsorTier = "TITLE" | "GOLD" | "SILVER" | "COMMUNITY";

export type ContestSponsorStatus = "PENDING" | "APPROVED" | "REJECTED";

export type ContestHostRequestStatus =
  | "SUBMITTED"
  | "UNDER_REVIEW"
  | "APPROVED"
  | "REJECTED"
  | "CONVERTED";

export type ContestPaymentStatus = "PENDING" | "PAID" | "WAIVED" | "REFUNDED";

export type ContestTeamStatus =
  | "FORMING"
  | "REGISTERED"
  | "WITHDRAWN"
  | "DISQUALIFIED";

export type ContestIntegrityEventType =
  | "TAB_HIDDEN"
  | "PASTE"
  | "COPY"
  | "CONTEXT_MENU"
  | "PRINT"
  | "FULLSCREEN_EXIT"
  | "RAPID_SUBMIT";

export type ContestTeamInviteStatus =
  | "PENDING"
  | "ACCEPTED"
  | "DECLINED"
  | "CANCELLED";

export const CONTEST_FORMAT_LABEL: Record<ContestFormat, string> = {
  SINGLE: "Solo",
  GROUP: "Team",
};

export const CONTEST_FORMAT_DESCRIPTION: Record<ContestFormat, string> = {
  SINGLE: "One coder per entry, individual ICPC ranking.",
  GROUP: "Teams of 2–6 coders share one ranking and one problem set.",
};

export const CONTEST_STAFF_ROLE_LABEL: Record<ContestStaffRole, string> = {
  DIRECTOR: "Contest director",
  SETTER: "Problem setter",
  EDITORIAL: "Editorial writer",
  TESTER: "Test-case setter",
  OBSERVER: "Observer",
};

export const CONTEST_STAFF_ROLE_DESCRIPTION: Record<ContestStaffRole, string> = {
  DIRECTOR: "Owns the contest, schedule, shortlist and crew.",
  SETTER: "Proposes and finalises fresh contest problems.",
  EDITORIAL: "Writes the post-contest editorial while the round runs.",
  TESTER: "Validates tests and checker coverage before the round.",
  OBSERVER: "Read-only oversight; never competes in the contest.",
};

export const CONTEST_SPONSOR_TIER_LABEL: Record<ContestSponsorTier, string> = {
  TITLE: "Title sponsor",
  GOLD: "Gold sponsor",
  SILVER: "Silver sponsor",
  COMMUNITY: "Community partner",
};

export const CONTEST_SPONSOR_TIER_CLASS: Record<ContestSponsorTier, string> = {
  TITLE:
    "border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-100",
  GOLD:
    "border-yellow-300 bg-yellow-50 text-yellow-900 dark:border-yellow-700 dark:bg-yellow-950 dark:text-yellow-100",
  SILVER:
    "border-slate-300 bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200",
  COMMUNITY:
    "border-sky-300 bg-sky-50 text-sky-800 dark:border-sky-800 dark:bg-sky-950 dark:text-sky-200",
};

export const CONTEST_HOST_REQUEST_STATUS_LABEL: Record<
  ContestHostRequestStatus,
  string
> = {
  SUBMITTED: "Submitted",
  UNDER_REVIEW: "Under review",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  CONVERTED: "Scheduled",
};

export const CONTEST_PAYMENT_STATUS_LABEL: Record<ContestPaymentStatus, string> = {
  PENDING: "Payment pending",
  PAID: "Paid",
  WAIVED: "Fee waived",
  REFUNDED: "Refunded",
};

export const CONTEST_INTEGRITY_EVENT_LABEL: Record<
  ContestIntegrityEventType,
  string
> = {
  TAB_HIDDEN: "Left the contest tab",
  PASTE: "Pasted into the editor",
  COPY: "Copied contest text",
  CONTEXT_MENU: "Opened the context menu",
  PRINT: "Tried to print",
  FULLSCREEN_EXIT: "Left fullscreen",
  RAPID_SUBMIT: "Submitted rapidly",
};

export const CONTEST_STAFF_ROLES: ContestStaffRole[] = [
  "DIRECTOR",
  "SETTER",
  "EDITORIAL",
  "TESTER",
  "OBSERVER",
];

export const CONTEST_SPONSOR_TIERS: ContestSponsorTier[] = [
  "TITLE",
  "GOLD",
  "SILVER",
  "COMMUNITY",
];

export const CONTEST_HOSTING_FEES = [3000, 3500, 4000, 4500, 5000] as const;

export type ContestHostingFee = (typeof CONTEST_HOSTING_FEES)[number];

export const CONTEST_HOSTING_FEE_MIN = 3000;
export const CONTEST_HOSTING_FEE_MAX = 5000;
export const CONTEST_TEAM_MIN_SIZE = 2;
export const CONTEST_TEAM_MAX_SIZE = 6;
export const CONTEST_EDITORIAL_LOCK_MESSAGE =
  "Editorials stay sealed while the contest is running. They unlock after the round ends.";

export const CONTEST_HOST_DATA_CHECKLIST = [
  "Title, slug and a public description",
  "Solo or team format and the team size",
  "Division, start time and end time",
  "Fresh problem set owned by the contest",
  "Problem setter, editorial and tester crew",
  "Sponsor or prize information (optional)",
  "Registration rules and eligibility",
  "Payment reference for the arrangement fee",
] as const;

export type ContestSponsorBadge = {
  id: string;
  name: string;
  tier: ContestSponsorTier;
  websiteUrl: string | null;
  logoUrl: string | null;
  message: string | null;
};

export type ContestTeamMemberView = {
  userId: string;
  username: string;
  displayName: string;
  role: "CAPTAIN" | "MEMBER";
  joinedAt: string;
};

export type ContestTeamInviteView = {
  id: string;
  contestId: string;
  teamId: string;
  teamName: string;
  status: ContestTeamInviteStatus;
  invitedBy: { userId: string; username: string; displayName: string };
  invitedUser: { userId: string; username: string; displayName: string };
  createdAt: string;
  respondedAt: string | null;
};

export type ContestTeamView = {
  id: string;
  name: string;
  captainId: string;
  status: ContestTeamStatus;
  maxMembers: number;
  inviteCode: string | null;
  members: ContestTeamMemberView[];
  pendingInvites: ContestTeamInviteView[];
  isViewerCaptain: boolean;
  isViewerMember: boolean;
};

export type ContestStaffView = {
  id: string;
  userId: string;
  username: string;
  displayName: string;
  role: ContestStaffRole;
  status: ContestStaffStatus;
  createdAt: string;
};

export type ContestStaffNoteView = {
  id: string;
  body: string;
  problemId: string | null;
  problemTitle: string | null;
  createdAt: string;
  author: { username: string; displayName: string };
};

export type ContestProblemCandidateView = {
  id: string;
  problemId: string;
  title: string;
  slug: string;
  difficulty: string;
  status: ContestCandidateStatus;
  note: string | null;
  createdAt: string;
  proposedBy: { username: string; displayName: string } | null;
};

export type ContestHostRequestView = {
  id: string;
  title: string;
  description: string;
  bannerUrl: string | null;
  format: ContestFormat;
  division: ContestDivision;
  startAt: string;
  endAt: string;
  teamSize: number;
  expectedParticipants: number;
  sponsorNote: string | null;
  contactEmail: string;
  contactPhone: string | null;
  feeBdt: number;
  paymentStatus: ContestPaymentStatus;
  paymentReference: string | null;
  status: ContestHostRequestStatus;
  adminNote: string | null;
  contest: { id: string; slug: string; title: string } | null;
  requestedBy: { username: string; displayName: string };
  createdAt: string;
  reviewedAt: string | null;
};

export type ContestSeriesView = {
  id: string;
  key: string;
  title: string;
  description: string;
  format: ContestFormat;
  division: ContestDivision;
  cadence: "MONTHLY_THIRD_SUNDAY";
  timezone: string;
  weekOfMonth: number;
  weekday: number;
  hour: number;
  minute: number;
  durationMinutes: number;
  teamSize: number;
  isActive: boolean;
  nextRunAt: string | null;
  lastRunAt: string | null;
};

export type ContestIntegrityEventView = {
  id: string;
  type: ContestIntegrityEventType;
  detail: string | null;
  createdAt: string;
  user: { username: string; displayName: string };
  problem: { title: string } | null;
};

export type ContestIntegritySummary = {
  events: ContestIntegrityEventView[];
  totals: Record<ContestIntegrityEventType, number>;
  flaggedUsers: {
    userId: string;
    username: string;
    displayName: string;
    events: number;
    lastEventAt: string;
  }[];
};

export type ContestOperationsDetail = {
  contest: {
    id: string;
    slug: string;
    title: string;
    format: ContestFormat;
    teamSize: number;
    startAt: string;
    endAt: string;
    isOfficial: boolean;
    feeStatus: ContestPaymentStatus | "NOT_REQUIRED";
    feeBdt: number | null;
    requiresFreshProblems: boolean;
    seriesId: string | null;
  };
  staff: ContestStaffView[];
  notes: ContestStaffNoteView[];
  candidates: ContestProblemCandidateView[];
  sponsors: {
    id: string;
    name: string;
    tier: ContestSponsorTier;
    status: ContestSponsorStatus;
    amountBdt: number | null;
    websiteUrl: string | null;
    reviewedAt: string | null;
  }[];
  integrity: ContestIntegritySummary;
};

export function isContestStaffRole(value: string): value is ContestStaffRole {
  return (CONTEST_STAFF_ROLES as string[]).includes(value);
}

export function contestTeamPath(slug: string): string {
  return `/contests/${slug}`;
}

export function contestSponsorPath(slug: string): string {
  return `/contests/${slug}/sponsor`;
}

export function contestHostPath(): string {
  return "/contests/host";
}

export function adminContestOperationsPath(id: string): string {
  return `/admin/contests/${id}/operations`;
}

export function publicSponsorBadges(
  sponsors: ContestSponsorBadge[],
): ContestSponsorBadge[] {
  const rank: Record<ContestSponsorTier, number> = {
    TITLE: 0,
    GOLD: 1,
    SILVER: 2,
    COMMUNITY: 3,
  };
  return [...sponsors].sort((left, right) => rank[left.tier] - rank[right.tier]);
}
