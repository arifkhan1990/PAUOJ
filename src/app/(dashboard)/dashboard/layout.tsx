import { DashboardFrame } from "@/components/dashboard/dashboard-frame";
import { requireUser } from "@/server/auth/guards";
import { getUnreadMessageCount } from "@/server/services/messages";
import { getUnreadNotificationCount } from "@/server/services/notifications";
import { countPendingFollowRequests } from "@/server/services/profile-follow-requests";

export const dynamic = "force-dynamic";

export default async function CoderDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser("/dashboard");
  const [unreadMessages, unreadNotifications, pendingFollowRequests] =
    await Promise.all([
      getUnreadMessageCount(user.id),
      getUnreadNotificationCount(user.id),
      countPendingFollowRequests(user.id),
    ]);
  return (
    <DashboardFrame
      panel="CODER"
      role={user.role}
      displayName={user.displayName}
      username={user.username}
      avatarPreset={user.avatarPreset}
      avatarImageUpdatedAt={user.avatarImageUpdatedAt}
      unreadMessages={unreadMessages}
      unreadNotifications={unreadNotifications}
      pendingFollowRequests={pendingFollowRequests}
    >
      {children}
    </DashboardFrame>
  );
}
