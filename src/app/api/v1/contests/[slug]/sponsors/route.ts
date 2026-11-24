import type { NextRequest } from "next/server";
import { assertSameOrigin, requireApiUser } from "@/server/api/auth";
import { enforceRateLimit } from "@/server/api/rate-limit";
import { apiCreated, apiError } from "@/server/api/responses";
import { parseJson } from "@/server/api/validation";
import { contestSponsorRequestSchema } from "@/lib/schemas/contest-ops";
import { requestContestSponsorship } from "@/server/services/contest-sponsors";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> },
) {
  try {
    assertSameOrigin(request);
    const user = await requireApiUser();
    await enforceRateLimit(`contest:sponsor:request:${user.id}`, 5, 60 * 60);
    const { slug } = await context.params;
    const input = await parseJson(request, contestSponsorRequestSchema);
    return apiCreated(await requestContestSponsorship(user, slug, input));
  } catch (error) {
    return apiError(error);
  }
}
