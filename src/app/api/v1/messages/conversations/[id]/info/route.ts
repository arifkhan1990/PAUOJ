import type { NextRequest } from "next/server";
import { requireApiUser } from "@/server/api/auth";
import { errors } from "@/server/api/errors";
import { enforceRateLimit } from "@/server/api/rate-limit";
import { apiError, apiOk } from "@/server/api/responses";
import { getConversationSharedContent } from "@/server/services/message-shared";

/** Info panel polls lazily; the thread itself refreshes on its own limit. */
const INFO_RATE_LIMIT = 120;
const INFO_RATE_WINDOW_SECONDS = 60;

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const user = await requireApiUser();
    await enforceRateLimit(
      `message-info:${user.id}`,
      INFO_RATE_LIMIT,
      INFO_RATE_WINDOW_SECONDS,
    );
    const { id } = await context.params;
    const content = await getConversationSharedContent(user.id, id);
    if (!content) throw errors.notFound("Conversation not found.");
    const response = apiOk(content);
    response.headers.set("Cache-Control", "private, no-store");
    response.headers.set("X-Content-Type-Options", "nosniff");
    return response;
  } catch (error) {
    return apiError(error);
  }
}
