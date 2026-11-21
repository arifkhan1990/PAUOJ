import { and, eq } from "drizzle-orm";
import { ApiError } from "@/server/api/errors";
import { getDb } from "@/server/db";
import {
  assessmentInvites,
  assessmentParticipants,
  type Assessment,
  type AssessmentInvite,
  type AssessmentParticipant,
} from "@/server/db/schema";
import type { SafeUser } from "@/server/auth/session";
import {
  CLAIM_FAIL_WINDOW_MS,
  claimRefusal,
  decideClaim,
  deriveClaimAssurance,
  isClaimThrottled,
  isOwnClaim,
  participantClaimBlock,
  type ClaimRefusalReason,
} from "@/lib/assessment-invites";
import {
  assessmentPhase,
  participantExpiresAt,
  participantStatus,
} from "@/lib/assessments";
import type { AssessmentClaimAssurance } from "@/lib/types";
import {
  bindParticipantInvite,
  claimInviteRow,
  recordFailedClaim,
  resolveInviteToken,
} from "./assessment-invites";

export type ClaimInviteInput = {
  token: string;
  candidateRef?: string | null;
};

export type ClaimInviteResult = {
  startedAt: string;
  expiresAt: string;
  assurance: AssessmentClaimAssurance;
  resumed: boolean;
};

function inviteNotFound(): ApiError {
  // Same response for an unknown token, a token for another slug and an
  // unpublished assessment, so the route never reveals which one failed.
  return new ApiError("INVITE_NOT_FOUND", "This invite link is not valid.", 404);
}

function refusalError(reason: ClaimRefusalReason): ApiError {
  const refusal = claimRefusal(reason);
  return new ApiError(refusal.code, refusal.message, refusal.status);
}

async function loadInvite(inviteId: string): Promise<AssessmentInvite | null> {
  const [row] = await getDb()
    .select()
    .from(assessmentInvites)
    .where(eq(assessmentInvites.id, inviteId))
    .limit(1);
  return row ?? null;
}

async function loadParticipant(
  assessmentId: string,
  userId: string,
): Promise<AssessmentParticipant | null> {
  const [row] = await getDb()
    .select()
    .from(assessmentParticipants)
    .where(
      and(
        eq(assessmentParticipants.assessmentId, assessmentId),
        eq(assessmentParticipants.userId, userId),
      ),
    )
    .limit(1);
  return row ?? null;
}

/**
 * Resolves an existing participant without touching its timer. A participant
 * bound to another invite is refused; an unbound one (joined by code earlier)
 * is bound to this invite.
 */
async function resumeParticipant(
  assessment: Assessment,
  userId: string,
  inviteId: string,
  assurance: AssessmentClaimAssurance,
  now: Date,
): Promise<ClaimInviteResult | null> {
  const participant = await loadParticipant(assessment.id, userId);
  if (!participant) return null;

  const status = participantStatus(participant, now);
  if (status === "FINISHED") {
    throw new ApiError(
      "ASSESSMENT_ALREADY_FINISHED",
      "You have already finished this assessment.",
      409,
    );
  }
  if (status === "EXPIRED") {
    throw new ApiError(
      "ASSESSMENT_SESSION_EXPIRED",
      "Your assessment session has already expired.",
      410,
    );
  }
  if (participant.inviteId && participant.inviteId !== inviteId) {
    throw new ApiError(
      "PARTICIPANT_ALREADY_BOUND",
      "This account is already linked to a different candidate.",
      409,
    );
  }
  if (!participant.inviteId) {
    const bound = await bindParticipantInvite(
      assessment.id,
      userId,
      inviteId,
      assurance,
    );
    if (bound) {
      return {
        startedAt: bound.startedAt.toISOString(),
        expiresAt: bound.expiresAt.toISOString(),
        assurance: bound.assurance ?? assurance,
        resumed: true,
      };
    }
  }

  return {
    startedAt: participant.startedAt.toISOString(),
    expiresAt: participant.expiresAt.toISOString(),
    assurance: participant.assurance ?? assurance,
    resumed: true,
  };
}

