import type { NextRequest } from "next/server";
import { assertSameOrigin, requireApiUser } from "@/server/api/auth";
import { enforceRateLimit } from "@/server/api/rate-limit";
import { getClientIp, getClientUserAgent } from "@/server/api/request";
import { apiError, apiOk } from "@/server/api/responses";
import { parseJson } from "@/server/api/validation";
import { createSession } from "@/server/auth/session";
import { changePasswordSchema } from "@/lib/schemas/auth";
import { changePassword } from "@/server/services/auth";

export async function POST(request: NextRequest) {
  try {
    assertSameOrigin(request);
    const user = await requireApiUser();
    await enforceRateLimit(`auth:password:${user.id}`, 5, 15 * 60);
    const input = await parseJson(request, changePasswordSchema);
    await changePassword(user.id, input);
    await createSession(user.id, {
      ip: getClientIp(request),
      userAgent: getClientUserAgent(request),
    });
    return apiOk({ ok: true });
  } catch (error) {
    return apiError(error);
  }
}
