import type { Metadata } from "next";
import { ContestManagementView } from "@/components/admin/contest-management-view";
import { listAdminContests } from "@/server/services/admin-contests";
import { listAdminContestHostRequests } from "@/server/services/contest-host-requests";
import { listContestSeries } from "@/server/services/contest-series";
import type { ContestSeriesView } from "@/lib/contest-ops";
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
  const [{ items, total }, series, submitted, underReview, approved] =
    await Promise.all([
      listAdminContests({ page, pageSize }),
      listContestSeries().catch((): ContestSeriesView[] => []),
      listAdminContestHostRequests({ page: 1, pageSize: 1 }, "SUBMITTED").catch(
        () => ({ items: [], total: 0 }),
      ),
      listAdminContestHostRequests({ page: 1, pageSize: 1 }, "UNDER_REVIEW").catch(
        () => ({ items: [], total: 0 }),
      ),
      listAdminContestHostRequests({ page: 1, pageSize: 1 }, "APPROVED").catch(
        () => ({ items: [], total: 0 }),
      ),
    ]);
  const pendingHostRequests =
    submitted.total + underReview.total + approved.total;

  return (
    <ContestManagementView
      items={items}
      basePath="/admin/contests"
      params={params}
      page={page}
      totalPages={Math.max(1, Math.ceil(total / pageSize))}
      description={`${total} contest${total === 1 ? "" : "s"} scheduled or archived.`}
      showIntegrity
      showOperations
      series={series}
      pendingHostRequests={pendingHostRequests}
    />
  );
}
