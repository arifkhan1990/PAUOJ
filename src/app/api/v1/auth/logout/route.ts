import type { NextRequest } from "next/server";
import { assertSameOrigin } from "@/server/api/auth";
import { apiError, apiOk } from "@/server/api/responses";
import { destroySession } from "@/server/auth/session";

export async function POST(request: NextRequest) {
  try {
    assertSameOrigin(request);
    await destroySession();
    return apiOk({ ok: true });
  } catch (error) {
    return apiError(error);
  }
}
