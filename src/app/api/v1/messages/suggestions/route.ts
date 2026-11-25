import type { NextRequest } from "next/server";
import { requireApiUser } from "@/server/api/auth";
import { enforceRateLimit } from "@/server/api/rate-limit";
import { apiError, apiOk } from "@/server/api/responses";
import { parseQuery } from "@/server/api/validation";
import { messageSuggestionQuerySchema } from "@/lib/schemas/messages";
import { listMessageSuggestions } from "@/server/services/message-suggestions";

export async function GET(request: NextRequest) {
  try {
    const user = await requireApiUser();
    await enforceRateLimit(`message-suggestions:${user.id}`, 120, 60);
    const query = parseQuery(request, messageSuggestionQuerySchema);
    const items = await listMessageSuggestions({
      kind: query.kind,
      query: query.q,
      userId: user.id,
      isAdmin: user.role === "ADMIN",
    });
    return apiOk({ items });
  } catch (error) {
    return apiError(error);
  }
}
