import type { NextRequest } from "next/server";
import { assertSameOrigin, requireApiStaff } from "@/server/api/auth";
import { errors } from "@/server/api/errors";
import { apiError, apiOk } from "@/server/api/responses";
import { getDb } from "@/server/db";
import { auditLogs } from "@/server/db/schema";
import {
  getInviteById,
  revokeInvite,
} from "@/server/services/assessment-invites";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string; inviteId: string }> },
) {
  try {
    assertSameOrigin(request);
    const staff = await requireApiStaff();
    const { id, inviteId } = await context.params;
    const ownerId = staff.role === "TEACHER" ? staff.id : undefined;

    // Check the invite belongs to this assessment before revoking, so the
    // audit row cannot name a different assessment than the path.
    const existing = await getInviteById(id, inviteId, ownerId);
    if (!existing) throw errors.notFound("Invite not found.");

    const invite = await revokeInvite(inviteId, { ownerId });
    await getDb().insert(auditLogs).values({
      actorId: staff.id,
      action: "assessment.invite.revoke",
      entityType: "assessment_invite",
      entityId: inviteId,
      metadata: { assessmentId: id },
    });

    return apiOk({ invite });
  } catch (error) {
    return apiError(error);
  }
}
