import { headers } from "next/headers";
import { DashboardFrame } from "@/components/dashboard/dashboard-frame";
import { requireUser } from "@/server/auth/guards";
import { getSocialCounts } from "@/server/services/social-counts";

export const dynamic = "force-dynamic";

export default async function CoderDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Keep the exact deep link (path + query) so signing in returns here.
  const headerList = await headers();
  const nextPath = headerList.get("x-pathname") || "/dashboard";
  const user = await requireUser(nextPath);
  const counts = await getSocialCounts(user.id);
  return (
    <DashboardFrame
      panel="CODER"
      role={user.role}
      displayName={user.displayName}
      username={user.username}
      avatarPreset={user.avatarPreset}
      avatarImageUpdatedAt={user.avatarImageUpdatedAt}
      unreadMessages={counts.messages}
      unreadNotifications={counts.notifications}
      pendingFollowRequests={counts.requests}
    >
      {children}
    </DashboardFrame>
  );
}
