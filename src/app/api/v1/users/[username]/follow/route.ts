import type { NextRequest } from "next/server";
import { assertSameOrigin, requireApiUser } from "@/server/api/auth";
import { apiError, apiOk } from "@/server/api/responses";
import { followUser, unfollowUser } from "@/server/services/profile-follows";

type RouteContext = { params: Promise<{ username: string }> };

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    assertSameOrigin(request);
    const user = await requireApiUser();
    const { username } = await context.params;
    return apiOk(await followUser(user, username));
  } catch (error) {
    return apiError(error);
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    assertSameOrigin(request);
    const user = await requireApiUser();
    const { username } = await context.params;
    return apiOk(await unfollowUser(user, username));
  } catch (error) {
    return apiError(error);
  }
}
