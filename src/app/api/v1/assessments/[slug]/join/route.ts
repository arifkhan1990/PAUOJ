import type { NextRequest } from "next/server";
import { assertSameOrigin, requireApiUser } from "@/server/api/auth";
import { enforceRateLimit } from "@/server/api/rate-limit";
import { apiError, apiOk } from "@/server/api/responses";
import { parseJson } from "@/server/api/validation";
import { joinAssessmentSchema } from "@/lib/schemas/assessment";
import { joinAssessment } from "@/server/services/assessments";

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
      "Too many access-code attempts. Please wait.",
    );
    const input = await parseJson(request, joinAssessmentSchema);
    const participant = await joinAssessment(slug, user.id, input.code);
    return apiOk(participant);
  } catch (error) {
    return apiError(error);
  }
}
