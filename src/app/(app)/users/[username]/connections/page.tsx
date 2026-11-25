import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";
import {
  ArrowLeft,
  Inbox,
  TrendingUp,
  UserRoundPlus,
  Users,
} from "lucide-react";
import { FollowButton } from "@/components/profile/follow-button";
import { PresenceIndicator } from "@/components/profile/presence-indicator";
import { ProfileShareButton } from "@/components/profile/profile-share-button";
import { EmptyState } from "@/components/shared/empty-state";
import { Pagination } from "@/components/shared/pagination";
import { UserAvatar } from "@/components/shared/user-avatar";
import { buttonVariants } from "@/components/ui/button";
import { getCurrentUser } from "@/server/auth/session";
import {
  countPendingFollowRequests,
  listFollowConnections,
} from "@/server/services/profile-follows";
import type { FollowConnectionType } from "@/lib/follow-types";
import { followStateForItem } from "@/lib/follow-state";
import { followTabLabel, readFollowTab } from "@/lib/follow-tabs";
import { readPage, type SearchParams } from "@/lib/pagination";
import { cn } from "@/lib/utils";

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
  const countNoun =
    type === "followers"
      ? total === 1
        ? "follower"
        : "followers"
      : "following";
  const emptyState =
    total > 0
      ? {
          title: "Nothing on this page",
          description: "This page is past the end of the list.",
          action: (
            <Link
              href={`${pathname}?tab=${type}`}
              className={cn(buttonVariants({ variant: "outline" }), "h-11")}
            >
              Back to page 1
            </Link>
          ),
        }
      : {
          title:
            type === "followers" ? "No followers yet" : "Not following anyone yet",
          description:
            type === "followers"
              ? isSelf
                ? "Share your profile or keep solving to get noticed."
                : `@${owner.username} has not gained followers yet.`
              : isSelf
                ? "Follow coders to keep their activity close."
                : `@${owner.username} is not following anyone yet.`,
          action: isSelf ? (
            type === "followers" ? (
              <ProfileShareButton
                username={owner.username}
                displayName={owner.displayName}
              />
            ) : (
              <Link href="/rank" className={cn(buttonVariants(), "h-11")}>
                Browse top coders
              </Link>
            )
          ) : undefined,
        };

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

      <nav
        aria-label="Follow connections"
        className="mt-5 flex flex-wrap gap-1 border-b border-border"
      >
        {(["followers", "following"] as const).map((value) => {
          const active = value === type;
          return (
            <Link
              key={value}
              href={`${pathname}?tab=${value}`}
              aria-current={active ? "page" : undefined}
              className={cn(
                "inline-flex min-h-11 items-center rounded-t-md border-b-2 px-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                active
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:border-border hover:text-foreground",
              )}
            >
              {followTabLabel(value)}
            </Link>
          );
        })}
      </nav>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
        <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
          {total.toLocaleString("en-US")} {countNoun}
        </p>
        {isSelf ? (
          <Link
            href="/connections/requests"
            className={cn(
              buttonVariants({ variant: "outline" }),
              "h-11 gap-1.5 rounded-lg px-3 text-xs",
            )}
          >
            <Inbox className="size-3.5" aria-hidden="true" />
            Follow requests ({pendingRequests.toLocaleString("en-US")})
          </Link>
        ) : null}
      </div>

      {items.length === 0 ? (
        <EmptyState
          className="mt-4"
          icon={type === "followers" ? Users : UserRoundPlus}
          title={emptyState.title}
          description={emptyState.description}
          action={emptyState.action}
        />
      ) : (
        <ul className="mt-4 divide-y divide-border overflow-hidden rounded-xl border border-border bg-card shadow-sm">
          {items.map((item) => (
            <li
              key={item.username}
              className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 px-4 py-3"
            >
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <UserAvatar
                  name={item.displayName}
                  username={item.username}
                  size="md"
                  avatarPreset={item.avatarPreset}
                  avatarImageAt={item.avatarImageUpdatedAt}
                />
                <div className="min-w-0">
                  <Link
                    href={`/users/${item.username}`}
                    className="block truncate text-sm font-medium transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                  >
                    {item.displayName}
                  </Link>
                  <p className="truncate font-mono text-xs text-muted-foreground">
                    @{item.username}
                  </p>
                  {item.institution ? (
                    <p className="truncate text-xs text-muted-foreground">
                      {item.institution}
                    </p>
                  ) : null}
                  <div className="mt-0.5">
                    <PresenceIndicator
                      presence={item.presence}
                      variant="compact"
                    />
                  </div>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <span className="inline-flex items-center gap-1 rounded-full border border-border bg-muted/40 px-2 py-1 font-mono text-[11px] font-medium tabular-nums">
                  <TrendingUp
                    className="size-3 text-muted-foreground"
                    aria-hidden="true"
                  />
                  <span className="sr-only">Rating </span>
                  {item.rating.toLocaleString("en-US")}
                </span>
                {item.isSelf ? null : viewer ? (
                  <FollowButton
                    username={item.username}
                    initialState={followStateForItem(item)}
                  />
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}

      <Pagination
        pathname={pathname}
        searchParams={{ tab: type }}
        page={currentPage}
        totalPages={totalPages}
      />
    </div>
  );
}
