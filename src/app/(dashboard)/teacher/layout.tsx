import { DashboardFrame } from "@/components/dashboard/dashboard-frame";
import { requireTeacher } from "@/server/auth/guards";

export const dynamic = "force-dynamic";

export default async function TeacherLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const teacher = await requireTeacher();
  return (
    <DashboardFrame
      panel="TEACHER"
      role={teacher.role}
      displayName={teacher.displayName}
      username={teacher.username}
      avatarPreset={teacher.avatarPreset}
      avatarImageUpdatedAt={teacher.avatarImageUpdatedAt}
    >
      {children}
    </DashboardFrame>
  );
}
