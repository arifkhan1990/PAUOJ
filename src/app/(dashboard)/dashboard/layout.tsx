import { DashboardFrame } from "@/components/dashboard/dashboard-frame";
import { requireUser } from "@/server/auth/guards";

export const dynamic = "force-dynamic";

export default async function CoderDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser("/dashboard");
  return (
    <DashboardFrame
      panel="CODER"
      role={user.role}
      displayName={user.displayName}
      username={user.username}
      avatarPreset={user.avatarPreset}
      avatarImageUpdatedAt={user.avatarImageUpdatedAt}
    >
      {children}
    </DashboardFrame>
  );
}
