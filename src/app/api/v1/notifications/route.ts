import type { NextRequest } from "next/server";
import { requireApiUser } from "@/server/api/auth";
import { apiError, apiOk } from "@/server/api/responses";
import { pageMeta, paginationSchema, parseQuery } from "@/server/api/validation";
import {
  NOTIFICATIONS_PAGE_SIZE,
  listNotifications,
} from "@/server/services/notifications";

export async function GET(request: NextRequest) {
  try {
    const user = await requireApiUser();
    const page = parseQuery(request, paginationSchema);
    const result = await listNotifications(user.id, {
      page: page.page,
      pageSize: NOTIFICATIONS_PAGE_SIZE,
    });
    return apiOk(
      result.items,
      pageMeta(result.total, {
        page: page.page,
        pageSize: NOTIFICATIONS_PAGE_SIZE,
      }),
    );
  } catch (error) {
    return apiError(error);
  }
}
