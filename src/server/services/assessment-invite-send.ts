import { ApiError, errors } from "@/server/api/errors";
import { getEnv } from "@/server/env";
import { sendAssessmentInviteEmail } from "@/server/mail";
import type { AssessmentInviteDetail } from "@/lib/types";
import {
  getInviteById,
  loadOwnedAssessment,
  rotateInviteToken,
} from "./assessment-invites";
import {
  beginInviteSend,
  recordInviteSend,
  releaseInviteSend,
} from "./assessment-invite-sends";

export type SendInviteEmailOptions = {
  /** Set for teachers so the assessment stays inside their ownership. */
  ownerId?: string;
  actorId: string;
};

export type SendInviteEmailResult = {
  invite: AssessmentInviteDetail;
  sent: boolean;
};

function inviteUrl(slug: string, token: string): string {
  const base = getEnv().APP_URL.replace(/\/$/, "");
  return `${base}/assessments/${slug}/invite/${token}`;
}

function sendFailed(): ApiError {
  return new ApiError(
    "INVITE_SEND_FAILED",
    "The email could not be sent. Copy the personal link instead.",
    502,
  );
}

/**
 * Sends one invite email. The send window is consumed even when delivery
 * fails, because it caps repeated sends per invite; only the lock is released
 * so the organiser can retry. The raw token is never returned or logged.
 */
export async function sendInviteEmail(
  assessmentId: string,
  inviteId: string,
  options: SendInviteEmailOptions,
): Promise<SendInviteEmailResult> {
  const assessment = await loadOwnedAssessment(assessmentId, options.ownerId);
  if (!assessment.isPublished) {
    throw new ApiError(
      "ASSESSMENT_NOT_PUBLISHED",
      "Publish the assessment before sending invites.",
      409,
    );
  }
  if (assessment.endAt.getTime() <= Date.now()) {
    throw new ApiError("ASSESSMENT_ENDED", "This assessment has ended.", 410);
  }
  const existing = await getInviteById(assessmentId, inviteId, options.ownerId);
  if (!existing) throw errors.notFound("Invite not found.");
  if (!existing.email) {
    throw new ApiError(
      "INVITE_NO_EMAIL",
      "This candidate has no email on file. Copy the personal link instead.",
      409,
    );
  }

  const begun = await beginInviteSend(inviteId);
  if (!begun.acquired) {
    if (begun.reason === "NOT_FOUND") {
      throw errors.notFound("Invite not found.");
    }
    if (begun.reason === "NOT_SENDABLE") {
      throw new ApiError(
        "INVITE_NOT_SENDABLE",
        "This invite cannot be sent because it is claimed, revoked or expired.",
        409,
      );
    }
    if (begun.reason === "RATE_LIMITED") {
      throw new ApiError(
        "INVITE_SEND_RATE_LIMITED",
        "This invite has reached the send limit. Try again in an hour.",
        429,
      );
    }
    throw new ApiError(
      "INVITE_SEND_LOCKED",
      "A send is already in progress for this invite.",
      409,
    );
  }

  let token: string;
  try {
    ({ token } = await rotateInviteToken(inviteId, {
      ownerId: options.ownerId,
    }));
  } catch (error) {
    await releaseInviteSend(inviteId);
    throw error;
  }

  let sent: boolean;
  try {
    sent = await sendAssessmentInviteEmail({
      to: existing.email,
      candidateName: existing.candidateName,
      assessmentTitle: assessment.title,
      startAt: assessment.startAt,
      endAt: assessment.endAt,
      durationMinutes: assessment.durationMinutes,
      url: inviteUrl(assessment.slug, token),
    });
  } catch {
    await releaseInviteSend(inviteId);
    throw sendFailed();
  }

  if (!sent) {
    await releaseInviteSend(inviteId);
    throw sendFailed();
  }

  await recordInviteSend(inviteId);
  const invite = await getInviteById(assessmentId, inviteId, options.ownerId);
  if (!invite) throw errors.notFound("Invite not found.");
  return { invite, sent: true };
}
