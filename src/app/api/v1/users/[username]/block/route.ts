import type { NextRequest } from "next/server";
import { assertSameOrigin, requireApiUser } from "@/server/api/auth";
import { apiError, apiOk } from "@/server/api/responses";
import { blockUser, unblockUser } from "@/server/services/user-blocks";

type RouteContext = { params: Promise<{ username: string }> };

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    assertSameOrigin(request);
    const user = await requireApiUser();
    const { username } = await context.params;
    return apiOk(await blockUser(user, username));
  } catch (error) {
    return apiError(error);
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    assertSameOrigin(request);
    const user = await requireApiUser();
    const { username } = await context.params;
    return apiOk(await unblockUser(user, username));
  } catch (error) {
    return apiError(error);
  }
}
