import { and, eq, isNull, ne, sql } from "drizzle-orm";
import { getDb } from "@/server/db";
import {
  assessmentInvites,
  assessmentParticipants,
  assessments,
  type AssessmentInvite,
  type AssessmentParticipant,
} from "@/server/db/schema";
import {
  CLAIM_FAIL_WINDOW_MS,
  isClaimThrottled,
} from "@/lib/assessment-invites";
import type { AssessmentClaimAssurance } from "@/lib/types";

/**
 * Atomically claims an invite for a user. Returns null when another request
 * already claimed, revoked or expired it, or when the assessment ended between
 * the caller's phase check and this write (the caller maps that to 409/410).
 */
export async function claimInviteRow(
  inviteId: string,
  userId: string,
  assurance: AssessmentClaimAssurance,
  now: Date = new Date(),
): Promise<AssessmentInvite | null> {
  // The end-time guard closes the resolve/write race: without it an assessment
  // could end after the phase check and the claim would still bind.
  // ISO strings, not Date objects: postgres.js cannot bind a Date inside a raw
  // SQL fragment (it expects a string/Buffer) and throws at runtime.
  const assessmentRunning = sql`exists (select 1 from ${assessments} where ${assessments.id} = ${assessmentInvites.assessmentId} and ${assessments.endAt} > ${now.toISOString()})`;
  const [row] = await getDb()
    .update(assessmentInvites)
    .set({
      status: "CLAIMED",
      claimedByUserId: userId,
      claimedAt: now,
      claimedAssurance: assurance,
      updatedAt: now,
    })
    .where(
      and(
        eq(assessmentInvites.id, inviteId),
        ne(assessmentInvites.status, "CLAIMED"),
        ne(assessmentInvites.status, "REVOKED"),
        ne(assessmentInvites.status, "EXPIRED"),
        isNull(assessmentInvites.claimedByUserId),
        assessmentRunning,
      ),
    )
    .returning();
  return row ?? null;
}

/**
 * Binds an existing participant (joined earlier by code) to an invite without
 * touching its timer. Only binds when the participant is not bound yet.
 */
export async function bindParticipantInvite(
  assessmentId: string,
  userId: string,
  inviteId: string,
  assurance: AssessmentClaimAssurance,
): Promise<AssessmentParticipant | null> {
  const [row] = await getDb()
    .update(assessmentParticipants)
    .set({ inviteId, assurance })
    .where(
      and(
        eq(assessmentParticipants.assessmentId, assessmentId),
        eq(assessmentParticipants.userId, userId),
        isNull(assessmentParticipants.inviteId),
      ),
    )
    .returning();
  return row ?? null;
}

export type FailedClaimResult = {
  windowCount: number;
  failedClaimCount: number;
  throttled: boolean;
};

/**
 * Increments the failed-claim counters in one statement. The window allows
 * CLAIM_FAIL_LIMIT attempts per 15 minutes; the next one reports throttled.
 */
export async function recordFailedClaim(
  inviteId: string,
  now: Date = new Date(),
): Promise<FailedClaimResult | null> {
  const cutoff = new Date(now.getTime() - CLAIM_FAIL_WINDOW_MS);
  const nowIso = now.toISOString();
  const windowExpired = sql`(${assessmentInvites.claimFailWindowStartedAt} is null or ${assessmentInvites.claimFailWindowStartedAt} <= ${cutoff.toISOString()})`;
  const [row] = await getDb()
    .update(assessmentInvites)
    .set({
      failedClaimCount: sql`${assessmentInvites.failedClaimCount} + 1`,
      lastFailedClaimAt: now,
      claimFailWindowCount: sql`case when ${windowExpired} then 1 else ${assessmentInvites.claimFailWindowCount} + 1 end`,
      claimFailWindowStartedAt: sql`case when ${windowExpired} then ${nowIso} else ${assessmentInvites.claimFailWindowStartedAt} end`,
      updatedAt: now,
    })
    .where(eq(assessmentInvites.id, inviteId))
    .returning({
      windowCount: assessmentInvites.claimFailWindowCount,
      failedClaimCount: assessmentInvites.failedClaimCount,
    });
  if (!row) return null;
  return {
    windowCount: row.windowCount,
    failedClaimCount: row.failedClaimCount,
    throttled: isClaimThrottled(row.windowCount),
  };
}
