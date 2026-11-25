import { getCurrentUser } from "@/server/auth/session";
import { getUnreadMessageCount } from "@/server/services/messages";
import { getUnreadNotificationCount } from "@/server/services/notifications";
import { PresenceHeartbeat } from "./presence-heartbeat";
import { HeaderNav } from "./header-nav";

export async function SiteHeader() {
  const user = await getCurrentUser();
  const [unreadNotifications, unreadMessages] = user
    ? await Promise.all([
        getUnreadNotificationCount(user.id),
        getUnreadMessageCount(user.id),
      ])
    : [0, 0];
  return (
    <>
      {user ? <PresenceHeartbeat /> : null}
      <HeaderNav
        unreadNotifications={unreadNotifications}
        unreadMessages={unreadMessages}
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
