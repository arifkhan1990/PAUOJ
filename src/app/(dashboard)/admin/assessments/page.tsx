import type { Metadata } from "next";
import { AssessmentManagementView } from "@/components/admin/assessment-management-view";
import { listAdminAssessments } from "@/server/services/admin-assessments";
import { readPage, type SearchParams } from "@/lib/pagination";

export const metadata: Metadata = { title: "Coding assessments" };

export const dynamic = "force-dynamic";

export default async function AdminAssessmentsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const page = readPage(params);
  const pageSize = 20;
  const { items, total } = await listAdminAssessments({ page, pageSize });

  return (
    <AssessmentManagementView
      items={items}
      basePath="/admin/assessments"
      params={params}
      page={page}
      totalPages={Math.max(1, Math.ceil(total / pageSize))}
      description={`${total} private assessment${total === 1 ? "" : "s"}. Share the code, candidates join with a timer, you review results.`}
    />
  );
}
