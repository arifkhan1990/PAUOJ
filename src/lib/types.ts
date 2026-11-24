import type { Difficulty } from "./difficulty";
export type { Difficulty } from "./difficulty";
import type { ProblemRatingSummary } from "./problem-extras-types";
import type {
  ContestFormat,
  ContestSponsorBadge,
  ContestStaffRole,
  ContestStaffStatus,
  ContestTeamInviteView,
  ContestTeamView,
} from "./contest-ops";
export type {
  ProblemRatingSummary,
  ProblemResourceItem,
  RelatedProblemItem,
} from "./problem-extras-types";
export type { RatingHistoryItem } from "./rating-types";
import type { Verdict } from "./verdicts";
export type {
  AdminStudyListDetail,
  AdminStudyListSection,
  AdminStudyListSummary,
  StudyDifficultyCounts,
  StudyListDetail,
  StudyListLevel,
  StudyListNextProblem,
  StudyListProblem,
  StudyListSectionView,
  StudyListSummary,
} from "./study-list-types";

export type UserRole = "USER" | "TEACHER" | "ADMIN";

export type {
  AdminProblemDetail,
  AdminProblemListItem,
  ProblemCheckerType,
} from "./admin-problem-types";
export type {
  AdminContestDetail,
  AdminContestListItem,
} from "./admin-contest-types";

export type SessionUser = {
  id: string;
  username: string;
  email: string;
  displayName: string;
  role: UserRole;
  rating: number;
  emailVerifiedAt: string | null;
  createdAt: string;
};

export type HeaderUser = Pick<SessionUser, "id" | "username" | "displayName" | "role"> & { emailVerified: boolean };

export type ProblemTag = {
  name: string;
  slug: string;
};

export type ProblemListItem = {
  id: string;
  slug: string;
  title: string;
  difficulty: Difficulty;
  points: number;
  acceptedCount: number;
  submissionCount: number;
  tags: ProblemTag[];
  solvedByMe: boolean;
  attemptedByMe: boolean;
};

export type SampleTest = {
  id: string;
  input: string;
  output: string;
};

export type ProblemDetail = {
  id: string;
  slug: string;
  title: string;
  isPublic: boolean;
  statement: string;
  inputFormat: string | null;
  outputFormat: string | null;
  constraints: string | null;
  editorial: string | null;
  editorialLocked: boolean;
  difficulty: Difficulty;
  points: number;
  judgeLanguage: string | null;
  premiumModuleSlug: string | null;
  timeLimitMs: number;
  memoryLimitMb: number;
  authorId: string | null;
  author: { username: string; displayName: string } | null;
  editorialCredit: { username: string; displayName: string } | null;
  acceptedCount: number;
  submissionCount: number;
  tags: ProblemTag[];
  samples: SampleTest[];
  rating: ProblemRatingSummary;
  solvedByMe: boolean;
  attemptedByMe: boolean;
  contestContext: {
    id: string;
    slug: string;
    title: string;
    label: string;
    endAt: string;
    status: ContestStatus;
    integrityWatermark: string | null;
    editorialLocked: boolean;
  } | null;
  assessmentContext: {
    id: string;
    slug: string;
    title: string;
    label: string;
    expiresAt: string;
  } | null;
};

export type ProblemVerdictCount = {
  status: Verdict;
  count: number;
};

export type ProblemLanguageCount = {
  language: string;
  count: number;
};

export type ProblemStatistics = {
  submissionCount: number;
  acceptedCount: number;
  successRate: number;
  byVerdict: ProblemVerdictCount[];
  byLanguage: ProblemLanguageCount[];
};

export type ProblemSolver = {
  rank: number;
  username: string;
  displayName: string;
  attempts: number;
  solvedAt: string;
  language: string;
  runtimeMs: number | null;
};

export type ProblemRankboard = {
  totalSolvers: number;
  solvers: ProblemSolver[];
};

export * from "./comment-types";

export type {
  SubmissionDetail,
  SubmissionListItem,
  SubmissionTestResult,
} from "./submission-types";

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
};

export * from "./clarification-types";

