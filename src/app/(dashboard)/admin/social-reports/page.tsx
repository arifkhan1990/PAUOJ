import type { Metadata } from "next";
import { PageHeader } from "@/components/shared/page-header";
import { Pagination } from "@/components/shared/pagination";
import {
  SocialReportQueue,
  type SocialReportCounts,
  type SocialReportFilter,
} from "@/features/moderation/social-report-queue";
import { firstValue, readPage, type SearchParams } from "@/lib/pagination";
import { requireAdmin } from "@/server/auth/guards";
import { listSocialReports } from "@/server/services/social-report-admin";

export const metadata: Metadata = {
  title: "Social reports",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

const FILTERS: SocialReportFilter[] = [
  "open",
  "resolved",
  "dismissed",
  "all",
];

const COUNTED: Exclude<SocialReportFilter, "all">[] = [
  "open",
  "resolved",
  "dismissed",
];

function parseStatus(value: string | undefined): SocialReportFilter {
  return FILTERS.find((filter) => filter === value) ?? "open";
}

/** Counts for every tab; the active tab reuses the list query's total. */
async function loadCounts(
  status: SocialReportFilter,
  activeTotal: number,
): Promise<SocialReportCounts> {
  const missing = COUNTED.filter((value) => value !== status);
  const totals = await Promise.all(
    missing.map(async (value) => {
      const result = await listSocialReports({ status: value, page: 1 });
      return [value, result.total] as const;
    }),
  );
  const counts: SocialReportCounts = {
    open: 0,
    resolved: 0,
    dismissed: 0,
    all: 0,
  };
  for (const [value, total] of totals) counts[value] = total;
  if (status !== "all") counts[status] = activeTotal;
  counts.all = counts.open + counts.resolved + counts.dismissed;
  return counts;
}

export default async function AdminSocialReportsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  await requireAdmin();
  const params = await searchParams;
  const status = parseStatus(firstValue(params.status));
  const page = readPage(params);
  const result = await listSocialReports({ status, page });
  const counts = await loadCounts(status, result.total);
  const pastEnd = result.items.length === 0 && result.total > 0;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Moderation"
        title="Social reports"
        description="Triage reported messages, conversations, profiles and follow requests, then record how each one was handled."
      />
      <SocialReportQueue
        items={result.items}
        status={status}
        counts={counts}
        total={result.total}
        searchParams={params}
        pastEnd={pastEnd}
      />
      {pastEnd ? null : (
        <Pagination
          pathname="/admin/social-reports"
          searchParams={params}
          page={result.page}
          totalPages={result.totalPages}
        />
      )}
    </div>
  );
}
