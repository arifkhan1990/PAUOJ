import type { NextRequest } from "next/server";
import { assertSameOrigin, requireApiUser } from "@/server/api/auth";
import { enforceRateLimit } from "@/server/api/rate-limit";
import { apiError, apiOk } from "@/server/api/responses";
import { parseJson } from "@/server/api/validation";
import { joinAssessmentSchema } from "@/lib/schemas/assessment";
import { joinAssessment } from "@/server/services/assessments";
import { claimAssessmentInvite } from "@/server/services/assessment-invite-join";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> },
) {
  try {
    assertSameOrigin(request);
    const user = await requireApiUser();
    const { slug } = await context.params;
    await enforceRateLimit(
      `assessment:join:${user.id}:${slug}`,
      10,
      15 * 60,
      "Too many join attempts. Please wait.",
    );
    const input = await parseJson(request, joinAssessmentSchema);
    // One canonical claim endpoint: a bare code keeps the OPEN_CODE path, an
    // invite token claims the personal link. GET on the invite route stays
    // read-only.
    const participant =
      "code" in input
        ? await joinAssessment(slug, user.id, input.code)
        : await claimAssessmentInvite(slug, user, input);
    return apiOk(participant);
  } catch (error) {
    return apiError(error);
  }
}
