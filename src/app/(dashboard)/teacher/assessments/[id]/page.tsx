import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AssessmentResultsView } from "@/components/admin/assessment-results-view";
import { AssessmentRosterPanel } from "@/components/admin/assessment-roster-panel";
import { requireTeacher } from "@/server/auth/guards";
import {
  getAdminAssessmentDetail,
  getAssessmentResults,
} from "@/server/services/admin-assessments";
import { listInvites } from "@/server/services/assessment-invites";

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
  const [results, detail] = await Promise.all([
    getAssessmentResults(id, ownerId),
    getAdminAssessmentDetail(id, ownerId),
  ]);
  if (!results || !detail) notFound();
  const invites = await listInvites(id, ownerId);

  return (
    <div className="space-y-8">
      <AssessmentResultsView
        results={results}
        basePath="/teacher/assessments"
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
