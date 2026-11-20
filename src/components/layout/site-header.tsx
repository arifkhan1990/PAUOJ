import { getCurrentUser } from "@/server/auth/session";
import { getUnreadNotificationCount } from "@/server/services/notifications";
import { HeaderNav } from "./header-nav";

export async function SiteHeader() {
  const user = await getCurrentUser();
  const unreadNotifications = user
    ? await getUnreadNotificationCount(user.id)
    : 0;
  return (
    <HeaderNav
      unreadNotifications={unreadNotifications}
      user={
        user
          ? {
              id: user.id,
              username: user.username,
              displayName: user.displayName,
              role: user.role,
              emailVerified: Boolean(user.emailVerifiedAt),
            }
          : null
      }
    />
  );
}
