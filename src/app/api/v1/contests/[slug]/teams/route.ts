import type { NextRequest } from "next/server";
import { assertSameOrigin, requireApiUser } from "@/server/api/auth";
import { enforceRateLimit } from "@/server/api/rate-limit";
import { apiCreated, apiError } from "@/server/api/responses";
import { parseJson } from "@/server/api/validation";
import { contestTeamCreateSchema } from "@/lib/schemas/contest-ops";
import { createContestTeam } from "@/server/services/contest-teams";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> },
) {
  try {
    assertSameOrigin(request);
    const user = await requireApiUser();
    await enforceRateLimit(`contest:team:create:${user.id}`, 10, 60);
    const { slug } = await context.params;
    const input = await parseJson(request, contestTeamCreateSchema);
    const team = await createContestTeam(slug, user.id, input.name);
    return apiCreated(team);
  } catch (error) {
    return apiError(error);
  }
}
