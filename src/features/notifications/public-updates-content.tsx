"use client";

import Link from "next/link";
import { AlertTriangle, CalendarClock, Megaphone } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { TabBar, tabId } from "@/components/ui/tab-bar";
import type { ContestListItem } from "@/lib/contest-detail-types";
import type { PublicAnnouncement } from "@/lib/notification-types";
import {
  cn,
  formatDhakaDateTimeShort,
  formatRelative,
  safeHttpUrl,
} from "@/lib/utils";

export type PublicUpdatesTab = "announcements" | "contests";
export type PublicLoadStatus = "loading" | "ready" | "error";

export type PublicAnnouncementState = {
  status: PublicLoadStatus;
  items: PublicAnnouncement[];
};

export type PublicContestState = {
  status: PublicLoadStatus;
  items: ContestListItem[];
};

const PANEL_ID = "public-updates-panel";

const footerLinkClass =
  "inline-flex min-h-11 items-center gap-1 rounded-sm text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring lg:min-h-9";

type SafeHref =
  | { kind: "internal"; href: string }
  | { kind: "external"; href: string };

/** Internal paths and absolute http(s) URLs only; drops javascript: and friends. */
export function announcementHref(
  href: string | null | undefined,
): SafeHref | null {
  const raw = href?.trim();
  if (!raw) return null;
  if (raw.startsWith("/") && !raw.startsWith("//")) {
    return { kind: "internal", href: raw };
  }
  const external = safeHttpUrl(raw);
  return external ? { kind: "external", href: external } : null;
}

function PublicSkeletonRows({ rows = 3 }: { rows?: number }) {
  return (
    <ul aria-hidden="true" className="divide-y divide-border">
      {Array.from({ length: rows }, (_, index) => (
        <li key={index} className="space-y-2 px-4 py-3">
          <Skeleton className="h-3.5 w-2/3" />
          <Skeleton className="h-3 w-full" />
        </li>
      ))}
    </ul>
  );
}

function AnnouncementList({
  state,
  onRetry,
  onNavigate,
}: {
  state: PublicAnnouncementState;
  onRetry: () => void;
  onNavigate: () => void;
}) {
  if (state.status === "loading" && state.items.length === 0) {
    return (
      <div role="status" aria-label="Loading announcements">
        <span className="sr-only">Loading announcements…</span>
        <PublicSkeletonRows />
      </div>
    );
  }
  if (state.status === "error" && state.items.length === 0) {
    return (
      <div className="p-4">
        <EmptyState
          title="Could not load announcements"
          description="Please check your connection and try again."
          icon={AlertTriangle}
          action={
            <Button type="button" variant="outline" onClick={onRetry}>
              Retry
            </Button>
          }
        />
      </div>
    );
  }
  if (state.items.length === 0) {
    return (
      <div className="p-4">
        <EmptyState
          title="No announcements right now"
          description="Notices from the team will appear here."
          icon={Megaphone}
        />
      </div>
    );
  }

  return (
    <ul className="divide-y divide-border">
      {state.items.map((announcement) => {
        const target = announcementHref(announcement.href);
        const body = (
          <>
            <div className="flex items-start justify-between gap-3">
              <p className="min-w-0 break-words text-sm font-medium">
                {announcement.title}
              </p>
              <time
                dateTime={announcement.createdAt}
                className="shrink-0 text-[11px] text-muted-foreground"
              >
                {formatRelative(announcement.createdAt)}
              </time>
            </div>
            <p className="mt-1 line-clamp-2 break-words text-xs leading-relaxed text-muted-foreground">
              {announcement.body}
            </p>
          </>
        );
        const rowClass =
          "block rounded-md px-4 py-3 transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring";

        return (
          <li key={announcement.id}>
            {target?.kind === "internal" ? (
              <Link href={target.href} onClick={onNavigate} className={rowClass}>
                {body}
              </Link>
            ) : target?.kind === "external" ? (
              <a
                href={target.href}
                target="_blank"
                rel="noreferrer noopener"
                onClick={onNavigate}
                className={rowClass}
              >
                {body}
              </a>
            ) : (
              <div className="px-4 py-3">{body}</div>
            )}
          </li>
        );
      })}
    </ul>
  );
}

