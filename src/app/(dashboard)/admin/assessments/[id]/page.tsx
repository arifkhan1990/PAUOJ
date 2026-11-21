import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AssessmentResultsView } from "@/components/admin/assessment-results-view";
import { AssessmentRosterPanel } from "@/components/admin/assessment-roster-panel";
import {
  getAdminAssessmentDetail,
  getAssessmentResults,
} from "@/server/services/admin-assessments";
import { listInvites } from "@/server/services/assessment-invites";

export const metadata: Metadata = { title: "Assessment results" };

export const dynamic = "force-dynamic";

export default async function AssessmentResultsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [results, detail] = await Promise.all([
    getAssessmentResults(id),
    getAdminAssessmentDetail(id),
  ]);
  if (!results || !detail) notFound();
  const invites = await listInvites(id);

  return (
    <div className="space-y-8">
      <AssessmentResultsView
        results={results}
        basePath="/admin/assessments"
        joinMode={detail.joinMode}
      />
      <AssessmentRosterPanel
        assessmentId={detail.id}
        assessmentSlug={detail.slug}
        joinMode={detail.joinMode}
        initialInvites={invites}
      />
    </div>
  );
}
