import type { Difficulty } from "./difficulty";

export type StudyListSummary = {
  id: string;
  slug: string;
  title: string;
  description: string;
  isPublic: boolean;
  problemCount: number;
  solvedCount: number;
};

export type StudyListProblem = {
  slug: string;
  title: string;
  difficulty: Difficulty;
  points: number;
  solved: boolean;
  position: number;
};

export type StudyListDetail = StudyListSummary & {
  problems: StudyListProblem[];
};

export type AdminStudyListSummary = {
  id: string;
  slug: string;
  title: string;
  isPublic: boolean;
  problemCount: number;
  updatedAt: string;
};

export type AdminStudyListDetail = {
  id: string;
  slug: string;
  title: string;
  description: string;
  isPublic: boolean;
  problemIds: string[];
};
