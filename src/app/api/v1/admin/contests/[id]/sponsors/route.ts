import type { NextRequest } from "next/server";
import { requireApiUser } from "@/server/api/auth";
import { apiError, apiOk } from "@/server/api/responses";
import { assertContestCrewAccess } from "@/server/services/contest-access";
import { getContestOperationsDetail } from "@/server/services/contest-operations-queries";

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireApiUser();
    const { id } = await context.params;
    await assertContestCrewAccess(id, user);
    const detail = await getContestOperationsDetail(id);
    return apiOk(detail.sponsors);
  } catch (error) {
    return apiError(error);
  }
}
