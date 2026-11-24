import type { NextRequest } from "next/server";
import { assertSameOrigin, requireApiUser } from "@/server/api/auth";
import { enforceRateLimit } from "@/server/api/rate-limit";
import { apiError, apiOk } from "@/server/api/responses";
import { parseJson } from "@/server/api/validation";
import { contestIntegrityEventSchema } from "@/lib/schemas/contest-ops";
import { recordContestIntegrityEvent } from "@/server/services/contest-integrity-events";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> },
) {
  try {
    assertSameOrigin(request);
    const user = await requireApiUser();
    await enforceRateLimit(`contest:integrity:${user.id}`, 60, 60);
    const { slug } = await context.params;
    const input = await parseJson(request, contestIntegrityEventSchema);
    await recordContestIntegrityEvent(user, slug, input);
    return apiOk({ recorded: true });
  } catch (error) {
    return apiError(error);
  }
}
