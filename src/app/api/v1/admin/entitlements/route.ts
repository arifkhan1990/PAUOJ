import type { NextRequest } from "next/server";
import { assertSameOrigin, requireApiAdmin } from "@/server/api/auth";
import { enforceRateLimit } from "@/server/api/rate-limit";
import { apiCreated, apiError } from "@/server/api/responses";
import { parseJson } from "@/server/api/validation";
import { grantEntitlementSchema } from "@/lib/schemas/learning-payments";
import { grantEntitlements } from "@/server/services/learning-payments";

export async function POST(request: NextRequest) {
  try {
    assertSameOrigin(request);
    const admin = await requireApiAdmin();
    await enforceRateLimit(`entitlement:grant:${admin.id}`, 30, 60);
    const input = await parseJson(request, grantEntitlementSchema);
    return apiCreated(await grantEntitlements(admin, input));
  } catch (error) {
    return apiError(error);
  }
}
