import type { NextRequest } from "next/server";
import { assertSameOrigin } from "@/server/api/auth";
import { enforceRateLimit } from "@/server/api/rate-limit";
import { getClientIp } from "@/server/api/request";
import { apiError, apiOk } from "@/server/api/responses";
import { parseJson } from "@/server/api/validation";
import { forgotPasswordSchema } from "@/lib/schemas/auth";
import { sendPasswordResetForEmail } from "@/server/auth/email-flows";

export async function POST(request: NextRequest) {
  try {
    assertSameOrigin(request);
    const ip = getClientIp(request) ?? "unknown";
    await enforceRateLimit(`auth:forgot:${ip}`, 10, 15 * 60);
    const input = await parseJson(request, forgotPasswordSchema);
    await enforceRateLimit(`auth:forgot:email:${input.email}`, 3, 15 * 60);
    await sendPasswordResetForEmail(input.email);
    return apiOk({ ok: true });
  } catch (error) {
    return apiError(error);
  }
}
