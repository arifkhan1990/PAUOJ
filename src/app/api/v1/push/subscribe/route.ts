import type { NextRequest } from "next/server";
import { assertSameOrigin, requireApiUser } from "@/server/api/auth";
import { enforceRateLimit } from "@/server/api/rate-limit";
import { getClientUserAgent } from "@/server/api/request";
import { apiCreated, apiError, apiOk } from "@/server/api/responses";
import { parseJson } from "@/server/api/validation";
import {
  pushSubscribeSchema,
  pushUnsubscribeSchema,
} from "@/lib/schemas/push";
import {
  removePushSubscription,
  savePushSubscription,
} from "@/server/services/web-push";

const RATE_LIMIT = 20;
const RATE_WINDOW_SECONDS = 60;

export async function POST(request: NextRequest) {
  try {
    assertSameOrigin(request);
    const user = await requireApiUser();
    await enforceRateLimit(
      `push:subscribe:${user.id}`,
      RATE_LIMIT,
      RATE_WINDOW_SECONDS,
      "Too many push subscription changes. Please wait a moment.",
    );
    const input = await parseJson(request, pushSubscribeSchema);
    await savePushSubscription(user.id, input, getClientUserAgent(request));
    const response = apiCreated({ ok: true });
    response.headers.set("Cache-Control", "private, no-store");
    return response;
  } catch (error) {
    return apiError(error);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    assertSameOrigin(request);
    const user = await requireApiUser();
    await enforceRateLimit(
      `push:subscribe:${user.id}`,
      RATE_LIMIT,
      RATE_WINDOW_SECONDS,
      "Too many push subscription changes. Please wait a moment.",
    );
    const input = await parseJson(request, pushUnsubscribeSchema);
    await removePushSubscription(user.id, input.endpoint);
    const response = apiOk({ ok: true });
    response.headers.set("Cache-Control", "private, no-store");
    return response;
  } catch (error) {
    return apiError(error);
  }
}
