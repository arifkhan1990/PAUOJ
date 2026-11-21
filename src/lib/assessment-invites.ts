import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { participantStatus } from "./assessments";

export type AssessmentJoinMode = "OPEN_CODE" | "INVITE";

export type AssessmentInviteStatus =
  | "UNSENT"
  | "SENT"
  | "OPENED"
  | "CLAIMED"
  | "REVOKED"
  | "EXPIRED";

export type AssessmentClaimAssurance =
  | "VERIFIED_EMAIL"
  | "EMAIL_MATCH"
  | "REF_MATCH";

export type AssessmentInviteSummary = {
  id: string;
  candidateRef: string;
  email: string | null;
  groupLabel: string | null;
  candidateName: string | null;
  status: AssessmentInviteStatus;
  sentAt: string | null;
  lastSentAt: string | null;
  sendCount: number;
  failedClaimCount: number;
  claimedAt: string | null;
  claimedAssurance: AssessmentClaimAssurance | null;
  createdAt: string;
};

export type AssessmentInviteDetail = AssessmentInviteSummary & {
  assessmentId: string;
  sendWindowStartedAt: string | null;
  sendWindowCount: number;
  claimFailWindowStartedAt: string | null;
  claimFailWindowCount: number;
  lastFailedClaimAt: string | null;
  updatedAt: string;
};

export const INVITE_TOKEN_BYTES = 32;
export const SEND_WINDOW_MS = 60 * 60 * 1000;
export const SEND_WINDOW_LIMIT = 3;
export const SEND_LOCK_MS = 120 * 1000;
export const CLAIM_FAIL_WINDOW_MS = 15 * 60 * 1000;
export const CLAIM_FAIL_LIMIT = 5;

export type WindowState = { startedAt: Date | null; count: number };

