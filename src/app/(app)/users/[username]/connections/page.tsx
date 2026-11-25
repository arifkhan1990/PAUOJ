import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";
import { ArrowLeft } from "lucide-react";
import { FollowConnectionsPanel } from "@/components/profile/follow-connections-panel";
import { UserAvatar } from "@/components/shared/user-avatar";
import { getCurrentUser } from "@/server/auth/session";
import {
  countPendingFollowRequests,
  listFollowConnections,
} from "@/server/services/profile-follows";
import type { FollowConnectionType } from "@/lib/follow-types";
import { followTabLabel, readFollowTab } from "@/lib/follow-tabs";
import { readPage, type SearchParams } from "@/lib/pagination";

const loadConnections = cache(
  (
    username: string,
    type: FollowConnectionType,
    page: number,
    viewerId: string | null,
  ) =>
    listFollowConnections(username, type, page, viewerId ? { id: viewerId } : null),
);

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ username: string }>;
  searchParams: Promise<SearchParams>;
}): Promise<Metadata> {
  const { username } = await params;
  const query = await searchParams;
  const type = readFollowTab(query.tab);
  const label = followTabLabel(type);
  const result = await loadConnections(username, type, 1, null);
  const owner = result ? result.owner.displayName : `@${username}`;
  return {
    title: `${owner} · ${label}`,
    description: `${owner}'s ${label.toLowerCase()} on PAU OJ.`,
    robots: { index: false, follow: true },
  };
}

export default async function FollowConnectionsPage({
  params,
  searchParams,
}: {
  params: Promise<{ username: string }>;
  searchParams: Promise<SearchParams>;
}) {
  const { username } = await params;
  const query = await searchParams;
  const type = readFollowTab(query.tab);
  const page = readPage(query);
  const viewer = await getCurrentUser();
  const result = await loadConnections(username, type, page, viewer?.id ?? null);
  if (!result) notFound();

  const { owner, items, total, page: currentPage, totalPages } = result;
  const isSelf = viewer?.username === owner.username;
  const pendingRequests =
    isSelf && viewer ? await countPendingFollowRequests(viewer.id) : 0;
  const pathname = `/users/${owner.username}/connections`;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <Link
        href={`/users/${owner.username}`}
        className="inline-flex min-h-11 items-center gap-1.5 rounded-md text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Back to @{owner.username}
      </Link>

      <div className="mt-5 flex items-center gap-3">
        <UserAvatar
          name={owner.displayName}
          username={owner.username}
          size="lg"
          className="ring-0"
          avatarPreset={owner.avatarPreset}
          avatarImageAt={owner.avatarImageUpdatedAt}
        />
        <div className="min-w-0">
          <h1 className="truncate text-xl font-bold tracking-tight sm:text-2xl">
            {owner.displayName}
          </h1>
          <p className="truncate font-mono text-xs text-muted-foreground">
            @{owner.username}
          </p>
        </div>
      </div>

      <FollowConnectionsPanel
        owner={owner}
        items={items}
        total={total}
        page={currentPage}
        totalPages={totalPages}
        type={type}
        pathname={pathname}
        isSelf={isSelf}
        pendingRequests={pendingRequests}
        canFollow={viewer !== null}
      />
    </div>
  );
}
