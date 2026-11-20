import type { NextRequest } from "next/server";
import { apiError, apiOk } from "@/server/api/responses";
import {
  pageMeta,
  paginationSchema,
  parseQuery,
} from "@/server/api/validation";
import { listRank } from "@/server/services/rank";

export async function GET(request: NextRequest) {
  try {
    const query = parseQuery(request, paginationSchema);
    const { items, total } = await listRank(query);
    return apiOk(items, pageMeta(total, query));
  } catch (error) {
    return apiError(error);
  }
}
