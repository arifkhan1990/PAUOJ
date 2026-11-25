import type { NextRequest } from "next/server";
import { apiError, apiOk } from "@/server/api/responses";
import {
  pageMeta,
  parseQuery,
  ratingQuerySchema,
} from "@/server/api/validation";
import { listRatingRank } from "@/server/services/rating-rank";

export async function GET(request: NextRequest) {
  try {
    const query = parseQuery(request, ratingQuerySchema);
    const { items, total } = await listRatingRank(query);
    return apiOk(items, pageMeta(total, query));
  } catch (error) {
    return apiError(error);
  }
}
