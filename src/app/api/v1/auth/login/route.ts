import type { NextRequest } from "next/server";
import { assertSameOrigin } from "@/server/api/auth";
import { enforceRateLimit } from "@/server/api/rate-limit";
import { getClientIp, getClientUserAgent } from "@/server/api/request";
import { apiError, apiOk } from "@/server/api/responses";
import { parseJson } from "@/server/api/validation";
import { createSession } from "@/server/auth/session";
import { loginSchema } from "@/lib/schemas/auth";
import { authenticateUser } from "@/server/services/auth";

export async function POST(request: NextRequest) {
  try {
    assertSameOrigin(request);
    const ip = getClientIp(request) ?? "unknown";
    await enforceRateLimit(`auth:login:${ip}`, 20, 15 * 60);
    const input = await parseJson(request, loginSchema);
    await enforceRateLimit(
      `auth:login:id:${input.identifier.toLowerCase()}`,
      10,
      15 * 60,
    );
    const user = await authenticateUser(input);
    await createSession(user.id, {
      ip: getClientIp(request),
      userAgent: getClientUserAgent(request),
    });
    return apiOk(user);
  } catch (error) {
    return apiError(error);
  }
}