function ContestList({
  state,
  onRetry,
  onNavigate,
}: {
  state: PublicContestState;
  onRetry: () => void;
  onNavigate: () => void;
}) {
  if (state.status === "loading" && state.items.length === 0) {
    return (
      <div role="status" aria-label="Loading contests">
        <span className="sr-only">Loading contests…</span>
        <PublicSkeletonRows />
      </div>
    );
  }
  if (state.status === "error" && state.items.length === 0) {
    return (
      <div className="p-4">
        <EmptyState
          title="Could not load contests"
          description="Please check your connection and try again."
          icon={AlertTriangle}
          action={
            <Button type="button" variant="outline" onClick={onRetry}>
              Retry
            </Button>
          }
        />
      </div>
    );
  }
  if (state.items.length === 0) {
    return (
      <div className="p-4">
        <EmptyState
          title="No contests scheduled"
          description="Live and upcoming rounds will appear here."
          icon={CalendarClock}
          action={
            <Link href="/contests" className={buttonVariants()}>
              Browse contests
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <ul className="divide-y divide-border">
      {state.items.map((contest) => {
        const live = contest.status === "RUNNING";
        return (
          <li key={contest.id}>
            <Link
              href={`/contests/${contest.slug}`}
              onClick={onNavigate}
              className="block rounded-md px-4 py-3 transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
            >
              <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                {live ? (
                  <Badge
                    variant="success"
                    className="gap-1 px-1.5 py-0 text-[10px] font-semibold"
                  >
                    <span
                      aria-hidden="true"
                      className="size-1.5 rounded-full bg-emerald-600 dark:bg-emerald-400"
                    />
                    Live
                  </Badge>
                ) : null}
                <span className={cn(live && "font-medium text-emerald-700 dark:text-emerald-400")}>
                  {live ? "Live now" : `Starts ${formatRelative(contest.startAt)}`}
                </span>
              </div>
              <p className="mt-1 break-words text-sm font-medium">
                {contest.title}
              </p>
              <p className="mt-0.5 text-[11px] text-muted-foreground">
                {live ? "Started" : "Starts"}{" "}
                {formatDhakaDateTimeShort(contest.startAt)}
              </p>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

/** Guest drawer body: public announcements and live/upcoming contests. */
export function PublicUpdatesContent({
  tab,
  onTabChange,
  announcements,
  contests,
  onRetryAnnouncements,
  onRetryContests,
  onNavigate,
}: {
  tab: PublicUpdatesTab;
  onTabChange: (tab: PublicUpdatesTab) => void;
  announcements: PublicAnnouncementState;
  contests: PublicContestState;
  onRetryAnnouncements: () => void;
  onRetryContests: () => void;
  onNavigate: () => void;
}) {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="shrink-0 border-b border-border px-4 py-3">
        <TabBar
          idPrefix="public-updates"
          ariaLabel="Public updates"
          items={[
            { value: "announcements", label: "Announcements" },
            { value: "contests", label: "Contests" },
          ]}
          value={tab}
          onChange={(value) =>
            onTabChange(value === "contests" ? "contests" : "announcements")
          }
          panelId={PANEL_ID}
        />
      </div>

      <div
        id={PANEL_ID}
        role="tabpanel"
        aria-labelledby={tabId("public-updates", tab)}
        tabIndex={0}
        className="reference-scroll min-h-0 flex-1 overflow-y-auto overscroll-contain focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
      >
        {tab === "announcements" ? (
          <AnnouncementList
            state={announcements}
            onRetry={onRetryAnnouncements}
            onNavigate={onNavigate}
          />
        ) : (
          <ContestList
            state={contests}
            onRetry={onRetryContests}
            onNavigate={onNavigate}
          />
        )}
      </div>

      <footer className="shrink-0 border-t border-border px-4 py-2">
        <div className="flex flex-wrap items-center justify-between gap-x-4">
          <Link
            href="/login"
            onClick={onNavigate}
            className={`${footerLinkClass} text-primary hover:underline`}
          >
            Sign in for personal alerts
          </Link>
          <Link
            href="/contests"
            onClick={onNavigate}
            className={`${footerLinkClass} text-muted-foreground hover:text-foreground`}
          >
            Browse contests
          </Link>
        </div>
      </footer>
    </div>
  );
}
