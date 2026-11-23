import type { Difficulty } from "@/lib/difficulty";

export type LearningModuleStatus = "LIVE" | "PLANNED";

export type LearningCheckpointStatus =
  | "NOT_STARTED"
  | "ACTIVE"
  | "COMPLETED"
  | "EXPIRED";

export type LearningTopicDefinition = {
  slug: string;
  title: string;
  titleBn: string;
  summary: string;
  concept: string;
  guidedProblemSlugs: string[];
  practiceProblemSlugs: {
    easy: string[];
    medium: string[];
    hard: string[];
  };
  extraProblemSlugs: string[];
};

export type LearningCheckpointDefinition = {
  title: string;
  titleBn: string;
  description: string;
  durationMinutes: number;
  problemSlugs: string[];
  badge: {
    slug: string;
    name: string;
    description: string;
  };
};

export type LearningPracticeTier = "FULL" | "COMPACT";

export type LearningModuleDefinition = {
  slug: string;
  order: number;
  title: string;
  subtitle: string;
  goal: string;
  description: string;
  estimatedHours: number;
  status: LearningModuleStatus;
  diagram?: {
    src: string;
    alt: string;
  };
  practiceTier?: LearningPracticeTier;
  topics: LearningTopicDefinition[];
  checkpoint: LearningCheckpointDefinition | null;
};

export type LearningProblemView = {
  slug: string;
  title: string;
  difficulty: Difficulty;
  points: number;
  solved: boolean;
  attempted: boolean;
};

export type LearningProgress = {
  solved: number;
  total: number;
  percent: number;
};

export type LearningTopicView = {
  slug: string;
  title: string;
  titleBn: string;
  summary: string;
  concept: string;
  guided: LearningProblemView[];
  practice: {
    easy: LearningProblemView[];
    medium: LearningProblemView[];
    hard: LearningProblemView[];
  };
  extra: LearningProblemView[];
  progress: LearningProgress;
  locked: boolean;
  unlockHint: string | null;
  /** Premium module without an entitlement: render the paywall, not the lesson. */
  paywalled?: boolean;
};

export type LearningCheckpointView = {
  title: string;
  titleBn: string;
  description: string;
  durationMinutes: number;
  badge: LearningCheckpointDefinition["badge"];
  status: LearningCheckpointStatus;
  attempt: {
    startedAt: string;
    endsAt: string;
    completedAt: string | null;
  } | null;
  problems: LearningProblemView[];
  solvedCount: number;
  problemCount: number;
  earned: boolean;
};

export type LearningModuleSummary = {
  slug: string;
  order: number;
  title: string;
  subtitle: string;
  goal: string;
  status: LearningModuleStatus;
  estimatedHours: number;
  topicCount: number;
  problemCount: number;
  progress: LearningProgress;
  badgeEarned: boolean;
  locked: boolean;
  unlockHint: string | null;
  paywalled?: boolean;
};

export type LearningModuleView = Omit<LearningModuleSummary, "topicCount"> & {
  description: string;
  topics: LearningTopicView[];
  checkpoint: LearningCheckpointView | null;
};

export type LearningCheckpointStart = {
  moduleSlug: string;
  startedAt: string;
  endsAt: string;
  status: LearningCheckpointStatus;
};

export type LearningBadge = {
  moduleSlug: string;
  moduleOrder: number;
  moduleTitle: string;
  badgeSlug: string;
  badgeName: string;
  description: string;
  earned: boolean;
  earnedAt: string | null;
  href: string;
};
