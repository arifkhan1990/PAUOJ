import type { NextRequest } from "next/server";
import { assertSameOrigin } from "@/server/api/auth";
import { enforceRateLimit } from "@/server/api/rate-limit";
import { getClientIp } from "@/server/api/request";
import { apiError, apiOk } from "@/server/api/responses";
import { parseJson } from "@/server/api/validation";
import { resetPasswordSchema } from "@/lib/schemas/auth";
import { resetPasswordWithToken } from "@/server/auth/email-flows";

export async function POST(request: NextRequest) {
  try {
    assertSameOrigin(request);
    const ip = getClientIp(request) ?? "unknown";
    await enforceRateLimit(`auth:reset:${ip}`, 10, 15 * 60);
    const input = await parseJson(request, resetPasswordSchema);
    await resetPasswordWithToken(input.token, input.newPassword);
    return apiOk({ ok: true });
  } catch (error) {
    return apiError(error);
  }
}
