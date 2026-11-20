import type { NextRequest } from "next/server";
import { z } from "zod";
import { optionalApiUser } from "@/server/api/auth";
import { apiError, apiOk } from "@/server/api/responses";
import {
  pageMeta,
  paginationSchema,
  parseQuery,
} from "@/server/api/validation";
import { listContests } from "@/server/services/contests";

const querySchema = paginationSchema.extend({
  filter: z.enum(["ALL", "UPCOMING", "RUNNING", "ENDED"]).default("ALL"),
});

export async function GET(request: NextRequest) {
  try {
    const query = parseQuery(request, querySchema);
    const user = await optionalApiUser();
    const { items, total } = await listContests({
      page: query,
      filter: query.filter,
      userId: user?.id ?? null,
    });
    return apiOk(items, pageMeta(total, query));
  } catch (error) {
    return apiError(error);
  }
}
