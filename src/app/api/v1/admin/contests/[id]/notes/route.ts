import type { NextRequest } from "next/server";
import { assertSameOrigin, requireApiUser } from "@/server/api/auth";
import { enforceRateLimit } from "@/server/api/rate-limit";
import { apiCreated, apiError, apiOk } from "@/server/api/responses";
import { parseJson } from "@/server/api/validation";
import { contestStaffNoteSchema } from "@/lib/schemas/contest-ops";
import { assertContestCrewAccess } from "@/server/services/contest-access";
import {
  addContestStaffNote,
  listContestStaffNotes,
} from "@/server/services/contest-staff";

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireApiUser();
    const { id } = await context.params;
    await assertContestCrewAccess(id, user);
    return apiOk(await listContestStaffNotes(id));
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
    await enforceRateLimit(`contest:note:add:${user.id}`, 30, 60);
    const { id } = await context.params;
    const input = await parseJson(request, contestStaffNoteSchema);
    return apiCreated(await addContestStaffNote(user, id, input));
  } catch (error) {
    return apiError(error);
  }
}
