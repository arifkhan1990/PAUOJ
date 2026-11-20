import type { NextRequest } from "next/server";
import { assertSameOrigin } from "@/server/api/auth";
import { apiError, apiOk } from "@/server/api/responses";
import { parseJson } from "@/server/api/validation";
import { unsubscribeSchema } from "@/lib/schemas/notification";
import { unsubscribeByToken } from "@/server/services/notifications";

export async function POST(request: NextRequest) {
  try {
    assertSameOrigin(request);
    const input = await parseJson(request, unsubscribeSchema);
    const ok = await unsubscribeByToken(input.token, input.scope);
    return apiOk({ ok });
  } catch (error) {
    return apiError(error);
  }
}
