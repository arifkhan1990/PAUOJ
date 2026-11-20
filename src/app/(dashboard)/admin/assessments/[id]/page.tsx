import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AssessmentResultsView } from "@/components/admin/assessment-results-view";
import { getAssessmentResults } from "@/server/services/admin-assessments";

export const metadata: Metadata = { title: "Assessment results" };

export const dynamic = "force-dynamic";

export default async function AssessmentResultsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const results = await getAssessmentResults(id);
  if (!results) notFound();

  return (
    <AssessmentResultsView results={results} basePath="/admin/assessments" />
  );
}
