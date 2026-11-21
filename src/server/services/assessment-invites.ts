import { and, asc, eq, ne, sql } from "drizzle-orm";
import { ApiError, errors } from "@/server/api/errors";
import { getDb } from "@/server/db";
import {
  assessmentInvites,
  assessments,
  type Assessment,
  type AssessmentInvite,
} from "@/server/db/schema";
import {
  effectiveInviteStatus,
  generateInviteToken,
  hashInviteToken,
  normaliseEmail,
  normaliseOptionalText,
  normaliseRef,
} from "@/lib/assessment-invites";
import type {
  AssessmentInviteDetail,
  AssessmentInviteSummary,
} from "@/lib/types";

export {
  markInviteOpened,
  resolveInviteToken,
} from "./assessment-invite-resolution";
export type { ResolvedInvite } from "./assessment-invite-resolution";
export {
  bindParticipantInvite,
  claimInviteRow,
  recordFailedClaim,
} from "./assessment-invite-claims";
export type { FailedClaimResult } from "./assessment-invite-claims";

export {
  CLAIM_FAIL_LIMIT,
  CLAIM_FAIL_WINDOW_MS,
  SEND_LOCK_MS,
  SEND_WINDOW_LIMIT,
  SEND_WINDOW_MS,
  advanceWindow,
  decideClaim,
  effectiveInviteStatus,
  generateInviteToken,
  hashInviteToken,
  isClaimThrottled,
  isWindowFull,
  normaliseEmail,
  normaliseRef,
  normaliseOptionalText,
  refsMatch,
} from "@/lib/assessment-invites";
export type {
  ClaimDecision,
  ClaimDecisionInput,
  ClaimRefusalReason,
  WindowState,
} from "@/lib/assessment-invites";

function toSummary(
  invite: AssessmentInvite,
  assessment: Assessment,
): AssessmentInviteSummary {
  return {
    id: invite.id,
    candidateRef: invite.candidateRef,
    email: invite.email,
    groupLabel: invite.groupLabel,
    candidateName: invite.candidateName,
    status: effectiveInviteStatus(invite, assessment),
    sentAt: invite.sentAt?.toISOString() ?? null,
    lastSentAt: invite.lastSentAt?.toISOString() ?? null,
    sendCount: invite.sendCount,
    failedClaimCount: invite.failedClaimCount,
    claimedAt: invite.claimedAt?.toISOString() ?? null,
    claimedAssurance: invite.claimedAssurance,
    createdAt: invite.createdAt.toISOString(),
  };
}

function toDetail(
  invite: AssessmentInvite,
  assessment: Assessment,
): AssessmentInviteDetail {
  return {
    ...toSummary(invite, assessment),
    assessmentId: invite.assessmentId,
    sendWindowStartedAt: invite.sendWindowStartedAt?.toISOString() ?? null,
    sendWindowCount: invite.sendWindowCount,
    claimFailWindowStartedAt:
      invite.claimFailWindowStartedAt?.toISOString() ?? null,
    claimFailWindowCount: invite.claimFailWindowCount,
    lastFailedClaimAt: invite.lastFailedClaimAt?.toISOString() ?? null,
    updatedAt: invite.updatedAt.toISOString(),
  };
}

export async function loadOwnedAssessment(
  assessmentId: string,
  ownerId?: string,
): Promise<Assessment> {
  const [assessment] = await getDb()
    .select()
    .from(assessments)
    .where(
      and(
        eq(assessments.id, assessmentId),
        ownerId ? eq(assessments.createdBy, ownerId) : undefined,
      ),
    )
    .limit(1);
  if (!assessment) throw errors.notFound("Assessment not found.");
  return assessment;
}

function refWhere(assessmentId: string, candidateRef: string) {
  return and(
    eq(assessmentInvites.assessmentId, assessmentId),
    sql`upper(btrim(${assessmentInvites.candidateRef})) = ${normaliseRef(candidateRef).toUpperCase()}`,
  );
}

