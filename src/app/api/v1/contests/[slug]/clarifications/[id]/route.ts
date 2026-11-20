import type { NextRequest } from "next/server";
import { assertSameOrigin, requireApiUser } from "@/server/api/auth";
import { enforceRateLimit } from "@/server/api/rate-limit";
import { apiError, apiOk } from "@/server/api/responses";
import { parseJson } from "@/server/api/validation";
import { clarificationAnswerSchema } from "@/lib/schemas/clarification";
import { answerContestClarification } from "@/server/services/contest-clarifications";

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ slug: string; id: string }> },
) {
  try {
    assertSameOrigin(request);
    const user = await requireApiUser();
    await enforceRateLimit(`clarification:answer:${user.id}`, 30, 60);
    const { slug, id } = await context.params;
    const input = await parseJson(request, clarificationAnswerSchema);
    const result = await answerContestClarification(slug, user, id, input);
    return apiOk(result);
  } catch (error) {
    return apiError(error);
  }
}
