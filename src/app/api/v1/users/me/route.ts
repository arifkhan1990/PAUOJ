import type { NextRequest } from "next/server";
import { assertSameOrigin, requireApiUser } from "@/server/api/auth";
import { enforceRateLimit } from "@/server/api/rate-limit";
import { apiError, apiOk } from "@/server/api/responses";
import { parseJson } from "@/server/api/validation";
import { profileSchema } from "@/lib/schemas/auth";
import { updateProfile } from "@/server/services/auth";

export async function PATCH(request: NextRequest) {
  try {
    assertSameOrigin(request);
    const user = await requireApiUser();
    await enforceRateLimit(`profile:update:${user.id}`, 30, 60);
    const input = await parseJson(request, profileSchema);
    const updated = await updateProfile(user.id, input);
    const response = apiOk(updated);
    response.headers.set("Cache-Control", "private, no-store");
    return response;
  } catch (error) {
    return apiError(error);
  }
}
