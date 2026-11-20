import type { Metadata } from "next";
import { ContestManagementView } from "@/components/admin/contest-management-view";
import { listAdminContests } from "@/server/services/admin-contests";
import { readPage, type SearchParams } from "@/lib/pagination";

export const metadata: Metadata = { title: "Manage contests" };

export const dynamic = "force-dynamic";

export default async function AdminContestsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const page = readPage(params);
  const pageSize = 20;
  const { items, total } = await listAdminContests({ page, pageSize });

  return (
    <ContestManagementView
      items={items}
      basePath="/admin/contests"
      params={params}
      page={page}
      totalPages={Math.max(1, Math.ceil(total / pageSize))}
      description={`${total} contest${total === 1 ? "" : "s"} scheduled or archived.`}
      showIntegrity
    />
  );
}
