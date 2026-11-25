import { requireApiUser } from "@/server/api/auth";
import { enforceRateLimit } from "@/server/api/rate-limit";
import { apiError, apiOk } from "@/server/api/responses";
import { getSocialCounts } from "@/server/services/social-counts";

export async function GET() {
  try {
    const user = await requireApiUser();
    await enforceRateLimit(`social-counts:${user.id}`, 120, 60);
    const response = apiOk(await getSocialCounts(user.id));
    response.headers.set("Cache-Control", "private, no-store");
    return response;
  } catch (error) {
    return apiError(error);
  }
}
