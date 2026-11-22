import type { NextRequest } from "next/server";
import { assertSameOrigin, requireApiUser } from "@/server/api/auth";
import { enforceRateLimit } from "@/server/api/rate-limit";
import { apiCreated, apiError } from "@/server/api/responses";
import { parseJson } from "@/server/api/validation";
import { reportCommentSchema } from "@/lib/schemas/lesson-report";
import { reportLessonComment } from "@/server/services/lesson-moderation";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ module: string; topic: string; id: string }> },
) {
  try {
    assertSameOrigin(request);
    const user = await requireApiUser();
    await enforceRateLimit(`lesson:comment:report:${user.id}`, 5, 60);
    const { module, topic, id } = await context.params;
    const input = await parseJson(request, reportCommentSchema);
    await reportLessonComment(module, topic, user, id, input.reason);
    return apiCreated({ reported: true });
  } catch (error) {
    return apiError(error);
  }
}
