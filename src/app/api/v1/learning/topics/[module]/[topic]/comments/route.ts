import type { NextRequest } from "next/server";
import {
  assertSameOrigin,
  optionalApiUser,
  requireApiUser,
} from "@/server/api/auth";
import { enforceRateLimit } from "@/server/api/rate-limit";
import { apiCreated, apiError, apiOk } from "@/server/api/responses";
import { pageMeta, parseJson, parseQuery } from "@/server/api/validation";
import {
  commentListQuerySchema,
  createCommentSchema,
} from "@/lib/schemas/discussion";
import { LESSON_DISCUSSION_PAGE_SIZE } from "@/lib/learning/social";
import { listLessonComments } from "@/server/services/lesson-discussions";
import { createLessonComment } from "@/server/services/lesson-comment-mutations";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ module: string; topic: string }> },
) {
  try {
    const { module, topic } = await context.params;
    const query = parseQuery(request, commentListQuerySchema);
    const viewer = await optionalApiUser();
    const result = await listLessonComments(module, topic, viewer, query.page);
    return apiOk(
      result.items,
      pageMeta(result.total, {
        page: query.page,
        pageSize: LESSON_DISCUSSION_PAGE_SIZE,
      }),
    );
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ module: string; topic: string }> },
) {
  try {
    assertSameOrigin(request);
    const user = await requireApiUser();
    await enforceRateLimit(`lesson:comment:create:${user.id}`, 5, 60);
    const { module, topic } = await context.params;
    const input = await parseJson(request, createCommentSchema);
    const comment = await createLessonComment(module, topic, user, input);
    return apiCreated(comment);
  } catch (error) {
    return apiError(error);
  }
}