export function normaliseRef(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

export function normaliseEmail(value: string | null | undefined): string | null {
  const normalised = value?.trim().toLowerCase() ?? "";
  return normalised.length > 0 ? normalised : null;
}

export function normaliseOptionalText(
  value: string | null | undefined,
): string | null {
  const trimmed = value?.trim() ?? "";
  return trimmed.length > 0 ? trimmed : null;
}

export function refsMatch(left: string, right: string): boolean {
  return safeEquals(
    normaliseRef(left).toLowerCase(),
    normaliseRef(right).toLowerCase(),
  );
}

/**
 * Compares two secrets by fixed-length digests so the running time does not
 * depend on how many leading characters match.
 */
function safeEquals(left: string, right: string): boolean {
  const leftDigest = createHash("sha256").update(left).digest();
  const rightDigest = createHash("sha256").update(right).digest();
  return timingSafeEqual(leftDigest, rightDigest);
}

/**
 * Last three characters of an invite's normalised candidate ref, shown on the
 * public resolve route so a candidate can recognise their own row. Short refs
 * are never hinted, and the full ref never leaves the server.
 */
export function refHint(candidateRef: string): string | null {
  const normalised = normaliseRef(candidateRef);
  return normalised.length > 8 ? normalised.slice(-3) : null;
}

/**
 * A CLAIMED invite that belongs to this account is a retry of a partially
 * completed claim, not a refusal. Checked before decideClaim so a retry
 * resumes the participant instead of failing ALREADY_CLAIMED.
 */
export function isOwnClaim(
  invite: { status: AssessmentInviteStatus; claimedByUserId: string | null },
  userId: string,
): boolean {
  return invite.status === "CLAIMED" && invite.claimedByUserId === userId;
}

/**
 * Assurance to record when an invite is already claimed but its row carries no
 * assurance. Derived from the delivery channel and the account's verification
 * state, never guessed, so the audit trail stays truthful.
 */
export function deriveClaimAssurance(
  invite: { email: string | null },
  emailVerified: boolean,
): AssessmentClaimAssurance {
  if (!normaliseEmail(invite.email)) return "REF_MATCH";
  return emailVerified ? "VERIFIED_EMAIL" : "EMAIL_MATCH";
}

export type ParticipantClaimState = {
  expiresAt: Date | string;
  finishedAt: Date | string | null;
  inviteId: string | null;
  assurance?: AssessmentClaimAssurance | null;
};

export type ParticipantClaimBlock =
  | { kind: "NONE" }
  | { kind: "FINISHED" }
  | { kind: "EXPIRED" }
  | { kind: "BOUND_OTHER" }
  | { kind: "RESUME"; assurance: AssessmentClaimAssurance | null };

/**
 * Classifies an existing participant before any claim is attempted, so a
 * terminal session or an invite bound to another row never consumes the invite
 * or a failed-claim slot. `NONE` covers both "no row" and "unbound row".
 */
export function participantClaimBlock(
  participant: ParticipantClaimState | null,
  inviteId: string,
  now: Date = new Date(),
): ParticipantClaimBlock {
  if (!participant) return { kind: "NONE" };
  const status = participantStatus(participant, now);
  if (status === "FINISHED") return { kind: "FINISHED" };
  if (status === "EXPIRED") return { kind: "EXPIRED" };
  if (participant.inviteId === inviteId) {
    return { kind: "RESUME", assurance: participant.assurance ?? null };
  }
  if (participant.inviteId) return { kind: "BOUND_OTHER" };
  return { kind: "NONE" };
}

export function generateInviteToken(): string {
  return randomBytes(INVITE_TOKEN_BYTES).toString("base64url");
}

export function hashInviteToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function advanceWindow(
  state: WindowState,
  now: Date,
  windowMs: number,
): { startedAt: Date; count: number } {
  const expired =
    !state.startedAt || now.getTime() - state.startedAt.getTime() >= windowMs;
  if (expired || !state.startedAt) return { startedAt: now, count: 1 };
  return { startedAt: state.startedAt, count: state.count + 1 };
}

export function isWindowFull(
  state: WindowState,
  now: Date,
  windowMs: number,
  limit: number,
): boolean {
  if (!state.startedAt) return false;
  if (now.getTime() - state.startedAt.getTime() >= windowMs) return false;
  return state.count >= limit;
}

/**
 * A failed-claim window allows CLAIM_FAIL_LIMIT attempts; the next one is
 * rejected with 429 until the window expires.
 */
export function isClaimThrottled(windowCount: number): boolean {
  return windowCount > CLAIM_FAIL_LIMIT;
}

function toDate(value: Date | string): Date {
  return typeof value === "string" ? new Date(value) : value;
}

export function effectiveInviteStatus(
  invite: { status: AssessmentInviteStatus },
  assessment: { endAt: Date | string },
  now: Date = new Date(),
): AssessmentInviteStatus {
  if (
    invite.status === "REVOKED" ||
    invite.status === "CLAIMED" ||
    invite.status === "EXPIRED"
  ) {
    return invite.status;
  }
  return now.getTime() >= toDate(assessment.endAt).getTime()
    ? "EXPIRED"
    : invite.status;
}

export type ClaimRefusalReason =
  | "ALREADY_CLAIMED"
  | "REVOKED"
  | "EXPIRED"
  | "ENDED"
  | "EMAIL_MISMATCH"
  | "REF_MISMATCH";

export type ClaimRefusal = {
  code: string;
  message: string;
  status: number;
};

/**
 * One distinct refusal per state. Messages stay short and never echo the
 * invited email, the stored ref, or whether the row exists.
 */
export function claimRefusal(reason: ClaimRefusalReason): ClaimRefusal {
  switch (reason) {
    case "ALREADY_CLAIMED":
      return {
        code: "INVITE_CLAIMED",
        message: "This invite has already been claimed by another account.",
        status: 409,
      };
    case "REVOKED":
      return {
        code: "INVITE_REVOKED",
        message: "This invite has been revoked. Ask the organiser for a new link.",
        status: 410,
      };
    case "EXPIRED":
      return {
        code: "INVITE_EXPIRED",
        message: "This invite has expired.",
        status: 410,
      };
    case "ENDED":
      return {
        code: "ASSESSMENT_ENDED",
        message: "This assessment has ended.",
        status: 410,
      };
    case "EMAIL_MISMATCH":
      return {
        code: "INVITE_EMAIL_MISMATCH",
        message:
          "This invite belongs to a different account. Sign in with the account that received it.",
        status: 403,
      };
    case "REF_MISMATCH":
      return {
        code: "INVITE_REF_MISMATCH",
        message: "That candidate reference does not match this invite.",
        status: 403,
      };
  }
}

export type ClaimDecision =
  | { ok: true; assurance: AssessmentClaimAssurance }
  | { ok: false; reason: ClaimRefusalReason };

export type ClaimDecisionInput = {
  invite: {
    status: AssessmentInviteStatus;
    email: string | null;
    candidateRef: string;
  };
  assessment: { endAt: Date | string };
  accountEmail: string | null | undefined;
  emailVerified: boolean;
  submittedRef?: string | null;
  now?: Date;
};

export function decideClaim(input: ClaimDecisionInput): ClaimDecision {
  const now = input.now ?? new Date();
  if (input.invite.status === "CLAIMED") {
    return { ok: false, reason: "ALREADY_CLAIMED" };
  }
  if (input.invite.status === "REVOKED") {
    return { ok: false, reason: "REVOKED" };
  }
  if (input.invite.status === "EXPIRED") {
    return { ok: false, reason: "EXPIRED" };
  }
  if (now.getTime() >= toDate(input.assessment.endAt).getTime()) {
    return { ok: false, reason: "ENDED" };
  }

  const inviteEmail = normaliseEmail(input.invite.email);
  if (inviteEmail) {
    const accountEmail = normaliseEmail(input.accountEmail);
    if (!accountEmail || !safeEquals(accountEmail, inviteEmail)) {
      return { ok: false, reason: "EMAIL_MISMATCH" };
    }
    return {
      ok: true,
      assurance: input.emailVerified ? "VERIFIED_EMAIL" : "EMAIL_MATCH",
    };
  }

  if (
    !input.submittedRef ||
    !refsMatch(input.submittedRef, input.invite.candidateRef)
  ) {
    return { ok: false, reason: "REF_MISMATCH" };
  }
  return { ok: true, assurance: "REF_MATCH" };
}
