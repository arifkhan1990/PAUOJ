import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AssessmentForm } from "@/components/admin/assessment-form";
import { getAdminAssessmentDetail } from "@/server/services/admin-assessments";
import { listProblemOptions } from "@/server/services/problem-options";

export const metadata: Metadata = { title: "Edit assessment" };

export const dynamic = "force-dynamic";

export default async function EditAssessmentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [assessment, options] = await Promise.all([
    getAdminAssessmentDetail(id),
    listProblemOptions(),
  ]);
  if (!assessment) notFound();
  return <AssessmentForm initial={assessment} options={options} />;
}
