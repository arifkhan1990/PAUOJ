import type { NextRequest } from "next/server";
import { assertSameOrigin, requireApiAdmin } from "@/server/api/auth";
import { enforceRateLimit } from "@/server/api/rate-limit";
import { apiError, apiOk } from "@/server/api/responses";
import { parseJson } from "@/server/api/validation";
import { paymentReviewSchema } from "@/lib/schemas/learning-payments";
import { reviewPaymentOrder } from "@/server/services/learning-payments";

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    assertSameOrigin(request);
    const admin = await requireApiAdmin();
    await enforceRateLimit(`payment:review:${admin.id}`, 60, 60);
    const { id } = await context.params;
    const input = await parseJson(request, paymentReviewSchema);
    return apiOk(
      await reviewPaymentOrder(id, admin, input.action, input.note),
    );
  } catch (error) {
    return apiError(error);
  }
}
