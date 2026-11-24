import type { Difficulty } from "@/lib/difficulty";
import type {
  ProfileHardestProblem,
  ProfileProblemItem,
} from "@/lib/profile-types";

export type ProfileProblemActivity = {
  slug: string;
  title: string;
  difficulty: Difficulty;
  points: number;
  attempts: number;
  lastActivityAt: Date;
  accepted: boolean;
};

const MAX_PROBLEM_LIST = 6;

function toProblemItem(row: ProfileProblemActivity): ProfileProblemItem {
  return {
    slug: row.slug,
    title: row.title,
    difficulty: row.difficulty,
    points: row.points,
    attempts: Number(row.attempts),
    lastActivityAt: new Date(row.lastActivityAt).toISOString(),
  };
}

function hardestOf(
  rows: ProfileProblemActivity[],
): ProfileHardestProblem | null {
  return rows.reduce<ProfileHardestProblem | null>(
    (best, row) =>
      !best || row.points > best.points
        ? { points: row.points, difficulty: row.difficulty }
        : best,
    null,
  );
}

/**
 * Public, practice-only problem progress shown on a profile.
 * Keeps the ordering and caps previously computed in `getProfile`.
 */
export function buildProblemProgress(rows: ProfileProblemActivity[]) {
  const solved = rows.filter((row) => Boolean(row.accepted));
  const unsolved = rows.filter((row) => !row.accepted);

  return {
    solvedProblems: solved.slice(0, MAX_PROBLEM_LIST).map(toProblemItem),
    unsolvedProblems: unsolved.slice(0, MAX_PROBLEM_LIST).map(toProblemItem),
    attemptedCount: unsolved.length,
    hardestTried: hardestOf(rows),
    hardestSolved: hardestOf(solved),
  };
}
