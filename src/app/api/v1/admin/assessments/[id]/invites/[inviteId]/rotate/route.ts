import type { NextRequest } from "next/server";
import { assertSameOrigin, requireApiStaff } from "@/server/api/auth";
import { errors } from "@/server/api/errors";
import { apiError, apiOk } from "@/server/api/responses";
import { getDb } from "@/server/db";
import { auditLogs } from "@/server/db/schema";
import {
  getInviteById,
  rotateInviteToken,
} from "@/server/services/assessment-invites";

// The response carries a live token once, so it must not be stored by any
// proxy or browser cache.
const NO_STORE_HEADERS: Record<string, string> = {
  "Cache-Control": "no-store",
  Pragma: "no-cache",
};

function withNoStore<T extends Response>(response: T): T {
  for (const [key, value] of Object.entries(NO_STORE_HEADERS)) {
    response.headers.set(key, value);
  }
  return response;
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string; inviteId: string }> },
) {
  try {
    assertSameOrigin(request);
    const staff = await requireApiStaff();
    const { id, inviteId } = await context.params;
    const ownerId = staff.role === "TEACHER" ? staff.id : undefined;

    // Check the invite belongs to this assessment before rotating, because
    // rotation replaces the token and would otherwise succeed across paths.
    const existing = await getInviteById(id, inviteId, ownerId);
    if (!existing) throw errors.notFound("Invite not found.");

    const { invite, token } = await rotateInviteToken(inviteId, { ownerId });
    await getDb().insert(auditLogs).values({
      actorId: staff.id,
      action: "assessment.invite.rotate",
      entityType: "assessment_invite",
      entityId: inviteId,
      metadata: { assessmentId: id },
    });

    return withNoStore(apiOk({ invite, token }));
  } catch (error) {
    return withNoStore(apiError(error));
  }
}
