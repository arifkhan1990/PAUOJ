import type { NextRequest } from "next/server";
import { assertSameOrigin, requireApiUser } from "@/server/api/auth";
import { enforceRateLimit } from "@/server/api/rate-limit";
import { apiCreated, apiError } from "@/server/api/responses";
import { parseJson } from "@/server/api/validation";
import { purchaseOrderSchema } from "@/lib/schemas/learning-payments";
import { createPurchaseOrder } from "@/server/services/learning-payments";

export async function POST(request: NextRequest) {
  try {
    assertSameOrigin(request);
    const user = await requireApiUser();
    await enforceRateLimit(`learning:purchase:${user.id}`, 5, 60 * 60);
    const input = await parseJson(request, purchaseOrderSchema);
    return apiCreated(await createPurchaseOrder(user, input));
  } catch (error) {
    return apiError(error);
  }
}
