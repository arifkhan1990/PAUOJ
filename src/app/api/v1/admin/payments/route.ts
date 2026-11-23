import type { NextRequest } from "next/server";
import { requireApiAdmin } from "@/server/api/auth";
import { apiError, apiOk } from "@/server/api/responses";
import { pageMeta, parseQuery } from "@/server/api/validation";
import { paymentQueueQuerySchema } from "@/lib/schemas/learning-payments";
import {
  PAYMENT_PAGE_SIZE,
  listAdminOrders,
} from "@/server/services/learning-payments";

export async function GET(request: NextRequest) {
  try {
    await requireApiAdmin();
    const query = parseQuery(request, paymentQueueQuerySchema);
    const result = await listAdminOrders({
      status: query.status,
      page: query.page,
    });
    return apiOk(
      result.items,
      pageMeta(result.total, { page: query.page, pageSize: PAYMENT_PAGE_SIZE }),
    );
  } catch (error) {
    return apiError(error);
  }
}
