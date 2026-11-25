import { apiError, apiOk } from "@/server/api/responses";
import { getPushPublicKey } from "@/server/services/web-push";

/**
 * Public VAPID key for the browser's pushManager.subscribe call. Safe to cache
 * briefly; only the public half of the keypair is ever exposed.
 */
export async function GET() {
  try {
    const response = apiOk({ publicKey: getPushPublicKey() });
    response.headers.set("Cache-Control", "public, max-age=300");
    return response;
  } catch (error) {
    return apiError(error);
  }
}
