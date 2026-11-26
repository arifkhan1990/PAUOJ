import { getCurrentUser } from "@/server/auth/session";
import { getSocialCounts } from "@/server/services/social-counts";
import { PresenceHeartbeat } from "./presence-heartbeat";
import { HeaderNav } from "./header-nav";

export async function SiteHeader() {
  const user = await getCurrentUser();
  let hasSocialUnread = false;
  let unreadNotifications = 0;
  if (user) {
    try {
      const counts = await getSocialCounts(user.id);
      unreadNotifications = counts.notifications;
      hasSocialUnread = counts.messages + counts.requests > 0;
    } catch {
      // Best-effort awareness dots must never break the header.
    }
  }
  return (
    <>
      {user ? <PresenceHeartbeat /> : null}
      <HeaderNav
        hasSocialUnread={hasSocialUnread}
        unreadNotifications={unreadNotifications}
        user={
          user
            ? {
                id: user.id,
                username: user.username,
                displayName: user.displayName,
                role: user.role,
                emailVerified: Boolean(user.emailVerifiedAt),
                avatarPreset: user.avatarPreset,
                avatarImageUpdatedAt: user.avatarImageUpdatedAt,
              }
            : null
        }
      />
    </>
  );
}
