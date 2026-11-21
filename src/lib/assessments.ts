import type { AssessmentParticipantStatus, AssessmentPhase } from "./types";

export function assessmentPhase(
  startAt: string | Date,
  endAt: string | Date,
  now: Date = new Date(),
): AssessmentPhase {
  const start = typeof startAt === "string" ? new Date(startAt) : startAt;
  const end = typeof endAt === "string" ? new Date(endAt) : endAt;
  if (now < start) return "UPCOMING";
  if (now >= end) return "ENDED";
  return "RUNNING";
}

export function participantStatus(
  participant: { expiresAt: string | Date; finishedAt: string | Date | null },
  now: Date = new Date(),
): AssessmentParticipantStatus {
  if (participant.finishedAt) return "FINISHED";
  const expires =
    typeof participant.expiresAt === "string"
      ? new Date(participant.expiresAt)
      : participant.expiresAt;
  if (now >= expires) return "EXPIRED";
  return "ACTIVE";
}

export function participantExpiresAt(
  startedAt: Date,
  durationMinutes: number | null | undefined,
  endAt: string | Date,
): Date {
  const end = typeof endAt === "string" ? new Date(endAt) : endAt;
  const durationMs =
    durationMinutes && durationMinutes > 0
      ? durationMinutes * 60_000
      : Number.POSITIVE_INFINITY;
  return new Date(Math.min(startedAt.getTime() + durationMs, end.getTime()));
}

export function participantRemainingMs(
  assessmentEndAt: string | Date,
  participant: { expiresAt: string | Date; finishedAt: string | Date | null },
  now: Date = new Date(),
): number {
  if (participant.finishedAt) return 0;
  const end = typeof assessmentEndAt === "string" ? new Date(assessmentEndAt) : assessmentEndAt;
  const expires =
    typeof participant.expiresAt === "string"
      ? new Date(participant.expiresAt)
      : participant.expiresAt;
  return Math.max(0, Math.min(end.getTime(), expires.getTime()) - now.getTime());
}
