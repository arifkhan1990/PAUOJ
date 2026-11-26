import type { NextRequest } from "next/server";
import { z } from "zod";
import { requireApiUser } from "@/server/api/auth";
import { enforceRateLimit } from "@/server/api/rate-limit";
import { apiError, apiOk } from "@/server/api/responses";
import { pageMeta, paginationSchema, parseQuery } from "@/server/api/validation";
import {
  NOTIFICATIONS_PAGE_SIZE,
  getUnreadNotificationCount,
  listNotifications,
} from "@/server/services/notifications";

const notificationsQuerySchema = paginationSchema.extend({
  filter: z.preprocess(
    (value) =>
      typeof value === "string" && value.trim() !== ""
        ? value.trim().toUpperCase()
        : undefined,
    z.enum(["ALL", "UNREAD", "NOTICE"]).default("ALL"),
  ),
});

export async function GET(request: NextRequest) {
  try {
    const user = await requireApiUser();
    await enforceRateLimit(`notifications:list:${user.id}`, 120, 60);
    const query = parseQuery(request, notificationsQuerySchema);
    const pagination = {
      page: query.page,
      pageSize: NOTIFICATIONS_PAGE_SIZE,
    };
    const [result, unread] = await Promise.all([
      listNotifications(user.id, pagination, query.filter),
      getUnreadNotificationCount(user.id),
    ]);
    const response = apiOk(result.items, {
      ...pageMeta(result.total, pagination),
      unread,
    });
    response.headers.set("Cache-Control", "private, no-store");
    return response;
  } catch (error) {
    return apiError(error);
  }
}
