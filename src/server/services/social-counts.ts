import type { SocialCounts } from "@/lib/social-types";
import { countPendingPaymentOrders } from "./learning-payments";
import { getUnreadMessageCount } from "./messages";
import { getUnreadNotificationCount } from "./notifications";
import { countPendingFollowRequests } from "./profile-follow-requests";

/**
 * The dashboard social badges in one round trip. Each count is already
 * viewer-scoped and cached where it matters, so they run in parallel.
 * The access queue is admin-only, so non-admins resolve 0 without a query.
 */
export async function getSocialCounts(
  userId: string,
  isAdmin = false,
): Promise<SocialCounts> {
  const [messages, notifications, requests, access] = await Promise.all([
    getUnreadMessageCount(userId),
    getUnreadNotificationCount(userId),
    countPendingFollowRequests(userId),
    isAdmin ? countPendingPaymentOrders() : Promise.resolve(0),
  ]);
  return { messages, notifications, requests, access };
}
