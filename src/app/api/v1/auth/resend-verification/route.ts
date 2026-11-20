import type { NextRequest } from "next/server";
import { assertSameOrigin, requireApiUser } from "@/server/api/auth";
import { ApiError } from "@/server/api/errors";
import { enforceRateLimit } from "@/server/api/rate-limit";
import { apiError, apiOk } from "@/server/api/responses";
import { sendVerificationForUser } from "@/server/auth/email-flows";

export async function POST(request: NextRequest) {
  try {
    assertSameOrigin(request);
    const user = await requireApiUser();
    if (user.emailVerifiedAt) return apiOk({ ok: true, alreadyVerified: true });
    await enforceRateLimit(`auth:resend-verify:${user.id}`, 3, 15 * 60);
    const sent = await sendVerificationForUser(user);
    if (!sent) {
      throw new ApiError(
        "EMAIL_UNAVAILABLE",
        "We could not send the email right now. Try again later.",
        503,
      );
    }
    return apiOk({ ok: true });
  } catch (error) {
    return apiError(error);
  }
}
