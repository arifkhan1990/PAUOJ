import { participantStatus } from "@/lib/assessments";
import { toCsv } from "@/lib/csv";
import type {
  AssessmentInvite,
  AssessmentParticipant,
  SubmissionStatus,
} from "@/server/db/schema";
import type {
  AssessmentClaimAssurance,
  AssessmentParticipantStatus,
} from "@/lib/types";

/**
 * Export statuses are roster-facing, not invite-facing: an untouched roster row
 * is NOT_STARTED even if its invite is only UNSENT/SENT, and CLAIMED/RESUMED
 * are never persisted participant states so they never appear here.
 */
export type AssessmentExportStatus =
  | "NOT_STARTED"
  | "REVOKED"
  | AssessmentParticipantStatus;

export type AssessmentExportSubmission = {
  userId: string;
  problemId: string;
  status: SubmissionStatus;
  createdAt: Date;
};

export type AssessmentExportProblemCell = {
  solved: boolean;
  attempts: number;
};

/** One ordered assessment problem: its id, label and (implicit) position. */
export type AssessmentExportProblem = {
  id: string;
  label: string;
};

export type AssessmentExportRow = {
  candidateRef: string;
  candidateName: string;
  groupLabel: string;
  email: string;
  status: AssessmentExportStatus;
  assurance: AssessmentClaimAssurance | "";
  failedClaims: number;
  startedAt: Date | null;
  finishedAt: Date | null;
  lastSubmissionAt: Date | null;
  solved: number;
  points: number;
  submissions: number;
  /** problem label -> per-problem cell; every assessment label is present. */
  problems: Record<string, AssessmentExportProblemCell>;
};

export type BuildAssessmentExportRowsInput = {
  invites: AssessmentInvite[];
  participants: AssessmentParticipant[];
  submissions: AssessmentExportSubmission[];
  /** assessment problems ordered by position, from assessment_problems ⋈ problems */
  problems: AssessmentExportProblem[];
  /** assessment problem id -> problem points, from assessment_problems ⋈ problems */
  problemPoints: Map<string, number>;
  now?: Date;
};

type UserStats = {
  solvedProblemIds: Set<string>;
  points: number;
  submissions: number;
  lastSubmissionAt: Date | null;
  problems: Record<string, AssessmentExportProblemCell>;
};

/** Every row carries a cell for every assessment label, absent rows included. */
function emptyCells(labels: string[]): Record<string, AssessmentExportProblemCell> {
  const cells: Record<string, AssessmentExportProblemCell> = {};
  for (const label of labels) cells[label] = { solved: false, attempts: 0 };
  return cells;
}

/** Copy so roster and participant-only rows never alias the same cell objects. */
function copyCells(
  cells: Record<string, AssessmentExportProblemCell>,
): Record<string, AssessmentExportProblemCell> {
  const copy: Record<string, AssessmentExportProblemCell> = {};
  for (const [label, cell] of Object.entries(cells)) {
    copy[label] = { solved: cell.solved, attempts: cell.attempts };
  }
  return copy;
}

function collectUserStats(
  submissions: AssessmentExportSubmission[],
  problems: AssessmentExportProblem[],
  problemPoints: Map<string, number>,
): Map<string, UserStats> {
  const labels = problems.map((problem) => problem.label);
  const labelByProblem = new Map(
    problems.map((problem) => [problem.id, problem.label]),
  );
  const stats = new Map<string, UserStats>();
  for (const submission of submissions) {
    let entry = stats.get(submission.userId);
    if (!entry) {
      entry = {
        solvedProblemIds: new Set<string>(),
        points: 0,
        submissions: 0,
        lastSubmissionAt: null,
        problems: emptyCells(labels),
      };
      stats.set(submission.userId, entry);
    }
    entry.submissions += 1;
    if (
      entry.lastSubmissionAt === null ||
      submission.createdAt.getTime() > entry.lastSubmissionAt.getTime()
    ) {
      entry.lastSubmissionAt = submission.createdAt;
    }
    // Problems detached from the assessment stay out of points and cells,
    // matching the on-screen results view; the submission still counts.
    const label = labelByProblem.get(submission.problemId);
    if (!label) continue;
    const cell = entry.problems[label];
    if (!cell || cell.solved) continue;
    if (submission.status === "ACCEPTED") {
      cell.solved = true;
      entry.solvedProblemIds.add(submission.problemId);
      entry.points += problemPoints.get(submission.problemId) ?? 0;
    } else {
      cell.attempts += 1;
    }
  }
  return stats;
}

function exportStatus(
  invite: AssessmentInvite | null,
  participant: AssessmentParticipant | null,
  now: Date,
): AssessmentExportStatus {
  if (participant) return participantStatus(participant, now);
  return invite?.status === "REVOKED" ? "REVOKED" : "NOT_STARTED";
}

