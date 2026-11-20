import type { Metadata } from "next";
import { AssessmentForm } from "@/components/admin/assessment-form";
import { listProblemOptions } from "@/server/services/problem-options";

export const metadata: Metadata = { title: "New assessment" };

export const dynamic = "force-dynamic";

export default async function NewAssessmentPage() {
  const options = await listProblemOptions();
  return <AssessmentForm initial={null} options={options} />;
}
