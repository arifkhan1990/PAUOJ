import type { Metadata } from "next";
import { ContributionsInboxView } from "@/features/contributions/contributions-inbox-view";
import { requireTeacher } from "@/server/auth/guards";

export const metadata: Metadata = { title: "Contributions" };

export const dynamic = "force-dynamic";

export default async function TeacherContributionsPage() {
  const teacher = await requireTeacher();
  return <ContributionsInboxView viewer={teacher} panel="teacher" />;
}
