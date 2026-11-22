import type { NextRequest } from "next/server";
import { assertSameOrigin, requireApiUser } from "@/server/api/auth";
import { enforceRateLimit } from "@/server/api/rate-limit";
import { apiError, apiOk } from "@/server/api/responses";
import { parseJson } from "@/server/api/validation";
import { commentVoteSchema } from "@/lib/schemas/discussion";
import { voteLessonComment } from "@/server/services/lesson-comment-mutations";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ module: string; topic: string; id: string }> },
) {
  try {
    assertSameOrigin(request);
    const user = await requireApiUser();
    await enforceRateLimit(`lesson:comment:vote:${user.id}`, 30, 60);
    const { module, topic, id } = await context.params;
    const input = await parseJson(request, commentVoteSchema);
    return apiOk(await voteLessonComment(module, topic, user, id, input.value));
  } catch (error) {
    return apiError(error);
  }
}
