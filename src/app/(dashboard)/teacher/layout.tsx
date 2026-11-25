import { DashboardFrame } from "@/components/dashboard/dashboard-frame";
import { requireTeacher } from "@/server/auth/guards";
import { getSocialCounts } from "@/server/services/social-counts";

export const dynamic = "force-dynamic";

export default async function TeacherLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const teacher = await requireTeacher();
  const counts = await getSocialCounts(teacher.id);
  return (
    <DashboardFrame
      panel="TEACHER"
      role={teacher.role}
      displayName={teacher.displayName}
      username={teacher.username}
      avatarPreset={teacher.avatarPreset}
      avatarImageUpdatedAt={teacher.avatarImageUpdatedAt}
      unreadMessages={counts.messages}
      unreadNotifications={counts.notifications}
      pendingFollowRequests={counts.requests}
    >
      {children}
    </DashboardFrame>
  );
}
