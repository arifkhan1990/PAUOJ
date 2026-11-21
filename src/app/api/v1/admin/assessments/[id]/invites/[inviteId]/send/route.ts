import type { NextRequest } from "next/server";
import { assertSameOrigin, requireApiStaff } from "@/server/api/auth";
import { apiError, apiOk } from "@/server/api/responses";
import { getDb } from "@/server/db";
import { auditLogs } from "@/server/db/schema";
import { sendInviteEmail } from "@/server/services/assessment-invite-send";

// The response reflects roster state that includes a candidate email; do not
// let a proxy or browser cache it.
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
    const result = await sendInviteEmail(id, inviteId, {
      ownerId: staff.role === "TEACHER" ? staff.id : undefined,
      actorId: staff.id,
    });

    await getDb().insert(auditLogs).values({
      actorId: staff.id,
      action: "assessment.invite.send",
      entityType: "assessment_invite",
      entityId: inviteId,
      metadata: { assessmentId: id, sent: result.sent },
    });

    // Never echo the recipient address or the link/token in a send response.
    return withNoStore(
      apiOk({ invite: { ...result.invite, email: null }, sent: result.sent }),
    );
  } catch (error) {
    return withNoStore(apiError(error));
  }
}
