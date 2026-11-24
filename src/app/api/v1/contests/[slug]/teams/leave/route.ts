import type { NextRequest } from "next/server";
import { assertSameOrigin, requireApiUser } from "@/server/api/auth";
import { enforceRateLimit } from "@/server/api/rate-limit";
import { apiError, apiOk } from "@/server/api/responses";
import { leaveContestTeam } from "@/server/services/contest-teams";

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> },
) {
  try {
    assertSameOrigin(request);
    const user = await requireApiUser();
    await enforceRateLimit(`contest:team:leave:${user.id}`, 10, 60);
    const { slug } = await context.params;
    await leaveContestTeam(slug, user.id);
    return apiOk({ left: true });
  } catch (error) {
    return apiError(error);
  }
}
