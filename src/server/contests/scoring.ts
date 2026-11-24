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

export type ScoringTeamMember = {
  userId: string;
  username: string;
  displayName: string;
};

export type ScoringTeam = {
  id: string;
  name: string;
  captainId: string;
  members: ScoringTeamMember[];
};

export type ScoringMode = "INDIVIDUAL" | "TEAM";

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

type RowTeam = NonNullable<ScoreboardRow["team"]>;

type WorkingRow = ScoreboardRow & {
  lastAcceptedAt: number | null;
  sortName: string;
};

type RowSeed = {
  user: ScoreboardRow["user"];
  team: RowTeam | null;
};

function emptyCells(problems: ScoringProblem[]): Record<string, ScoreboardCell> {
  const cells: Record<string, ScoreboardCell> = {};
  for (const problem of problems) {
    cells[problem.label] = {
      solved: false,
      attempts: 0,
      solveTimeMinutes: null,
      firstBlood: false,
    };
  }
  return cells;
}

function rowSeedForParticipant(input: {
  participant: ScoringParticipant;
  mode: ScoringMode;
  teams: Map<string, ScoringTeam>;
  teamIdByUser: Map<string, string>;
}): { key: string; seed: RowSeed } | null {
  if (input.mode === "INDIVIDUAL") {
    return {
      key: input.participant.userId,
      seed: {
        user: {
          username: input.participant.username,
          displayName: input.participant.displayName,
        },
        team: null,
      },
    };
  }

  const teamId = input.teamIdByUser.get(input.participant.userId);
  if (!teamId) return null;
  const team = input.teams.get(teamId);
  if (!team) return null;
  const captain =
    team.members.find((member) => member.userId === team.captainId) ??
    team.members[0] ??
    input.participant;

  return {
    key: team.id,
    seed: {
      user: { username: captain.username, displayName: captain.displayName },
      team: {
        id: team.id,
        name: team.name,
        memberCount: team.members.length,
        members: team.members.map((member) => ({
          username: member.username,
          displayName: member.displayName,
        })),
      },
    },
  };
}

export function computeScoreboard(input: {
  startAt: Date;
  problems: ScoringProblem[];
  participants: ScoringParticipant[];
  submissions: ScoringSubmission[];
  teams?: ScoringTeam[];
  mode?: ScoringMode;
}): ScoreboardRow[] {
  const mode: ScoringMode = input.mode ?? "INDIVIDUAL";
  const teams = new Map((input.teams ?? []).map((team) => [team.id, team]));
  const teamIdByUser = new Map<string, string>();
  for (const team of teams.values()) {
    for (const member of team.members) {
      teamIdByUser.set(member.userId, team.id);
    }
  }

  const labelByProblem = new Map(
    input.problems.map((problem) => [problem.id, problem.label]),
  );
  const rows = new Map<string, WorkingRow>();
  const firstBloodProblems = new Set<string>();

  for (const participant of input.participants) {
    const resolved = rowSeedForParticipant({
      participant,
      mode,
      teams,
      teamIdByUser,
    });
    if (!resolved || rows.has(resolved.key)) continue;
    rows.set(resolved.key, {
      rank: 0,
      user: resolved.seed.user,
      team: resolved.seed.team,
      solved: 0,
      penalty: 0,
      problems: emptyCells(input.problems),
      lastAcceptedAt: null,
      sortName: resolved.seed.team?.name ?? resolved.seed.user.username,
    });
  }

  const ordered = [...input.submissions].sort(
    (left, right) => left.createdAt.getTime() - right.createdAt.getTime(),
  );

  for (const submission of ordered) {
    const rowKey =
      mode === "TEAM"
        ? teamIdByUser.get(submission.userId)
        : submission.userId;
    if (!rowKey) continue;
    const row = rows.get(rowKey);
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
    return left.sortName.localeCompare(right.sortName);
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
      team: row.team,
      solved: row.solved,
      penalty: row.penalty,
      problems: row.problems,
    };
  });
}