function emailWhere(assessmentId: string, email: string) {
  return and(
    eq(assessmentInvites.assessmentId, assessmentId),
    sql`lower(${assessmentInvites.email}) = ${email}`,
  );
}

function duplicateEmailError(): ApiError {
  return new ApiError(
    "INVITE_EMAIL_TAKEN",
    "Another candidate in this assessment already uses that email. Leave the email blank and deliver by link.",
    409,
  );
}

export type CreateInviteInput = {
  candidateRef: string;
  email?: string | null;
  groupLabel?: string | null;
  candidateName?: string | null;
};

export type CreateInviteOptions = {
  ownerId?: string;
  actorId?: string;
};

export type CreateInviteResult = {
  invite: AssessmentInviteDetail;
  token: string | null;
  created: boolean;
  updated: boolean;
};

async function syncExistingInvite(
  assessment: Assessment,
  existing: AssessmentInvite,
  email: string | null,
  input: CreateInviteInput,
): Promise<CreateInviteResult> {
  const groupLabel = normaliseOptionalText(input.groupLabel);
  const candidateName = normaliseOptionalText(input.candidateName);
  const unchanged =
    existing.email === email &&
    existing.groupLabel === groupLabel &&
    existing.candidateName === candidateName;
  if (unchanged) {
    return {
      invite: toDetail(existing, assessment),
      token: null,
      created: false,
      updated: false,
    };
  }

  if (email) {
    const [emailTaken] = await getDb()
      .select({ id: assessmentInvites.id })
      .from(assessmentInvites)
      .where(
        and(
          emailWhere(existing.assessmentId, email),
          ne(assessmentInvites.id, existing.id),
        ),
      )
      .limit(1);
    if (emailTaken) throw duplicateEmailError();
  }

  const [row] = await getDb()
    .update(assessmentInvites)
    .set({ email, groupLabel, candidateName, updatedAt: new Date() })
    .where(eq(assessmentInvites.id, existing.id))
    .returning();
  return {
    invite: toDetail(row ?? existing, assessment),
    token: null,
    created: false,
    updated: true,
  };
}

export async function createInvite(
  assessmentId: string,
  input: CreateInviteInput,
  options: CreateInviteOptions = {},
): Promise<CreateInviteResult> {
  const assessment = await loadOwnedAssessment(assessmentId, options.ownerId);
  const candidateRef = normaliseRef(input.candidateRef ?? "");
  if (!candidateRef) {
    throw errors.validation("candidate_ref is required.");
  }
  const email = normaliseEmail(input.email);
  const db = getDb();

  const [existing] = await db
    .select()
    .from(assessmentInvites)
    .where(refWhere(assessmentId, candidateRef))
    .limit(1);
  if (existing) {
    return syncExistingInvite(assessment, existing, email, input);
  }

  if (email) {
    const [emailTaken] = await db
      .select({ id: assessmentInvites.id })
      .from(assessmentInvites)
      .where(emailWhere(assessmentId, email))
      .limit(1);
    if (emailTaken) throw duplicateEmailError();
  }

  const token = generateInviteToken();
  const [created] = await db
    .insert(assessmentInvites)
    .values({
      assessmentId,
      candidateRef,
      email,
      groupLabel: normaliseOptionalText(input.groupLabel),
      candidateName: normaliseOptionalText(input.candidateName),
      tokenHash: hashInviteToken(token),
      createdBy: options.actorId ?? options.ownerId ?? null,
    })
    .onConflictDoNothing()
    .returning();
  if (created) {
    return {
      invite: toDetail(created, assessment),
      token,
      created: true,
      updated: false,
    };
  }

  const [raced] = await db
    .select()
    .from(assessmentInvites)
    .where(refWhere(assessmentId, candidateRef))
    .limit(1);
  if (raced) {
    return syncExistingInvite(assessment, raced, email, input);
  }
  throw duplicateEmailError();
}

