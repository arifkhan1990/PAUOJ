import type { NextRequest } from "next/server";
import { assertSameOrigin, requireApiUser } from "@/server/api/auth";
import { enforceRateLimit } from "@/server/api/rate-limit";
import { apiCreated, apiError } from "@/server/api/responses";
import { parseJson } from "@/server/api/validation";
import { freeAccessRequestSchema } from "@/lib/schemas/learning-payments";
import { createFreeAccessRequest } from "@/server/services/learning-payments";

export async function POST(request: NextRequest) {
  try {
    assertSameOrigin(request);
    const user = await requireApiUser();
    await enforceRateLimit(`learning:free-request:${user.id}`, 3, 24 * 60 * 60);
    const input = await parseJson(request, freeAccessRequestSchema);
    return apiCreated(await createFreeAccessRequest(user, input));
  } catch (error) {
    return apiError(error);
  }
}
