import type { NextRequest } from "next/server";
import { requireApiUser } from "@/server/api/auth";
import { enforceRateLimit } from "@/server/api/rate-limit";
import { apiError, apiOk } from "@/server/api/responses";
import { pageMeta, paginationSchema, parseQuery } from "@/server/api/validation";
import { FOLLOW_PAGE_SIZE } from "@/server/services/profile-follow-shared";
import { listFollowRequests } from "@/server/services/profile-follows";

export async function GET(request: NextRequest) {
  try {
    const user = await requireApiUser();
    await enforceRateLimit(`follow-requests:${user.id}`, 120, 60);
    const query = parseQuery(request, paginationSchema);
    const result = await listFollowRequests(user.id, query.page);
    return apiOk(result.items, pageMeta(result.total, {
      page: result.page,
      pageSize: FOLLOW_PAGE_SIZE,
    }));
  } catch (error) {
    return apiError(error);
  }
}