function buildRow(
  invite: AssessmentInvite | null,
  participant: AssessmentParticipant | null,
  stats: UserStats | undefined,
  now: Date,
  labels: string[],
): AssessmentExportRow {
  return {
    candidateRef: invite?.candidateRef ?? "",
    candidateName: invite?.candidateName ?? "",
    groupLabel: invite?.groupLabel ?? "",
    email: invite?.email ?? "",
    status: exportStatus(invite, participant, now),
    assurance: participant?.assurance ?? invite?.claimedAssurance ?? "",
    failedClaims: invite?.failedClaimCount ?? 0,
    startedAt: participant?.startedAt ?? null,
    finishedAt: participant?.finishedAt ?? null,
    lastSubmissionAt: stats?.lastSubmissionAt ?? null,
    solved: stats?.solvedProblemIds.size ?? 0,
    points: stats?.points ?? 0,
    submissions: stats?.submissions ?? 0,
    problems: stats ? copyCells(stats.problems) : emptyCells(labels),
  };
}

/** NULL group labels sort first, so blank (open-code) rows open the file. */
function compareGroupLabels(left: string, right: string): number {
  if (left === right) return 0;
  if (left === "") return -1;
  if (right === "") return 1;
  return left.localeCompare(right);
}

/** Participant-only rows have no roster ref and sort last inside their block. */
function compareCandidateRefs(left: string, right: string): number {
  if (left === right) return 0;
  if (left === "") return 1;
  if (right === "") return -1;
  return left.localeCompare(right);
}

function compareRows(left: AssessmentExportRow, right: AssessmentExportRow): number {
  const byGroup = compareGroupLabels(left.groupLabel, right.groupLabel);
  if (byGroup !== 0) return byGroup;
  const leftBlank = left.candidateRef === "" ? 1 : 0;
  const rightBlank = right.candidateRef === "" ? 1 : 0;
  if (leftBlank !== rightBlank) return leftBlank - rightBlank;
  if (left.points !== right.points) return right.points - left.points;
  return compareCandidateRefs(left.candidateRef, right.candidateRef);
}

/**
 * Roster-complete export rows: one per invite (absent candidates included) plus
 * any participant that has no surviving invite (OPEN_CODE joins, deleted rows).
 */
export function buildAssessmentExportRows(
  input: BuildAssessmentExportRowsInput,
): AssessmentExportRow[] {
  const now = input.now ?? new Date();
  const labels = input.problems.map((problem) => problem.label);
  const statsByUser = collectUserStats(
    input.submissions,
    input.problems,
    input.problemPoints,
  );
  const inviteIds = new Set(input.invites.map((invite) => invite.id));
  const participantByInvite = new Map<string, AssessmentParticipant>();
  const participantOnly: AssessmentParticipant[] = [];

  for (const participant of input.participants) {
    if (participant.inviteId && inviteIds.has(participant.inviteId)) {
      participantByInvite.set(participant.inviteId, participant);
    } else {
      participantOnly.push(participant);
    }
  }

  const rows = input.invites.map((invite) => {
    const participant = participantByInvite.get(invite.id) ?? null;
    return buildRow(
      invite,
      participant,
      participant ? statsByUser.get(participant.userId) : undefined,
      now,
      labels,
    );
  });

  for (const participant of participantOnly) {
    rows.push(
      buildRow(null, participant, statsByUser.get(participant.userId), now, labels),
    );
  }

  return rows.sort(compareRows);
}

const CSV_HEADER = [
  "candidate_ref",
  "candidate_name",
  "group_label",
  "email",
  "status",
  "assurance",
  "failed_claims",
  "started_at",
  "finished_at",
  "last_submission_at",
  "solved",
  "points",
  "submissions",
];

function iso(value: Date | null): string {
  return value?.toISOString() ?? "";
}

/**
 * Appends two columns per assessment problem in the given label order, so the
 * header stays deterministic regardless of object key insertion.
 */
export function assessmentResultsCsv(
  rows: AssessmentExportRow[],
  labels: string[] = [],
): string {
  const header = [
    ...CSV_HEADER,
    ...labels.flatMap((label) => [`${label}_solved`, `${label}_attempts`]),
  ];
  const body = rows.map((row) => [
    row.candidateRef,
    row.candidateName,
    row.groupLabel,
    row.email,
    row.status,
    row.assurance,
    row.failedClaims,
    iso(row.startedAt),
    iso(row.finishedAt),
    iso(row.lastSubmissionAt),
    row.solved,
    row.points,
    row.submissions,
    ...labels.flatMap((label) => {
      const cell = row.problems[label] ?? { solved: false, attempts: 0 };
      return [cell.solved ? 1 : 0, cell.attempts];
    }),
  ]);
  return toCsv([header, ...body]);
}
