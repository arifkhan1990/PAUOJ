import type { NextRequest } from "next/server";
import { assertSameOrigin, requireApiUser } from "@/server/api/auth";
import { apiError, apiOk } from "@/server/api/responses";
import { parseJson } from "@/server/api/validation";
import { profileSchema } from "@/lib/schemas/auth";
import { updateProfile } from "@/server/services/auth";

export async function PATCH(request: NextRequest) {
  try {
    assertSameOrigin(request);
    const user = await requireApiUser();
    const input = await parseJson(request, profileSchema);
    const updated = await updateProfile(user.id, input);
    return apiOk(updated);
  } catch (error) {
    return apiError(error);
  }
}