export type AssessmentPhase = "UPCOMING" | "RUNNING" | "ENDED";

export type { AssessmentClaimAssurance, AssessmentInviteDetail, AssessmentInviteStatus, AssessmentInviteSummary } from "./assessment-invites";

export type AssessmentParticipantStatus = "ACTIVE" | "FINISHED" | "EXPIRED";

export type AssessmentProblemItem = {
  label: string;
  slug: string;
  title: string;
  difficulty: Difficulty;
  points: number;
  solvedByMe: boolean;
  attemptedByMe: boolean;
};

export type AssessmentParticipantInfo = {
  status: AssessmentParticipantStatus;
  startedAt: string;
  expiresAt: string;
  finishedAt: string | null;
};

export type AssessmentDetail = {
  id: string;
  slug: string;
  title: string;
  description: string;
  accessCode: string | null;
  startAt: string;
  endAt: string;
  durationMinutes: number | null;
  phase: AssessmentPhase;
  joinMode: "OPEN_CODE" | "INVITE";
  isPublished: boolean;
  participantCount: number;
  problemCount: number;
  participant: AssessmentParticipantInfo | null;
  canJoin: boolean;
  canFinish: boolean;
  isAdminPreview: boolean;
  problems: AssessmentProblemItem[];
  mySolved: number;
  myPoints: number;
};

export type AdminAssessmentListItem = {
  id: string;
  slug: string;
  title: string;
  accessCode: string;
  startAt: string;
  endAt: string;
  durationMinutes: number | null;
  isPublished: boolean;
  participantCount: number;
  problemCount: number;
};

export type AdminAssessmentDetail = {
  id: string;
  slug: string;
  title: string;
  description: string;
  accessCode: string;
  startAt: string;
  endAt: string;
  durationMinutes: number | null;
  joinMode: "OPEN_CODE" | "INVITE";
  isPublished: boolean;
  problemIds: string[];
};

export type AssessmentResultCell = {
  solved: boolean;
  attempts: number;
};

export type AssessmentResultRow = {
  rank: number;
  user: { username: string; displayName: string };
  status: AssessmentParticipantStatus;
  startedAt: string;
  expiresAt: string;
  finishedAt: string | null;
  solved: number;
  points: number;
  submissions: number;
  problems: Record<string, AssessmentResultCell>;
};

export type AssessmentResults = {
  assessment: {
    id: string;
    slug: string;
    title: string;
    accessCode: string;
    startAt: string;
    endAt: string;
  };
  labels: string[];
  rows: AssessmentResultRow[];
};

export type ScoreboardCell = {
  solved: boolean;
  attempts: number;
  solveTimeMinutes: number | null;
  firstBlood: boolean;
};

export type ScoreboardRow = {
  rank: number;
  user: { username: string; displayName: string };
  team: {
    id: string;
    name: string;
    memberCount: number;
    members: { username: string; displayName: string }[];
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
  };
  frozen: boolean;
  freezeAt: string | null;
  labels: string[];
  rows: ScoreboardRow[];
};

export type RunResult = {
  id: string;
  status: Verdict;
  stdout: string;
  stderr: string;
  compileOutput: string;
  runtimeMs: number | null;
  memoryKb: number | null;
  finished: boolean;
};

export type RankRow = {
  rank: number;
  username: string;
  displayName: string;
  institution: string | null;
  country: string | null;
  points: number;
  solvedCount: number;
  submissionCount: number;
  acceptanceRate: number;
  lastAcceptedAt: string | null;
};

export type HeatmapDay = {
  date: string;
  total: number;
  accepted: number;
};

export type { ProfileStats } from "./profile-types";

export type { SiteStats } from "./stats-types";

export type AdminUserListItem = {
  id: string;
  username: string;
  displayName: string;
  email: string;
  role: UserRole;
  isBanned: boolean;
  rating: number;
  createdAt: string;
};

export type Paginated<T> = {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

export type ApiMeta = {
  page?: number;
  pageSize?: number;
  total?: number;
  totalPages?: number;
};

export type ProblemOption = {
  id: string;
  title: string;
  slug: string;
  difficulty: Difficulty;
};
