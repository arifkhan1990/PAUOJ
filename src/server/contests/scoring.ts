import type { ScoreboardCell, ScoreboardRow } from "@/lib/types";
import type { Verdict } from "@/lib/verdicts";

export type ScoringProblem = {
  id: string;
  label: string;
};

export type ScoringParticipant = {
  userId: string;
  username: string;
  displayName: string;
};

export type ScoringSubmission = {
  userId: string;
  problemId: string;
  status: Verdict;
  createdAt: Date;
};

const PENALTY_STATUSES = new Set<Verdict>([
  "WRONG_ANSWER",
  "TIME_LIMIT_EXCEEDED",
  "MEMORY_LIMIT_EXCEEDED",
  "RUNTIME_ERROR",
  "OUTPUT_LIMIT_EXCEEDED",
]);

const PENALTY_MINUTES = 20;

type WorkingRow = ScoreboardRow & {
  lastAcceptedAt: number | null;
};

export function computeScoreboard(input: {
  startAt: Date;
  problems: ScoringProblem[];
  participants: ScoringParticipant[];
  submissions: ScoringSubmission[];
}): ScoreboardRow[] {
  const labelByProblem = new Map(
    input.problems.map((problem) => [problem.id, problem.label]),
  );
  const rows = new Map<string, WorkingRow>();
  const firstBloodProblems = new Set<string>();

  for (const participant of input.participants) {
    const problems: Record<string, ScoreboardCell> = {};
    for (const problem of input.problems) {
      problems[problem.label] = {
        solved: false,
        attempts: 0,
        solveTimeMinutes: null,
        firstBlood: false,
      };
    }
    rows.set(participant.userId, {
      rank: 0,
      user: {
        username: participant.username,
        displayName: participant.displayName,
      },
      solved: 0,
      penalty: 0,
      problems,
      lastAcceptedAt: null,
    });
  }

  const ordered = [...input.submissions].sort(
    (left, right) => left.createdAt.getTime() - right.createdAt.getTime(),
  );

  for (const submission of ordered) {
    const row = rows.get(submission.userId);
    if (!row) continue;
    const label = labelByProblem.get(submission.problemId);
    if (!label) continue;
    const cell = row.problems[label];
    if (!cell || cell.solved) continue;

    if (submission.status === "ACCEPTED") {
      const minutes = Math.max(
        0,
        Math.floor(
          (submission.createdAt.getTime() - input.startAt.getTime()) / 60_000,
        ),
      );
      cell.solved = true;
      cell.solveTimeMinutes = minutes;
      if (!firstBloodProblems.has(submission.problemId)) {
        firstBloodProblems.add(submission.problemId);
        cell.firstBlood = true;
      }
      row.solved += 1;
      row.penalty += minutes + cell.attempts * PENALTY_MINUTES;
      row.lastAcceptedAt = submission.createdAt.getTime();
    } else if (PENALTY_STATUSES.has(submission.status)) {
      cell.attempts += 1;
    }
  }

  const result = [...rows.values()].sort((left, right) => {
    if (right.solved !== left.solved) return right.solved - left.solved;
    if (left.penalty !== right.penalty) return left.penalty - right.penalty;
    const leftTime = left.lastAcceptedAt ?? Number.MAX_SAFE_INTEGER;
    const rightTime = right.lastAcceptedAt ?? Number.MAX_SAFE_INTEGER;
    if (leftTime !== rightTime) return leftTime - rightTime;
    return left.user.username.localeCompare(right.user.username);
  });

  let previous: WorkingRow | null = null;
  let previousRank = 0;
  return result.map((row, index) => {
    const tied =
      previous !== null &&
      previous.solved === row.solved &&
      previous.penalty === row.penalty;
    const rank = tied ? previousRank : index + 1;
    previous = row;
    previousRank = rank;
    return {
      rank,
      user: row.user,
      solved: row.solved,
      penalty: row.penalty,
      problems: row.problems,
    };
  });
}
