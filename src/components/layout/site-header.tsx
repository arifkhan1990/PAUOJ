import { getCurrentUser } from "@/server/auth/session";
import { PresenceHeartbeat } from "./presence-heartbeat";
import { HeaderNav } from "./header-nav";

export async function SiteHeader() {
  const user = await getCurrentUser();
  return (
    <>
      {user ? <PresenceHeartbeat /> : null}
      <HeaderNav
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
