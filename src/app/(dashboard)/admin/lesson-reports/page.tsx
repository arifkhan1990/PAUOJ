import type { Metadata } from "next";
import { LessonReportQueue } from "@/components/admin/lesson-report-queue";
import { PageHeader } from "@/components/shared/page-header";

export const metadata: Metadata = {
  title: "Lesson reports",
};

export const dynamic = "force-dynamic";

export default function AdminLessonReportsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Moderation"
        title="Lesson reports"
        description="Review reported lesson comments, open the discussion and resolve each report once handled."
      />
      <LessonReportQueue />
    </div>
  );
}
