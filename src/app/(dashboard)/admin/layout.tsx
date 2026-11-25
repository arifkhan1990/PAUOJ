import { DashboardFrame } from "@/components/dashboard/dashboard-frame";
import { requireAdmin } from "@/server/auth/guards";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const admin = await requireAdmin();
  return (
    <DashboardFrame
      panel="ADMIN"
      role={admin.role}
      displayName={admin.displayName}
      username={admin.username}
      avatarPreset={admin.avatarPreset}
      avatarImageUpdatedAt={admin.avatarImageUpdatedAt}
    >
      {children}
    </DashboardFrame>
  );
}