export async function claimAssessmentInvite(
  slug: string,
  user: SafeUser,
  input: ClaimInviteInput,
  now: Date = new Date(),
): Promise<ClaimInviteResult> {
  const resolved = await resolveInviteToken(input.token);
  if (
    !resolved ||
    resolved.assessment.slug !== slug ||
    !resolved.assessment.isPublished
  ) {
    throw inviteNotFound();
  }

  const { assessment } = resolved;
  const phase = assessmentPhase(assessment.startAt, assessment.endAt, now);
  if (phase === "UPCOMING") {
    throw new ApiError(
      "ASSESSMENT_NOT_STARTED",
      "This assessment has not started yet.",
      409,
    );
  }
  if (phase === "ENDED") {
    throw new ApiError("ASSESSMENT_ENDED", "This assessment has ended.", 410);
  }

  const invite = resolved.invite;
  let assurance: AssessmentClaimAssurance;

  // Preflight before any claim: a finished, expired or otherwise bound
  // participant must be refused (or resumed) without consuming the invite row
  // or a failed-claim slot.
  const participant = await loadParticipant(assessment.id, user.id);
  const block = participantClaimBlock(participant, invite.id, now);
  if (block.kind === "FINISHED") {
    throw new ApiError(
      "ASSESSMENT_ALREADY_FINISHED",
      "You have already finished this assessment.",
      409,
    );
  }
  if (block.kind === "EXPIRED") {
    throw new ApiError(
      "ASSESSMENT_SESSION_EXPIRED",
      "Your assessment session has already expired.",
      410,
    );
  }
  if (block.kind === "BOUND_OTHER") {
    throw new ApiError(
      "PARTICIPANT_ALREADY_BOUND",
      "This account is already linked to a different candidate.",
      409,
    );
  }
  if (block.kind === "RESUME" && participant) {
    return {
      startedAt: participant.startedAt.toISOString(),
      expiresAt: participant.expiresAt.toISOString(),
      assurance:
        block.assurance ??
        invite.claimedAssurance ??
        deriveClaimAssurance(invite, user.emailVerifiedAt !== null),
      resumed: true,
    };
  }

  // Checked before decideClaim: a CLAIMED invite owned by this account is a
  // retry of a partially completed claim (invite written, participant not), so
  // it must resume below rather than be refused as ALREADY_CLAIMED.
  if (isOwnClaim(invite, user.id)) {
    assurance =
      invite.claimedAssurance ??
      deriveClaimAssurance(invite, user.emailVerifiedAt !== null);
  } else if (invite.status === "CLAIMED") {
    throw refusalError("ALREADY_CLAIMED");
  } else {
    if (resolved.status === "REVOKED") throw refusalError("REVOKED");
    if (resolved.status === "EXPIRED") throw refusalError("EXPIRED");

    const windowStartedAt = invite.claimFailWindowStartedAt;
    const windowActive =
      windowStartedAt !== null &&
      now.getTime() - windowStartedAt.getTime() < CLAIM_FAIL_WINDOW_MS;
    if (windowActive && isClaimThrottled(invite.claimFailWindowCount)) {
      throw new ApiError(
        "INVITE_RATE_LIMITED",
        "Too many failed attempts on this link. Wait a few minutes and try again.",
        429,
      );
    }

    const decision = decideClaim({
      invite,
      assessment,
      accountEmail: user.email,
      emailVerified: user.emailVerifiedAt !== null,
      submittedRef: input.candidateRef ?? null,
      now,
    });
    if (!decision.ok) {
      const recorded = await recordFailedClaim(invite.id, now);
      if (recorded?.throttled) {
        throw new ApiError(
          "INVITE_RATE_LIMITED",
          "Too many failed attempts on this link. Wait a few minutes and try again.",
          429,
        );
      }
      throw refusalError(decision.reason);
    }
    assurance = decision.assurance;

    const claimed = await claimInviteRow(invite.id, user.id, assurance, now);
    if (!claimed) {
      // The conditional UPDATE refused: the assessment may have ended between
      // the phase check and the write (end-time guard) or another request won.
      if (now.getTime() >= assessment.endAt.getTime()) {
        throw refusalError("ENDED");
      }
      const current = await loadInvite(invite.id);
      if (!current) throw inviteNotFound();
      if (current.status === "REVOKED") throw refusalError("REVOKED");
      if (current.status === "EXPIRED") throw refusalError("EXPIRED");
      if (isOwnClaim(current, user.id)) {
        assurance = current.claimedAssurance ?? assurance;
      } else if (current.status === "CLAIMED" || current.claimedByUserId) {
        throw refusalError("ALREADY_CLAIMED");
      } else {
        throw new ApiError(
          "INVITE_CLAIM_FAILED",
          "Could not claim this invite. Please try again.",
          409,
        );
      }
    }
  }

  // The invite claim and participant creation are sequential rather than one
  // transaction. That is safe because a retry with the same account takes the
  // CLAIMED-by-same-user path above and resumes the participant instead of
  // failing, so a crash between the two writes is recoverable.
  const resumed = await resumeParticipant(
    assessment,
    user.id,
    invite.id,
    assurance,
    now,
  );
  if (resumed) return resumed;

  const expiresAt = participantExpiresAt(
    now,
    assessment.durationMinutes,
    assessment.endAt,
  );
  const [inserted] = await getDb()
    .insert(assessmentParticipants)
    .values({
      assessmentId: assessment.id,
      userId: user.id,
      startedAt: now,
      expiresAt,
      inviteId: invite.id,
      assurance,
    })
    .onConflictDoNothing()
    .returning();
  if (inserted) {
    return {
      startedAt: inserted.startedAt.toISOString(),
      expiresAt: inserted.expiresAt.toISOString(),
      assurance,
      resumed: false,
    };
  }

  // Lost the insert race: re-read and treat it as the existing participant.
  const raced = await resumeParticipant(
    assessment,
    user.id,
    invite.id,
    assurance,
    now,
  );
  if (raced) return raced;
  throw new ApiError(
    "PARTICIPANT_START_FAILED",
    "Could not start the assessment. Please try again.",
    409,
  );
}
