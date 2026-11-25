import { DashboardFrame } from "@/components/dashboard/dashboard-frame";
import { requireAdmin } from "@/server/auth/guards";
import { getSocialCounts } from "@/server/services/social-counts";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const admin = await requireAdmin();
  const counts = await getSocialCounts(admin.id);
  return (
    <DashboardFrame
      panel="ADMIN"
      role={admin.role}
      displayName={admin.displayName}
      username={admin.username}
      avatarPreset={admin.avatarPreset}
      avatarImageUpdatedAt={admin.avatarImageUpdatedAt}
      unreadMessages={counts.messages}
      unreadNotifications={counts.notifications}
      pendingFollowRequests={counts.requests}
    >
      {children}
    </DashboardFrame>
  );
}
