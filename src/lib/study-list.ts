import type { Difficulty } from "./difficulty";
import type {
  StudyDifficultyCounts,
  StudyListLevel,
  StudyListNextProblem,
  StudyListProblem,
} from "./study-list-types";

export const STUDY_LIST_LEVELS: ReadonlyArray<{
  value: StudyListLevel;
  label: string;
  description: string;
}> = [
  {
    value: "BEGINNER",
    label: "Beginner",
    description: "No prior contest experience needed.",
  },
  {
    value: "INTERMEDIATE",
    label: "Intermediate",
    description: "Comfortable with loops, arrays and basic data structures.",
  },
  {
    value: "ADVANCED",
    label: "Advanced",
    description: "Ready for multi-step algorithms and harder invariants.",
  },
];

export function studyListLevelMeta(level: string): {
  value: StudyListLevel;
  label: string;
  description: string;
} {
  return (
    STUDY_LIST_LEVELS.find((entry) => entry.value === level) ??
    STUDY_LIST_LEVELS[0]!
  );
}

/** Minutes a typical learner needs for one problem of each difficulty. */
export const STUDY_MINUTES_BY_DIFFICULTY: Record<Difficulty, number> = {
  EASY: 15,
  MEDIUM: 25,
  HARD: 40,
  EXPERT: 60,
};

export function estimateStudyMinutes(
  problems: ReadonlyArray<{ difficulty: string }>,
): number {
  return problems.reduce(
    (total, problem) =>
      total +
      (STUDY_MINUTES_BY_DIFFICULTY[problem.difficulty as Difficulty] ??
        STUDY_MINUTES_BY_DIFFICULTY.MEDIUM),
    0,
  );
}

export function formatStudyDuration(minutes: number): string {
  if (!Number.isFinite(minutes) || minutes <= 0) return "—";
  const rounded = Math.round(minutes);
  if (rounded < 60) return `${rounded} min`;
  const hours = Math.floor(rounded / 60);
  const remainder = rounded % 60;
  return remainder > 0 ? `${hours}h ${remainder}m` : `${hours}h`;
}

export function emptyDifficultyCounts(): StudyDifficultyCounts {
  return { EASY: 0, MEDIUM: 0, HARD: 0, EXPERT: 0 };
}

export function countStudyDifficulties(
  problems: ReadonlyArray<{ difficulty: string }>,
): StudyDifficultyCounts {
  const counts = emptyDifficultyCounts();
  for (const problem of problems) {
    const difficulty = problem.difficulty as Difficulty;
    if (difficulty in counts) counts[difficulty] += 1;
  }
  return counts;
}

export function studyProgressPercent(solved: number, total: number): number {
  if (total <= 0) return 0;
  return Math.min(100, Math.max(0, Math.round((solved / total) * 100)));
}

/** The first unsolved problem in plan order is the natural next step. */
export function pickNextStudyProblem(
  problems: ReadonlyArray<StudyListProblem>,
): StudyListNextProblem | null {
  const next = [...problems]
    .sort((left, right) => left.position - right.position)
    .find((problem) => !problem.solved);
  if (!next) return null;
  return {
    slug: next.slug,
    title: next.title,
    difficulty: next.difficulty,
    position: next.position,
    sectionTitle: next.sectionTitle,
  };
}

export function uniqueStudyTopics(
  topics: ReadonlyArray<string>,
  limit = 4,
): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const topic of topics) {
    const trimmed = topic.trim();
    const key = trimmed.toLowerCase();
    if (!trimmed || seen.has(key)) continue;
    seen.add(key);
    result.push(trimmed);
    if (result.length >= limit) break;
  }
  return result;
}
