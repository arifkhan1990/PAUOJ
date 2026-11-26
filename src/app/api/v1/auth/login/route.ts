import type { NextRequest } from "next/server";
import { ApiError } from "@/server/api/errors";
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
    const input = await parseJson(request, loginSchema);
    // Account-scoped throttle stays first: it is the brute-force guard.
    await enforceRateLimit(
      `auth:login:id:${input.identifier.toLowerCase()}`,
      10,
      15 * 60,
    );

    let user;
    try {
      user = await authenticateUser(input);
    } catch (error) {
      // A campus, office or carrier NAT puts thousands of legitimate students
      // behind one address. Only FAILED passwords consume the shared-IP
      // budget, so contest-day sign-ins from one egress are not blocked while
      // password spraying from that egress still hits a ceiling.
      if (error instanceof ApiError && error.code === "INVALID_CREDENTIALS") {
        await enforceRateLimit(
          `auth:login:fail:${ip}`,
          50,
          15 * 60,
          "Too many failed sign-in attempts. Please wait and try again.",
        );
      }
      throw error;
    }

    await createSession(user.id, {
      ip: getClientIp(request),
      userAgent: getClientUserAgent(request),
    });
    return apiOk(user);
  } catch (error) {
    return apiError(error);
  }
}
