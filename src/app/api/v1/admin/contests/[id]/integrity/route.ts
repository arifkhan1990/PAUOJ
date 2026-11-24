import type { NextRequest } from "next/server";
import { requireApiUser } from "@/server/api/auth";
import { apiError, apiOk } from "@/server/api/responses";
import { assertContestCrewAccess } from "@/server/services/contest-access";
import { getContestIntegritySummary } from "@/server/services/contest-integrity-events";

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireApiUser();
    const { id } = await context.params;
    await assertContestCrewAccess(id, user);
    return apiOk(await getContestIntegritySummary(id));
  } catch (error) {
    return apiError(error);
  }
}
