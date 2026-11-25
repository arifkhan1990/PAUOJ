import type { NextRequest } from "next/server";
import { requireApiUser } from "@/server/api/auth";
import { errors } from "@/server/api/errors";
import { enforceRateLimit } from "@/server/api/rate-limit";
import { apiError, apiOk } from "@/server/api/responses";
import { paginationSchema, parseQuery } from "@/server/api/validation";
import { getConversationThread } from "@/server/services/messages";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const user = await requireApiUser();
    await enforceRateLimit(`message-thread:${user.id}`, 240, 60);
    const { id } = await context.params;
    const query = parseQuery(request, paginationSchema);
    const thread = await getConversationThread(user.id, id, query.page);
    if (!thread) throw errors.notFound("Conversation not found.");
    return apiOk(thread);
  } catch (error) {
    return apiError(error);
  }
}
