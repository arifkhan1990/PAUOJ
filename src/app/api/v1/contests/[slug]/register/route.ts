import type { NextRequest } from "next/server";
import { assertSameOrigin, requireApiUser } from "@/server/api/auth";
import { enforceRateLimit } from "@/server/api/rate-limit";
import { apiError, apiOk } from "@/server/api/responses";
import { registerForContest } from "@/server/services/contests";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> },
) {
  try {
    assertSameOrigin(request);
    const user = await requireApiUser();
    await enforceRateLimit(`contest:register:${user.id}`, 10, 60);
    const { slug } = await context.params;
    const result = await registerForContest(slug, user.id);
    return apiOk(result);
  } catch (error) {
    return apiError(error);
  }
}
