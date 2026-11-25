import type { NextRequest } from "next/server";
import { assertSameOrigin } from "@/server/api/auth";
import { enforceRateLimit } from "@/server/api/rate-limit";
import { getClientIp, getClientUserAgent } from "@/server/api/request";
import { apiCreated, apiError } from "@/server/api/responses";
import { parseJson } from "@/server/api/validation";
import { createSession } from "@/server/auth/session";
import { registerSchema } from "@/lib/schemas/auth";
import { registerUser } from "@/server/services/auth";
import { sendVerificationForUser } from "@/server/auth/email-flows";
import { notifyUser } from "@/server/services/notifications";
import { logger } from "@/server/logger";

export async function POST(request: NextRequest) {
  try {
    assertSameOrigin(request);
    const ip = getClientIp(request) ?? "unknown";
    await enforceRateLimit(`auth:register:${ip}`, 5, 15 * 60);
    const input = await parseJson(request, registerSchema);
    const user = await registerUser(input);
    await createSession(user.id, {
      ip: getClientIp(request),
      userAgent: getClientUserAgent(request),
    });
    try {
      await sendVerificationForUser(user);
    } catch (error) {
      logger.warn("Could not send the initial verification email", {
        userId: user.id,
        error: error instanceof Error ? error.message : String(error),
      });
    }
    try {
      await notifyUser({
        userId: user.id,
        type: "WELCOME",
        title: "Welcome to PAU OJ",
        body: "Your account is ready. Verify your email so you never miss contest reminders, results and learning updates.",
        href: "/dashboard",
        dedupeKey: "welcome",
        allowUnverifiedEmail: true,
      });
    } catch (error) {
      // The account exists either way; a failed welcome mail is not fatal.
      logger.warn("Could not send the welcome notification", {
        userId: user.id,
        error: error instanceof Error ? error.message : String(error),
      });
    }
    return apiCreated(user);
  } catch (error) {
    return apiError(error);
  }
}
