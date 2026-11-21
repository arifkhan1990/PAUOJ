import type { NextRequest } from "next/server";
import { ApiError } from "@/server/api/errors";
import { apiError, apiOk } from "@/server/api/responses";
import { assessmentPhase } from "@/lib/assessments";
import { refHint } from "@/lib/assessment-invites";
import { resolveInviteToken } from "@/server/services/assessment-invites";

// The token is part of the path, so the response must never be cached,
// indexed or referenced back to the origin:
// - no-referrer keeps it out of the Referer header on outbound links;
// - no-store keeps proxies/browsers from storing the body;
// - noindex/no-follow keeps crawlers away.
const PRIVATE_HEADERS: Record<string, string> = {
  "Referrer-Policy": "no-referrer",
  "Cache-Control": "no-store",
  "X-Robots-Tag": "noindex, nofollow",
};

function withPrivateHeaders<T extends Response>(response: T): T {
  for (const [key, value] of Object.entries(PRIVATE_HEADERS)) {
    response.headers.set(key, value);
  }
  return response;
}

function inviteNotFound(): ApiError {
  return new ApiError("INVITE_NOT_FOUND", "This invite link is not valid.", 404);
}

/**
 * Read-only resolution. Mail scanners, prefetchers and chat unfurlers hit this
 * URL, so GET must never write: it starts no timer, creates no participant and
 * does not move the invite status. Only POST /join claims the invite.
 */
export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ slug: string; token: string }> },
) {
  try {
    const { slug, token } = await context.params;
    const resolved = await resolveInviteToken(token);
    if (
      !resolved ||
      resolved.assessment.slug !== slug ||
      !resolved.assessment.isPublished
    ) {
      throw inviteNotFound();
    }

    const { invite, assessment } = resolved;
    const phase = assessmentPhase(assessment.startAt, assessment.endAt);
    return withPrivateHeaders(
      apiOk({
        assessment: {
          slug: assessment.slug,
          title: assessment.title,
          startAt: assessment.startAt.toISOString(),
          endAt: assessment.endAt.toISOString(),
          durationMinutes: assessment.durationMinutes,
          phase,
        },
        invite: {
          status: resolved.status,
          candidateName: invite.candidateName,
          requiresRef: !invite.email,
          refHint: refHint(invite.candidateRef),
          hasEmail: Boolean(invite.email),
        },
      }),
    );
  } catch (error) {
    return withPrivateHeaders(apiError(error));
  }
}
