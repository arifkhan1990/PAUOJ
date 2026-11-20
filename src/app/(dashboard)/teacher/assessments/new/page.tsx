import type { Metadata } from "next";
import { AssessmentForm } from "@/components/admin/assessment-form";
import { requireTeacher } from "@/server/auth/guards";
import { listProblemOptions } from "@/server/services/problem-options";

export const metadata: Metadata = { title: "New assessment" };

export const dynamic = "force-dynamic";

export default async function NewTeacherAssessmentPage() {
  const teacher = await requireTeacher();
  const options = await listProblemOptions(
    teacher.id,
  );
  return (
    <AssessmentForm
      initial={null}
      options={options}
      basePath="/teacher/assessments"
    />
  );
}
