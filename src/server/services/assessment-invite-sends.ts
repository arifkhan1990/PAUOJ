import { and, eq, inArray, sql } from "drizzle-orm";
import { getDb } from "@/server/db";
import { assessmentInvites, type AssessmentInvite } from "@/server/db/schema";
import {
  SEND_LOCK_MS,
  SEND_WINDOW_LIMIT,
  SEND_WINDOW_MS,
  isWindowFull,
} from "@/lib/assessment-invites";
import type { AssessmentInviteStatus } from "@/lib/types";

export type BeginInviteSendFailure =
  | "NOT_FOUND"
  | "LOCKED"
  | "RATE_LIMITED"
  | "NOT_SENDABLE";

export type BeginInviteSendResult =
  | { acquired: true; invite: AssessmentInvite }
  | { acquired: false; reason: BeginInviteSendFailure };

/**
 * Acquires the per-invite send lock and consumes one slot of the hourly DB
 * window in a single conditional statement. E3 calls this before sending mail.
 */
export async function beginInviteSend(
  inviteId: string,
  now: Date = new Date(),
): Promise<BeginInviteSendResult> {
  const lockCutoff = new Date(now.getTime() - SEND_LOCK_MS);
  const windowCutoff = new Date(now.getTime() - SEND_WINDOW_MS);
  // Raw SQL params must be ISO strings; postgres.js rejects Date instances.
  const nowIso = now.toISOString();
  const windowExpired = sql`(${assessmentInvites.sendWindowStartedAt} is null or ${assessmentInvites.sendWindowStartedAt} <= ${windowCutoff.toISOString()})`;
  const [row] = await getDb()
    .update(assessmentInvites)
    .set({
      sendLockAt: now,
      sendWindowCount: sql`case when ${windowExpired} then 1 else ${assessmentInvites.sendWindowCount} + 1 end`,
      sendWindowStartedAt: sql`case when ${windowExpired} then ${nowIso} else ${assessmentInvites.sendWindowStartedAt} end`,
      updatedAt: now,
    })
    .where(
      and(
        eq(assessmentInvites.id, inviteId),
        inArray(assessmentInvites.status, ["UNSENT", "SENT", "OPENED"]),
        sql`(${assessmentInvites.sendLockAt} is null or ${assessmentInvites.sendLockAt} <= ${lockCutoff.toISOString()})`,
        sql`(${windowExpired} or ${assessmentInvites.sendWindowCount} < ${SEND_WINDOW_LIMIT})`,
      ),
    )
    .returning();
  if (row) return { acquired: true, invite: row };

  const [current] = await getDb()
    .select({
      status: assessmentInvites.status,
      sendLockAt: assessmentInvites.sendLockAt,
      sendWindowStartedAt: assessmentInvites.sendWindowStartedAt,
      sendWindowCount: assessmentInvites.sendWindowCount,
    })
    .from(assessmentInvites)
    .where(eq(assessmentInvites.id, inviteId))
    .limit(1);
  if (!current) return { acquired: false, reason: "NOT_FOUND" };
  if (
    current.status === "CLAIMED" ||
    current.status === "REVOKED" ||
    current.status === "EXPIRED"
  ) {
    return { acquired: false, reason: "NOT_SENDABLE" };
  }
  if (current.sendLockAt && current.sendLockAt > lockCutoff) {
    return { acquired: false, reason: "LOCKED" };
  }
  if (
    isWindowFull(
      {
        startedAt: current.sendWindowStartedAt,
        count: current.sendWindowCount,
      },
      now,
      SEND_WINDOW_MS,
      SEND_WINDOW_LIMIT,
    )
  ) {
    return { acquired: false, reason: "RATE_LIMITED" };
  }
  return { acquired: false, reason: "LOCKED" };
}

/**
 * Records a successful delivery: bumps counters, sets SENT, clears the lock.
 * OPENED/CLAIMED/REVOKED/EXPIRED states are preserved.
 */
export async function recordInviteSend(
  inviteId: string,
  now: Date = new Date(),
): Promise<AssessmentInvite | null> {
  const [row] = await getDb()
    .update(assessmentInvites)
    .set({
      status: sql<AssessmentInviteStatus>`case when ${assessmentInvites.status} in ('OPENED', 'CLAIMED', 'REVOKED', 'EXPIRED') then ${assessmentInvites.status} else 'SENT' end`,
      sentAt: sql`coalesce(${assessmentInvites.sentAt}, ${now.toISOString()})`,
      lastSentAt: now,
      sendCount: sql`${assessmentInvites.sendCount} + 1`,
      sendLockAt: null,
      updatedAt: now,
    })
    .where(eq(assessmentInvites.id, inviteId))
    .returning();
  return row ?? null;
}

/**
 * Releases the send lock after a failed attempt so the organiser can retry.
 */
export async function releaseInviteSend(
  inviteId: string,
  now: Date = new Date(),
): Promise<void> {
  await getDb()
    .update(assessmentInvites)
    .set({ sendLockAt: null, updatedAt: now })
    .where(eq(assessmentInvites.id, inviteId));
}
