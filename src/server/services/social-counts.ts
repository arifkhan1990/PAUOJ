import type { SocialCounts } from "@/lib/social-types";
import { getUnreadMessageCount } from "./messages";
import { getUnreadNotificationCount } from "./notifications";
import { countPendingFollowRequests } from "./profile-follow-requests";

/**
 * The three dashboard social badges in one round trip. Each count is already
 * viewer-scoped and cached where it matters, so they run in parallel.
 */
export async function getSocialCounts(userId: string): Promise<SocialCounts> {
  const [messages, notifications, requests] = await Promise.all([
    getUnreadMessageCount(userId),
    getUnreadNotificationCount(userId),
    countPendingFollowRequests(userId),
  ]);
  return { messages, notifications, requests };
}
