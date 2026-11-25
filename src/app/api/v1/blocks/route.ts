import { requireApiUser } from "@/server/api/auth";
import { apiError, apiOk } from "@/server/api/responses";
import { listBlockedUsers } from "@/server/services/user-blocks";

export async function GET() {
  try {
    const user = await requireApiUser();
    return apiOk(await listBlockedUsers(user.id));
  } catch (error) {
    return apiError(error);
  }
}
