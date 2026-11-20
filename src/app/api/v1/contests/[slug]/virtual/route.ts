import type { NextRequest } from "next/server";
import { assertSameOrigin, requireApiUser } from "@/server/api/auth";
import { enforceRateLimit } from "@/server/api/rate-limit";
import { apiCreated, apiError } from "@/server/api/responses";
import { startVirtualContest } from "@/server/services/virtual-contests";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> },
) {
  try {
    assertSameOrigin(request);
    const user = await requireApiUser();
    await enforceRateLimit(`virtual:start:${user.id}`, 10, 60);
    const { slug } = await context.params;
    const result = await startVirtualContest(slug, user.id);
    return apiCreated(result);
  } catch (error) {
    return apiError(error);
  }
}
