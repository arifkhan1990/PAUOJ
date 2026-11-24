import type { NextRequest } from "next/server";
import { assertSameOrigin, requireApiUser } from "@/server/api/auth";
import { enforceRateLimit } from "@/server/api/rate-limit";
import { apiError, apiOk } from "@/server/api/responses";
import { parseJson } from "@/server/api/validation";
import { contestTeamInviteDecisionSchema } from "@/lib/schemas/contest-ops";
import {
  cancelContestTeamInvite,
  respondContestTeamInvite,
} from "@/server/services/contest-team-invite-response";

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ slug: string; inviteId: string }> },
) {
  try {
    assertSameOrigin(request);
    const user = await requireApiUser();
    await enforceRateLimit(`contest:team:invite:reply:${user.id}`, 20, 60);
    const { slug, inviteId } = await context.params;
    const input = await parseJson(request, contestTeamInviteDecisionSchema);
    const invite = await respondContestTeamInvite(
      slug,
      user.id,
      inviteId,
      input.action,
    );
    return apiOk({ invite });
  } catch (error) {
    return apiError(error);
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ slug: string; inviteId: string }> },
) {
  try {
    assertSameOrigin(request);
    const user = await requireApiUser();
    await enforceRateLimit(`contest:team:invite:cancel:${user.id}`, 20, 60);
    const { slug, inviteId } = await context.params;
    const invite = await cancelContestTeamInvite(slug, user.id, inviteId);
    return apiOk({ status: invite.status });
  } catch (error) {
    return apiError(error);
  }
}
