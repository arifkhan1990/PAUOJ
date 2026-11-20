import type { NextRequest } from "next/server";
import { assertSameOrigin, requireApiUser } from "@/server/api/auth";
import { enforceRateLimit } from "@/server/api/rate-limit";
import { apiError, apiOk } from "@/server/api/responses";
import { parseJson } from "@/server/api/validation";
import { commentVoteSchema } from "@/lib/schemas/discussion";
import { voteProblemComment } from "@/server/services/discussions";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ slug: string; id: string }> },
) {
  try {
    assertSameOrigin(request);
    const user = await requireApiUser();
    await enforceRateLimit(`comment:vote:${user.id}`, 60, 60);
    const { slug, id } = await context.params;
    const input = await parseJson(request, commentVoteSchema);
    const result = await voteProblemComment(slug, user, id, input.value);
    return apiOk(result);
  } catch (error) {
    return apiError(error);
  }
}
