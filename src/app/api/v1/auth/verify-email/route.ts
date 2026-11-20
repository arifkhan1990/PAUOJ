import type { NextRequest } from "next/server";
import { assertSameOrigin } from "@/server/api/auth";
import { enforceRateLimit } from "@/server/api/rate-limit";
import { getClientIp } from "@/server/api/request";
import { apiError, apiOk } from "@/server/api/responses";
import { parseJson } from "@/server/api/validation";
import { verifyEmailSchema } from "@/lib/schemas/auth";
import { verifyEmailToken } from "@/server/auth/email-flows";

export async function POST(request: NextRequest) {
  try {
    assertSameOrigin(request);
    const ip = getClientIp(request) ?? "unknown";
    await enforceRateLimit(`auth:verify:${ip}`, 20, 15 * 60);
    const input = await parseJson(request, verifyEmailSchema);
    await verifyEmailToken(input.token);
    return apiOk({ ok: true });
  } catch (error) {
    return apiError(error);
  }
}
