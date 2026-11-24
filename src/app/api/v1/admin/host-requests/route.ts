import type { NextRequest } from "next/server";
import { z } from "zod";
import { requireApiAdmin } from "@/server/api/auth";
import { apiError, apiOk } from "@/server/api/responses";
import {
  pageMeta,
  paginationSchema,
  parseQuery,
} from "@/server/api/validation";
import { listAdminContestHostRequests } from "@/server/services/contest-host-requests";

const querySchema = paginationSchema.extend({
  status: z
    .enum(["SUBMITTED", "UNDER_REVIEW", "APPROVED", "REJECTED", "CONVERTED"])
    .optional(),
});

export async function GET(request: NextRequest) {
  try {
    await requireApiAdmin();
    const query = parseQuery(request, querySchema);
    const result = await listAdminContestHostRequests(query, query.status);
    return apiOk(result.items, pageMeta(result.total, query));
  } catch (error) {
    return apiError(error);
  }
}
