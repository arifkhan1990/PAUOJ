import type { NextRequest } from "next/server";
import { assertSameOrigin, requireApiUser } from "@/server/api/auth";
import { enforceRateLimit } from "@/server/api/rate-limit";
import { apiCreated, apiError, apiOk } from "@/server/api/responses";
import { parseJson } from "@/server/api/validation";
import { contestStaffInviteSchema } from "@/lib/schemas/contest-ops";
import { getDb } from "@/server/db";
import { auditLogs } from "@/server/db/schema";
import { assertContestCrewAccess } from "@/server/services/contest-access";
import { addContestStaff, listContestStaff } from "@/server/services/contest-staff";

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireApiUser();
    const { id } = await context.params;
    await assertContestCrewAccess(id, user);
    return apiOk(await listContestStaff(id));
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    assertSameOrigin(request);
    const user = await requireApiUser();
    await enforceRateLimit(`contest:staff:add:${user.id}`, 30, 60);
    const { id } = await context.params;
    const input = await parseJson(request, contestStaffInviteSchema);
    const staff = await addContestStaff(user, id, input);
    await getDb().insert(auditLogs).values({
      actorId: user.id,
      action: "contest.staff_add",
      entityType: "contest",
      entityId: id,
      metadata: {
        staffId: staff.id,
        staffUserId: staff.userId,
        role: staff.role,
      },
    });
    return apiCreated(staff);
  } catch (error) {
    return apiError(error);
  }
}
