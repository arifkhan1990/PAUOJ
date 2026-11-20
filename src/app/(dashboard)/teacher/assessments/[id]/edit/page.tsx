import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AssessmentForm } from "@/components/admin/assessment-form";
import { requireTeacher } from "@/server/auth/guards";
import { getAdminAssessmentDetail } from "@/server/services/admin-assessments";
import { listProblemOptions } from "@/server/services/problem-options";

export const metadata: Metadata = { title: "Edit assessment" };

export const dynamic = "force-dynamic";

export default async function EditTeacherAssessmentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const teacher = await requireTeacher();
  const { id } = await params;
  const ownerId = teacher.id;
  const [assessment, options] = await Promise.all([
    getAdminAssessmentDetail(id, ownerId),
    listProblemOptions(ownerId),
  ]);
  if (!assessment) notFound();
  return (
    <AssessmentForm
      initial={assessment}
      options={options}
      basePath="/teacher/assessments"
    />
  );
}
