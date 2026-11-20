import type { Metadata } from "next";
import { ProblemContributionsView } from "@/features/contributions/problem-contributions-view";
import { requireTeacher } from "@/server/auth/guards";

export const metadata: Metadata = { title: "Problem proposals" };

export const dynamic = "force-dynamic";

export default async function TeacherProblemContributionsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const teacher = await requireTeacher();
  const { id } = await params;
  return (
    <ProblemContributionsView
      problemId={id}
      viewer={teacher}
      editHref={`/teacher/problems/${id}/edit`}
      backHref="/teacher/contributions"
    />
  );
}
