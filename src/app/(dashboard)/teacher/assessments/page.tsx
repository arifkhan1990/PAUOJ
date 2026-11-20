import type { Metadata } from "next";
import { AssessmentManagementView } from "@/components/admin/assessment-management-view";
import { requireTeacher } from "@/server/auth/guards";
import { listAdminAssessments } from "@/server/services/admin-assessments";
import { readPage, type SearchParams } from "@/lib/pagination";

export const metadata: Metadata = { title: "My assessments" };

export const dynamic = "force-dynamic";

export default async function TeacherAssessmentsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const teacher = await requireTeacher();
  const params = await searchParams;
  const page = readPage(params);
  const pageSize = 20;
  const ownerId = teacher.id;
  const { items, total } = await listAdminAssessments(
    { page, pageSize },
    ownerId,
  );

  return (
    <AssessmentManagementView
      items={items}
      basePath="/teacher/assessments"
      params={params}
      page={page}
      totalPages={Math.max(1, Math.ceil(total / pageSize))}
      description={`${total} private assessment${total === 1 ? "" : "s"} created by you.`}
    />
  );
}
