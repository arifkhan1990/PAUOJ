import type { Difficulty } from "./difficulty";
import type { RatingBucket } from "./rating-distribution";
import type { RatingHistoryItem } from "./rating-types";
import type {
  HeatmapDay,
  SubmissionListItem,
  UserRole,
} from "./types";
import type { LearningBadge } from "./learning/types";
import type { Verdict } from "./verdicts";

export type ProfileLanguageStat = {
  language: string;
  submissions: number;
  accepted: number;
  acceptanceRate: number;
};

export type ProfileProblemItem = {
  slug: string;
  title: string;
  difficulty: "EASY" | "MEDIUM" | "HARD" | "EXPERT";
  points: number;
  attempts: number;
  lastActivityAt: string;
};

export type ProfileHardestProblem = {
  points: number;
  difficulty: Difficulty;
};

export type ProfileTagStat = {
  slug: string;
  name: string;
  solved: number;
  attempted: number;
  total: number;
};

export type AchievementTone =
  | "emerald"
  | "amber"
  | "rose"
  | "sky"
  | "teal"
  | "orange";

export type AchievementIcon =
  | "check"
  | "target"
  | "crosshair"
  | "crown"
  | "send"
  | "flag"
  | "gauge"
  | "trending"
  | "trophy"
  | "flame"
  | "languages";

export type Achievement = {
  id: string;
  label: string;
  description: string;
  earned: boolean;
  value: number;
  target: number;
  icon: AchievementIcon;
  tone: AchievementTone;
};

export type ProfileStats = {
  user: {
    username: string;
    displayName: string;
    role: UserRole;
    bio: string | null;
    country: string | null;
    institution: string | null;
    rating: number;
    createdAt: string;
    isSelf: boolean;
  };
  solvedCount: number;
  submissionCount: number;
  acceptedCount: number;
  acceptanceRate: number;
  points: number;
  rank: number | null;
  ratingRank: number | null;
  ratedUserCount: number;
  ratingDistribution: RatingBucket[];
  currentStreak: number;
  longestStreak: number;
  activeDays: number;
  contestCount: number;
  ratingHistory: RatingHistoryItem[];
  languageStats: ProfileLanguageStat[];
  tagStats: ProfileTagStat[];
  verdictStats: { status: Verdict; count: number }[];
  solvedProblems: ProfileProblemItem[];
  unsolvedProblems: ProfileProblemItem[];
  attemptedCount: number;
  hardestTried: ProfileHardestProblem | null;
  hardestSolved: ProfileHardestProblem | null;
  problemSettingCount: number;
  contestCreateCount: number;
  approvedEditorialCount: number;
  approvedEditorials: {
    problemSlug: string;
    problemTitle: string;
    approvedAt: string;
  }[];
  achievements: Achievement[];
  learningBadges: LearningBadge[];
  difficultySolved: Record<Difficulty, number>;
  difficultyTotals: Record<Difficulty, number>;
  heatmap: HeatmapDay[];
  recentSubmissions: SubmissionListItem[];
};
