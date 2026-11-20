import type { Metadata } from "next";
import { ContestManagementView } from "@/components/admin/contest-management-view";
import { requireTeacher } from "@/server/auth/guards";
import { listAdminContests } from "@/server/services/admin-contests";
import { readPage, type SearchParams } from "@/lib/pagination";

export const metadata: Metadata = { title: "My contests" };

export const dynamic = "force-dynamic";

export default async function TeacherContestsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const teacher = await requireTeacher();
  const params = await searchParams;
  const page = readPage(params);
  const pageSize = 20;
  const ownerId = teacher.id;
  const { items, total } = await listAdminContests(
    { page, pageSize },
    ownerId,
  );

  return (
    <ContestManagementView
      items={items}
      basePath="/teacher/contests"
      params={params}
      page={page}
      totalPages={Math.max(1, Math.ceil(total / pageSize))}
      description={`${total} contest${total === 1 ? "" : "s"} you created or scheduled.`}
      showIntegrity={false}
    />
  );
}
