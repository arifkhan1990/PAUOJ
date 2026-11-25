import type { ReactNode } from "react";
import Link from "next/link";
import { Inbox, TrendingUp, UserRoundPlus, Users } from "lucide-react";
import { FollowButton } from "@/components/profile/follow-button";
import { PresenceIndicator } from "@/components/profile/presence-indicator";
import { ProfileShareButton } from "@/components/profile/profile-share-button";
import { EmptyState } from "@/components/shared/empty-state";
import { Pagination } from "@/components/shared/pagination";
import { UserAvatar } from "@/components/shared/user-avatar";
import { buttonVariants } from "@/components/ui/button";
import type { FollowConnectionType, FollowUserItem } from "@/lib/follow-types";
import { followStateForItem } from "@/lib/follow-state";
import { followTabLabel } from "@/lib/follow-tabs";
import { cn } from "@/lib/utils";

const FOLLOW_TABS = [
  "followers",
  "following",
] as const satisfies readonly FollowConnectionType[];

const REQUESTS_PATH = "/dashboard/connections/requests";

type PanelOwner = {
  username: string;
  displayName: string;
};

type EmptyCopy = {
  title: string;
  description: string;
  action?: ReactNode;
};

function countLabel(type: FollowConnectionType, total: number): string {
  return type === "followers"
    ? total === 1
      ? "follower"
      : "followers"
    : "following";
}

function emptyCopy({
  type,
  total,
  owner,
  pathname,
  isSelf,
}: {
  type: FollowConnectionType;
  total: number;
  owner: PanelOwner;
  pathname: string;
  isSelf: boolean;
}): EmptyCopy {
  if (total > 0) {
    return {
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
    };
  }

  const title =
    type === "followers" ? "No followers yet" : "Not following anyone yet";
  const description =
    type === "followers"
      ? isSelf
        ? "Share your profile or keep solving to get noticed."
        : `@${owner.username} has not gained followers yet.`
      : isSelf
        ? "Follow coders to keep their activity close."
        : `@${owner.username} is not following anyone yet.`;

  if (!isSelf) return { title, description };
  return {
    title,
    description,
    action:
      type === "followers" ? (
        <ProfileShareButton
          username={owner.username}
          displayName={owner.displayName}
        />
      ) : (
        <Link href="/rank" className={cn(buttonVariants(), "h-11")}>
          Browse top coders
        </Link>
      ),
  };
}

export function FollowConnectionsPanel({
  owner,
  items,
  total,
  page,
  totalPages,
  type,
  pathname,
  isSelf,
  pendingRequests,
  canFollow,
}: {
  owner: PanelOwner;
  items: FollowUserItem[];
  total: number;
  page: number;
  totalPages: number;
  type: FollowConnectionType;
  pathname: string;
  isSelf: boolean;
  pendingRequests: number;
  canFollow: boolean;
}) {
  const empty = emptyCopy({ type, total, owner, pathname, isSelf });

  return (
    <>
      <nav
        aria-label="Follow connections"
        className="mt-5 flex flex-wrap gap-1 border-b border-border"
      >
        {FOLLOW_TABS.map((value) => {
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
          {total.toLocaleString("en-US")} {countLabel(type, total)}
        </p>
        {isSelf ? (
          <Link
            href={REQUESTS_PATH}
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
          title={empty.title}
          description={empty.description}
          action={empty.action}
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
                {item.isSelf || !canFollow ? null : (
                  <FollowButton
                    username={item.username}
                    initialState={followStateForItem(item)}
                  />
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      <Pagination
        pathname={pathname}
        searchParams={{ tab: type }}
        page={page}
        totalPages={totalPages}
      />
    </>
  );
}
