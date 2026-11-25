import { requireApiUser } from "@/server/api/auth";
import { enforceRateLimit } from "@/server/api/rate-limit";
import { apiError, apiOk } from "@/server/api/responses";
import { getUnreadMessageCount } from "@/server/services/messages";

export async function GET() {
  try {
    const user = await requireApiUser();
    await enforceRateLimit(`message-unread:${user.id}`, 120, 60);
    const count = await getUnreadMessageCount(user.id);
    const response = apiOk({ count });
    response.headers.set("Cache-Control", "private, no-store");
    return response;
  } catch (error) {
    return apiError(error);
  }
}
