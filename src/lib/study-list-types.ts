import type { Difficulty } from "./difficulty";

export type StudyListLevel = "BEGINNER" | "INTERMEDIATE" | "ADVANCED";

export type StudyDifficultyCounts = Record<Difficulty, number>;

export type StudyListProblem = {
  slug: string;
  title: string;
  difficulty: Difficulty;
  points: number;
  /** Global order inside the plan (1-based). */
  position: number;
  sectionId: string | null;
  sectionTitle: string | null;
  solved: boolean;
  attempted: boolean;
  /** The viewer's private note for this problem in this plan. */
  note: string | null;
};

export type StudyListSectionView = {
  /** Null only for legacy items that were created before sections existed. */
  id: string | null;
  title: string;
  description: string;
  position: number;
  problemCount: number;
  solvedCount: number;
  problems: StudyListProblem[];
};

export type StudyListNextProblem = {
  slug: string;
  title: string;
  difficulty: Difficulty;
  position: number;
  sectionTitle: string | null;
};

export type StudyListSummary = {
  id: string;
  slug: string;
  title: string;
  description: string;
  level: StudyListLevel;
  isFeatured: boolean;
  /** Admin estimate in minutes; null means the estimate is derived. */
  estimatedMinutes: number | null;
  /** Effective duration: the admin estimate or the difficulty-based fallback. */
  durationMinutes: number;
  problemCount: number;
  solvedCount: number;
  attemptedCount: number;
  progressPercent: number;
  sectionCount: number;
  difficultyCounts: StudyDifficultyCounts;
  /** Most frequent problem tags, capped for display. */
  topics: string[];
  enrolled: boolean;
  completed: boolean;
  nextProblem: StudyListNextProblem | null;
  /** False for owner-only plans created from `/lists/new`. */
  isPublic: boolean;
  /** True when the viewer created this plan. */
  isOwned: boolean;
};

export type StudyListDetail = StudyListSummary & {
  sections: StudyListSectionView[];
  /** Enrollment start, null when the viewer has not enrolled. */
  startedAt: string | null;
  updatedAt: string;
};

export type AdminStudyListSection = {
  /** Null only for legacy items grouped under the implicit "General" section. */
  id: string | null;
  title: string;
  description: string;
  problemIds: string[];
};

export type AdminStudyListSummary = {
  id: string;
  slug: string;
  title: string;
  isPublic: boolean;
  level: StudyListLevel;
  isFeatured: boolean;
  problemCount: number;
  sectionCount: number;
  estimatedMinutes: number | null;
  durationMinutes: number;
  updatedAt: string;
};

export type AdminStudyListDetail = {
  id: string;
  slug: string;
  title: string;
  description: string;
  isPublic: boolean;
  level: StudyListLevel;
  estimatedMinutes: number | null;
  isFeatured: boolean;
  sections: AdminStudyListSection[];
};
