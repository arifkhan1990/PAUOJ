import type { NextRequest } from "next/server";
import { assertSameOrigin, requireApiUser } from "@/server/api/auth";
import { enforceRateLimit } from "@/server/api/rate-limit";
import { apiError, apiOk } from "@/server/api/responses";
import { parseJson } from "@/server/api/validation";
import { contestTeamJoinSchema } from "@/lib/schemas/contest-ops";
import { joinContestTeam } from "@/server/services/contest-teams";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> },
) {
  try {
    assertSameOrigin(request);
    const user = await requireApiUser();
    await enforceRateLimit(`contest:team:join:${user.id}`, 10, 60);
    const { slug } = await context.params;
    const input = await parseJson(request, contestTeamJoinSchema);
    const team = await joinContestTeam(slug, user.id, input.inviteCode);
    return apiOk(team);
  } catch (error) {
    return apiError(error);
  }
}
