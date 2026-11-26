"use client";

import Link from "next/link";
import {
  AlertTriangle,
  Bell,
  CheckCheck,
  Loader2,
  Megaphone,
  X,
} from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";
import { Button, buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { TabBar, tabId } from "@/components/ui/tab-bar";
import type { NotificationFilter, NotificationItem } from "@/lib/notification-types";
import { cn } from "@/lib/utils";
import { groupByLocalDay } from "./notification-date-groups";
import type { NotificationListMeta } from "./notification-api";
import { NotificationRow } from "./notification-row";

export type NotificationActionNotice = {
  kind: "success" | "error";
  message: string;
};

export type NotificationFeedView = {
  items: NotificationItem[];
  meta: NotificationListMeta;
  /** Total across all filters, kept from the ALL tab so counts stay stable. */
  allTotal: number;
  status: "loading" | "ready" | "error";
  error: string | null;
  loadingMore: boolean;
  markingAll: boolean;
  /** Inline feedback; toasts cannot render above a native dialog's top layer. */
  notice: NotificationActionNotice | null;
  onDismissNotice: () => void;
};

const PANEL_ID = "notification-drawer-panel";

const footerLinkClass =
  "inline-flex min-h-11 items-center gap-1 rounded-sm text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring lg:min-h-9";

function SkeletonRows() {
  return (
    <ul aria-hidden="true" className="divide-y divide-border">
      {[0, 1, 2, 3, 4].map((index) => (
        <li key={index} className="flex gap-3 px-4 py-3">
          <Skeleton className="size-9 shrink-0 rounded-full" />
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-3.5 w-3/5" />
            <Skeleton className="h-3 w-4/5" />
          </div>
        </li>
      ))}
    </ul>
  );
}

function TabEmptyState({ tab }: { tab: NotificationFilter }) {
  if (tab === "UNREAD") {
    return (
      <EmptyState
        title="You're all caught up"
        description="No unread notifications right now."
        icon={CheckCheck}
        action={
          <Link href="/problems" className={buttonVariants()}>
            Browse problems
          </Link>
        }
      />
    );
  }
  if (tab === "NOTICE") {
    return (
      <EmptyState
        title="No notices yet"
        description="Announcements and contest news will show up here."
        icon={Megaphone}
        action={
          <Link href="/contests" className={buttonVariants()}>
            View contests
          </Link>
        }
      />
    );
  }
  return (
    <EmptyState
      title="No notifications yet"
      description="Join a contest, submit a solution or start a learning module to see updates here."
      icon={Bell}
      action={
        <Link href="/problems" className={buttonVariants()}>
          Browse problems
        </Link>
      }
    />
  );
}

/** Signed-in drawer body: filter tabs, grouped rows, load more and footer links. */
export function NotificationDrawerContent({
  feed,
  activeTab,
  onTabChange,
  onRetry,
  onLoadMore,
  onMarkAllRead,
  onMarkRead,
  onNavigate,
}: {
  feed: NotificationFeedView;
  activeTab: NotificationFilter;
  onTabChange: (tab: NotificationFilter) => void;
  onRetry: () => void;
  onLoadMore: () => void;
  onMarkAllRead: () => void;
  onMarkRead: (item: NotificationItem) => void;
  onNavigate: () => void;
}) {
  const groups = groupByLocalDay(feed.items);
  const hasItems = feed.items.length > 0;
  const showSkeleton = feed.status === "loading" && !hasItems;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="shrink-0 space-y-2 border-b border-border px-4 py-3">
        <TabBar
          idPrefix="notification-drawer"
          ariaLabel="Notification filters"
          items={[
            { value: "ALL", label: "All", count: feed.allTotal },
            { value: "UNREAD", label: "Unread", count: feed.meta.unread },
            { value: "NOTICE", label: "Notices" },
          ]}
          value={activeTab}
          onChange={(value) =>
            onTabChange(
              value === "UNREAD" || value === "NOTICE" ? value : "ALL",
            )
          }
          panelId={PANEL_ID}
        />
        {feed.markingAll || feed.meta.unread > 0 ? (
          <div className="flex justify-end">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onMarkAllRead}
              disabled={feed.markingAll}
              aria-busy={feed.markingAll}
              className="min-h-11 lg:min-h-8"
            >
              {feed.markingAll ? (
                <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
              ) : (
                <CheckCheck className="size-3.5" aria-hidden="true" />
              )}
              {feed.markingAll ? "Marking read…" : "Mark all read"}
            </Button>
          </div>
        ) : null}
      </div>

      {feed.notice ? (
        <div
          role={feed.notice.kind === "error" ? "alert" : "status"}
          className={cn(
            "flex shrink-0 items-start gap-2 border-b border-border px-4 py-2 text-xs",
            feed.notice.kind === "error"
              ? "bg-destructive/10 text-destructive"
              : "bg-primary/10 text-primary",
          )}
        >
          {feed.notice.kind === "error" ? (
            <AlertTriangle className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
          ) : (
            <CheckCheck className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
          )}
          <p className="min-w-0 flex-1 break-words">{feed.notice.message}</p>
          <button
            type="button"
            onClick={feed.onDismissNotice}
            aria-label="Dismiss message"
            className="-my-1 grid size-8 shrink-0 place-items-center rounded-md transition-colors hover:bg-background/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <X className="size-3.5" aria-hidden="true" />
          </button>
        </div>
      ) : null}

      <div
        id={PANEL_ID}
        role="tabpanel"
        aria-labelledby={tabId("notification-drawer", activeTab)}
        tabIndex={0}
        className="reference-scroll min-h-0 flex-1 overflow-y-auto overscroll-contain focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
      >
        {showSkeleton ? (
          <div role="status" aria-label="Loading notifications">
            <span className="sr-only">Loading notifications…</span>
            <SkeletonRows />
          </div>
        ) : feed.status === "error" && !hasItems ? (
          <div className="p-4">
            <EmptyState
              title="Could not load notifications"
              description={feed.error ?? "Something went wrong. Please try again."}
              icon={AlertTriangle}
              action={
                <Button type="button" variant="outline" onClick={onRetry}>
                  Retry
                </Button>
              }
            />
          </div>
        ) : !hasItems ? (
          <div className="p-4">
            <TabEmptyState tab={activeTab} />
          </div>
        ) : (
          <>
            {groups.map((group) => (
              <section key={group.key} aria-label={group.label}>
                <h3 className="sticky top-0 z-10 border-b border-border bg-card/95 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground backdrop-blur">
                  {group.label}
                </h3>
                <ul className="divide-y divide-border">
                  {group.items.map((item) => (
                    <NotificationRow
                      key={item.id}
                      item={item}
                      onRead={onMarkRead}
                    />
                  ))}
                </ul>
              </section>
            ))}
            {feed.meta.page < feed.meta.totalPages ? (
              <div className="px-4 py-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onLoadMore}
                  disabled={feed.loadingMore}
                  className="min-h-11 w-full"
                >
                  {feed.loadingMore ? (
                    <>
                      <Loader2
                        className="size-3.5 animate-spin"
                        aria-hidden="true"
                      />
                      Loading…
                    </>
                  ) : (
                    "Load more"
                  )}
                </Button>
              </div>
            ) : null}
          </>
        )}
      </div>

      <footer className="shrink-0 border-t border-border px-4 py-2">
        <div className="flex flex-wrap items-center justify-between gap-x-4">
          <Link
            href="/dashboard/notifications"
            onClick={onNavigate}
            className={`${footerLinkClass} text-primary hover:underline`}
          >
            View all notifications
          </Link>
          <Link
            href="/settings#notifications"
            onClick={onNavigate}
            className={`${footerLinkClass} text-muted-foreground hover:text-foreground`}
          >
            Preferences
          </Link>
        </div>
      </footer>
    </div>
  );
}
