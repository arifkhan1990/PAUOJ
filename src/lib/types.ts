import type { Difficulty } from "./difficulty";
export type { Difficulty } from "./difficulty";
import type { ProblemRatingSummary } from "./problem-extras-types";
import type { ContestProblemApprovalSummary } from "./contest-approval-types";
export type {
  ProblemRatingSummary,
  ProblemResourceItem,
  RelatedProblemItem,
} from "./problem-extras-types";
export type { RatingHistoryItem } from "./rating-types";
import type { Verdict } from "./verdicts";
export type {
  AdminStudyListDetail,
  AdminStudyListSummary,
  StudyListDetail,
  StudyListProblem,
  StudyListSummary,
} from "./study-list-types";

export type UserRole = "USER" | "TEACHER" | "ADMIN";

export type ProblemCheckerType = "EXACT" | "TOKEN" | "FLOAT" | "CUSTOM";

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

export type HeaderUser = Pick<
  SessionUser,
  "id" | "username" | "displayName" | "role"
> & { emailVerified: boolean };

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
  statement: string;
  inputFormat: string | null;
  outputFormat: string | null;
  constraints: string | null;
  editorial: string | null;
  editorialLocked: boolean;
  difficulty: Difficulty;
  points: number;
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
  contestContext: { id: string; slug: string; title: string; label: string } | null;
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
  startAt: string;
  endAt: string;
  status: ContestStatus;
  division: ContestDivision;
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
};

export * from "./clarification-types";

export type AssessmentPhase = "UPCOMING" | "RUNNING" | "ENDED";

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

export type AdminProblemListItem = {
  id: string;
  slug: string;
  title: string;
  difficulty: Difficulty;
  isPublic: boolean;
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
  tags: string[];
  tests: { input: string; expectedOutput: string; isSample: boolean }[];
  pendingContributions: number;
};

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
