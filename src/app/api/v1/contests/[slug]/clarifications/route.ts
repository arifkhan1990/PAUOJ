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
  clarificationListQuerySchema,
  clarificationQuestionSchema,
} from "@/lib/schemas/clarification";
import {
  CLARIFICATIONS_PAGE_SIZE,
  createContestClarification,
  listContestClarifications,
} from "@/server/services/contest-clarifications";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await context.params;
    const query = parseQuery(request, clarificationListQuerySchema);
    const viewer = await optionalApiUser();
    const result = await listContestClarifications(slug, viewer, query.page);
    return apiOk(
      result.items,
      pageMeta(result.total, {
        page: query.page,
        pageSize: CLARIFICATIONS_PAGE_SIZE,
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
    await enforceRateLimit(`clarification:create:${user.id}`, 10, 60);
    const { slug } = await context.params;
    const input = await parseJson(request, clarificationQuestionSchema);
    const result = await createContestClarification(slug, user, input);
    return apiCreated(result);
  } catch (error) {
    return apiError(error);
  }
}
