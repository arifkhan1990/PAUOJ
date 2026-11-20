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
import {
  DISCUSSION_PAGE_SIZE,
  createProblemComment,
  listProblemComments,
} from "@/server/services/discussions";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await context.params;
    const query = parseQuery(request, commentListQuerySchema);
    const viewer = await optionalApiUser();
    const result = await listProblemComments(slug, viewer, query.page, query.sort);
    return apiOk(
      result.items,
      pageMeta(result.total, {
        page: query.page,
        pageSize: DISCUSSION_PAGE_SIZE,
      }),
    );
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> },
) {
  try {
    assertSameOrigin(request);
    const user = await requireApiUser();
    await enforceRateLimit(`comment:create:${user.id}`, 5, 60);
    const { slug } = await context.params;
    const input = await parseJson(request, createCommentSchema);
    const comment = await createProblemComment(slug, user, input);
    return apiCreated(comment);
  } catch (error) {
    return apiError(error);
  }
}
