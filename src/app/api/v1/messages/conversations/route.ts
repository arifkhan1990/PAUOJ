import type { NextRequest } from "next/server";
import { assertSameOrigin, requireApiUser } from "@/server/api/auth";
import { enforceRateLimit } from "@/server/api/rate-limit";
import { apiCreated, apiError, apiOk } from "@/server/api/responses";
import {
  pageMeta,
  paginationSchema,
  parseJson,
  parseQuery,
} from "@/server/api/validation";
import { openConversationSchema } from "@/lib/schemas/messages";
import {
  CONVERSATIONS_PAGE_SIZE,
  listConversations,
  openConversation,
} from "@/server/services/messages";

export async function GET(request: NextRequest) {
  try {
    const user = await requireApiUser();
    await enforceRateLimit(`message-list:${user.id}`, 120, 60);
    const query = parseQuery(request, paginationSchema);
    const result = await listConversations(user.id, query.page);
    return apiOk(
      result,
      pageMeta(result.total, {
        page: result.page,
        pageSize: CONVERSATIONS_PAGE_SIZE,
      }),
    );
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    assertSameOrigin(request);
    const user = await requireApiUser();
    const input = await parseJson(request, openConversationSchema);
    return apiCreated(await openConversation(user, input.username));
  } catch (error) {
    return apiError(error);
  }
}
