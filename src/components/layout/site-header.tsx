import { getCurrentUser } from "@/server/auth/session";
import { getSocialCounts } from "@/server/services/social-counts";
import { PresenceHeartbeat } from "./presence-heartbeat";
import { HeaderNav } from "./header-nav";

export async function SiteHeader() {
  const user = await getCurrentUser();
  let hasSocialUnread = false;
  if (user) {
    try {
      const counts = await getSocialCounts(user.id);
      hasSocialUnread =
        counts.messages + counts.notifications + counts.requests > 0;
    } catch {
      // The awareness dot is best-effort and must never break the header.
    }
  }
  return (
    <>
      {user ? <PresenceHeartbeat /> : null}
      <HeaderNav
        hasSocialUnread={hasSocialUnread}
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
