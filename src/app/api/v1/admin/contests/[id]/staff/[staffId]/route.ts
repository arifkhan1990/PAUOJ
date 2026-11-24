import type { NextRequest } from "next/server";
import { assertSameOrigin, requireApiUser } from "@/server/api/auth";
import { enforceRateLimit } from "@/server/api/rate-limit";
import { apiError, apiOk } from "@/server/api/responses";
import { getDb } from "@/server/db";
import { auditLogs } from "@/server/db/schema";
import { removeContestStaff } from "@/server/services/contest-staff";

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string; staffId: string }> },
) {
  try {
    assertSameOrigin(request);
    const user = await requireApiUser();
    await enforceRateLimit(`contest:staff:remove:${user.id}`, 30, 60);
    const { id, staffId } = await context.params;
    await removeContestStaff(user, id, staffId);
    await getDb().insert(auditLogs).values({
      actorId: user.id,
      action: "contest.staff_remove",
      entityType: "contest",
      entityId: id,
      metadata: { staffId },
    });
    return apiOk({ removed: true });
  } catch (error) {
    return apiError(error);
  }
}
