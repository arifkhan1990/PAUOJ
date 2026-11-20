import type { Metadata } from "next";
import { ProblemManagementView } from "@/components/admin/problem-management-view";
import { listAdminProblems } from "@/server/services/admin-problems";
import { firstValue, readPage, type SearchParams } from "@/lib/pagination";

export const metadata: Metadata = { title: "Manage problems" };

export const dynamic = "force-dynamic";

export default async function AdminProblemsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const page = readPage(params);
  const pageSize = 20;
  const q = firstValue(params.q)?.trim().slice(0, 100) || undefined;
  const { items, total } = await listAdminProblems({ page, pageSize }, q);

  return (
    <ProblemManagementView
      items={items}
      q={q}
      basePath="/admin/problems"
      params={params}
      page={page}
      totalPages={Math.max(1, Math.ceil(total / pageSize))}
      description={`${total} problem${total === 1 ? "" : "s"} in the judge.`}
    />
  );
}
