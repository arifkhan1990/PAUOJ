import type { NextRequest } from "next/server";
import { assertSameOrigin, requireApiUser } from "@/server/api/auth";
import { apiError, apiOk } from "@/server/api/responses";
import { parseJson } from "@/server/api/validation";
import { notificationPreferencesSchema } from "@/lib/schemas/notification";
import { updateNotificationPreferences } from "@/server/services/notifications";

export async function PATCH(request: NextRequest) {
  try {
    assertSameOrigin(request);
    const user = await requireApiUser();
    const input = await parseJson(request, notificationPreferencesSchema);
    const preferences = await updateNotificationPreferences(user.id, input);
    return apiOk(preferences);
  } catch (error) {
    return apiError(error);
  }
}
