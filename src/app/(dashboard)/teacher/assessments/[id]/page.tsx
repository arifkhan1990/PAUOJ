import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AssessmentResultsView } from "@/components/admin/assessment-results-view";
import { requireTeacher } from "@/server/auth/guards";
import { getAssessmentResults } from "@/server/services/admin-assessments";

export const metadata: Metadata = { title: "Assessment results" };

export const dynamic = "force-dynamic";

export default async function TeacherAssessmentResultsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const teacher = await requireTeacher();
  const { id } = await params;
  const ownerId = teacher.id;
  const results = await getAssessmentResults(id, ownerId);
  if (!results) notFound();

  return (
    <AssessmentResultsView
      results={results}
      basePath="/teacher/assessments"
    />
  );
}
