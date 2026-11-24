import type { NextRequest } from "next/server";
import { assertSameOrigin, requireApiUser } from "@/server/api/auth";
import { enforceRateLimit } from "@/server/api/rate-limit";
import { apiCreated, apiError } from "@/server/api/responses";
import { parseJson } from "@/server/api/validation";
import { contestTeamInviteSchema } from "@/lib/schemas/contest-ops";
import { inviteContestTeamMember } from "@/server/services/contest-team-invites";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> },
) {
  try {
    assertSameOrigin(request);
    const user = await requireApiUser();
    await enforceRateLimit(`contest:team:invite:${user.id}`, 10, 60);
    const { slug } = await context.params;
    const input = await parseJson(request, contestTeamInviteSchema);
    const invite = await inviteContestTeamMember(slug, user.id, input.username);
    return apiCreated({ invite });
  } catch (error) {
    return apiError(error);
  }
}
