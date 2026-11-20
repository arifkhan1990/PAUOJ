import type { NextRequest } from "next/server";
import { assertSameOrigin, requireApiUser } from "@/server/api/auth";
import { enforceRateLimit } from "@/server/api/rate-limit";
import { apiError, apiOk } from "@/server/api/responses";
import { parseJson } from "@/server/api/validation";
import { problemRatingSchema } from "@/lib/schemas/problem-extras";
import { rateProblem } from "@/server/services/problem-extras";

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> },
) {
  try {
    assertSameOrigin(request);
    const user = await requireApiUser();
    await enforceRateLimit(`problem:rate:${user.id}`, 30, 60);
    const { slug } = await context.params;
    const input = await parseJson(request, problemRatingSchema);
    const rating = await rateProblem(slug, user, input);
    return apiOk(rating);
  } catch (error) {
    return apiError(error);
  }
}
