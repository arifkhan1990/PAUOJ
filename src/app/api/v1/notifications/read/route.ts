import type { NextRequest } from "next/server";
import { assertSameOrigin, requireApiUser } from "@/server/api/auth";
import { apiError, apiOk } from "@/server/api/responses";
import { markAllNotificationsRead } from "@/server/services/notifications";

export async function PATCH(request: NextRequest) {
  try {
    assertSameOrigin(request);
    const user = await requireApiUser();
    await markAllNotificationsRead(user.id);
    return apiOk({ ok: true });
  } catch (error) {
    return apiError(error);
  }
}
