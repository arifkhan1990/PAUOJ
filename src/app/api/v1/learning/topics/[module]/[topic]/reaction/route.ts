import type { NextRequest } from "next/server";
import { assertSameOrigin, requireApiUser } from "@/server/api/auth";
import { enforceRateLimit } from "@/server/api/rate-limit";
import { apiError, apiOk } from "@/server/api/responses";
import { parseJson } from "@/server/api/validation";
import { lessonReactionSchema } from "@/lib/schemas/lesson-reaction";
import { setLessonReaction } from "@/server/services/lesson-discussions";

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ module: string; topic: string }> },
) {
  try {
    assertSameOrigin(request);
    const user = await requireApiUser();
    await enforceRateLimit(`lesson:reaction:${user.id}`, 20, 60);
    const { module, topic } = await context.params;
    const input = await parseJson(request, lessonReactionSchema);
    return apiOk(await setLessonReaction(module, topic, user, input.value));
  } catch (error) {
    return apiError(error);
  }
}
