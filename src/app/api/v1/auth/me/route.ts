import { apiError, apiOk } from "@/server/api/responses";
import { getCurrentUser } from "@/server/auth/session";

export async function GET() {
  try {
    const user = await getCurrentUser();
    return apiOk(user);
  } catch (error) {
    return apiError(error);
  }
}
