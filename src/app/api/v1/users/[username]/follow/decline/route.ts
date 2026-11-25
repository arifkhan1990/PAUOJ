import type { NextRequest } from "next/server";
import { assertSameOrigin, requireApiUser } from "@/server/api/auth";
import { apiError, apiOk } from "@/server/api/responses";
import { declineFollowRequest } from "@/server/services/profile-follows";

type RouteContext = { params: Promise<{ username: string }> };

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    assertSameOrigin(request);
    const user = await requireApiUser();
    const { username } = await context.params;
    return apiOk(await declineFollowRequest(user, username));
  } catch (error) {
    return apiError(error);
  }
}