export async function createInvites(
  assessmentId: string,
  inputs: CreateInviteInput[],
  options: CreateInviteOptions = {},
): Promise<CreateInviteResult[]> {
  const results: CreateInviteResult[] = [];
  for (const input of inputs) {
    results.push(await createInvite(assessmentId, input, options));
  }
  return results;
}

export async function listInvites(
  assessmentId: string,
  ownerId?: string,
): Promise<AssessmentInviteSummary[]> {
  const assessment = await loadOwnedAssessment(assessmentId, ownerId);
  const rows = await getDb()
    .select()
    .from(assessmentInvites)
    .where(eq(assessmentInvites.assessmentId, assessmentId))
    .orderBy(
      sql`${assessmentInvites.groupLabel} asc nulls first`,
      asc(assessmentInvites.candidateRef),
    );
  return rows.map((row) => toSummary(row, assessment));
}

export async function getInviteById(
  assessmentId: string,
  inviteId: string,
  ownerId?: string,
): Promise<AssessmentInviteDetail | null> {
  const assessment = await loadOwnedAssessment(assessmentId, ownerId);
  const [invite] = await getDb()
    .select()
    .from(assessmentInvites)
    .where(
      and(
        eq(assessmentInvites.assessmentId, assessmentId),
        eq(assessmentInvites.id, inviteId),
      ),
    )
    .limit(1);
  return invite ? toDetail(invite, assessment) : null;
}

export type RotateInviteTokenOptions = { ownerId?: string };

export async function rotateInviteToken(
  inviteId: string,
  options: RotateInviteTokenOptions = {},
): Promise<{ invite: AssessmentInviteDetail; token: string }> {
  const [existing] = await getDb()
    .select()
    .from(assessmentInvites)
    .where(eq(assessmentInvites.id, inviteId))
    .limit(1);
  if (!existing) throw errors.notFound("Invite not found.");
  const assessment = await loadOwnedAssessment(
    existing.assessmentId,
    options.ownerId,
  );
  if (existing.status === "CLAIMED") {
    throw new ApiError(
      "INVITE_CLAIMED",
      "This invite has already been claimed and cannot be re-issued.",
      409,
    );
  }
  if (existing.status === "REVOKED") {
    throw new ApiError(
      "INVITE_REVOKED",
      "This invite has been revoked and cannot be re-issued.",
      409,
    );
  }

  // Rotation replaces the hash, so the previously issued link stops working.
  const token = generateInviteToken();
  const [row] = await getDb()
    .update(assessmentInvites)
    .set({
      tokenHash: hashInviteToken(token),
      status: "UNSENT",
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(assessmentInvites.id, inviteId),
        ne(assessmentInvites.status, "CLAIMED"),
        ne(assessmentInvites.status, "REVOKED"),
      ),
    )
    .returning();
  if (!row) {
    throw new ApiError(
      "INVITE_NOT_ROTATABLE",
      "This invite can no longer be re-issued.",
      409,
    );
  }
  return { invite: toDetail(row, assessment), token };
}

/** Revokes an invite; a claimed participant row is never deleted. */
export async function revokeInvite(
  inviteId: string,
  options: { ownerId?: string } = {},
): Promise<AssessmentInviteDetail> {
  const [existing] = await getDb()
    .select()
    .from(assessmentInvites)
    .where(eq(assessmentInvites.id, inviteId))
    .limit(1);
  if (!existing) throw errors.notFound("Invite not found.");
  const assessment = await loadOwnedAssessment(
    existing.assessmentId,
    options.ownerId,
  );
  if (existing.status === "REVOKED") return toDetail(existing, assessment);
  const [row] = await getDb()
    .update(assessmentInvites)
    .set({ status: "REVOKED", sendLockAt: null, updatedAt: new Date() })
    .where(eq(assessmentInvites.id, inviteId))
    .returning();
  return toDetail(row ?? existing, assessment);
}