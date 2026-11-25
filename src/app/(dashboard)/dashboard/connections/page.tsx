import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { FollowConnectionsPanel } from "@/components/profile/follow-connections-panel";
import { PageHeader } from "@/components/shared/page-header";
import { requireUser } from "@/server/auth/guards";
import {
  countPendingFollowRequests,
  listFollowConnections,
} from "@/server/services/profile-follows";
import { readFollowTab } from "@/lib/follow-tabs";
import { readPage, type SearchParams } from "@/lib/pagination";

export const metadata: Metadata = {
  title: "Connections",
  description: "Coders you follow and coders who follow you on PAU OJ.",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function DashboardConnectionsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const user = await requireUser("/dashboard/connections");
  const query = await searchParams;
  const type = readFollowTab(query.tab);
  const page = readPage(query);
  const [result, pendingRequests] = await Promise.all([
    listFollowConnections(user.username, type, page, { id: user.id }),
    countPendingFollowRequests(user.id),
  ]);
  if (!result) notFound();

  return (
    <div className="max-w-3xl">
      <PageHeader
        eyebrow="Connections"
        title="Your connections"
        description="Coders you follow and coders who follow you. Accepting a follow request opens private messaging."
      />

      <FollowConnectionsPanel
        owner={result.owner}
        items={result.items}
        total={result.total}
        page={result.page}
        totalPages={result.totalPages}
        type={type}
        pathname="/dashboard/connections"
        isSelf
        pendingRequests={pendingRequests}
        canFollow
      />
    </div>
  );
}
