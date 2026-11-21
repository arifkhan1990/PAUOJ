import { and, eq, inArray } from "drizzle-orm";
import { getDb } from "@/server/db";
import {
  assessmentInvites,
  assessments,
  type Assessment,
  type AssessmentInvite,
} from "@/server/db/schema";
import {
  effectiveInviteStatus,
  hashInviteToken,
} from "@/lib/assessment-invites";
import type { AssessmentInviteStatus } from "@/lib/types";

export type ResolvedInvite = {
  invite: AssessmentInvite;
  assessment: Assessment;
  status: AssessmentInviteStatus;
};

export async function resolveInviteToken(
  token: string,
): Promise<ResolvedInvite | null> {
  if (!token || token.length > 500) return null;
  const [row] = await getDb()
    .select({ invite: assessmentInvites, assessment: assessments })
    .from(assessmentInvites)
    .innerJoin(assessments, eq(assessments.id, assessmentInvites.assessmentId))
    .where(eq(assessmentInvites.tokenHash, hashInviteToken(token)))
    .limit(1);
  if (!row) return null;
  return {
    invite: row.invite,
    assessment: row.assessment,
    status: effectiveInviteStatus(row.invite, row.assessment),
  };
}

export async function markInviteOpened(
  inviteId: string,
  now: Date = new Date(),
): Promise<boolean> {
  const rows = await getDb()
    .update(assessmentInvites)
    .set({ status: "OPENED", updatedAt: now })
    .where(
      and(
        eq(assessmentInvites.id, inviteId),
        inArray(assessmentInvites.status, ["UNSENT", "SENT"]),
      ),
    )
    .returning({ id: assessmentInvites.id });
  return rows.length > 0;
}

