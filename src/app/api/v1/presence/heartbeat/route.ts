import type { NextRequest } from "next/server";
import { assertSameOrigin, requireApiUser } from "@/server/api/auth";
import { apiError, apiOk } from "@/server/api/responses";
import { touchPresence } from "@/server/services/presence";

export async function POST(request: NextRequest) {
  try {
    assertSameOrigin(request);
    const user = await requireApiUser();
    await touchPresence(user.id);
    return apiOk({ online: true });
  } catch (error) {
    return apiError(error);
  }
}
