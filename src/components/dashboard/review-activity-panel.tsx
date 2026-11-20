import Link from "next/link";
import { Clock3, Download, GitPullRequest, Trophy } from "lucide-react";
import { DashboardPanel } from "@/components/dashboard/dashboard-panel";
import { UserAvatar } from "@/components/shared/user-avatar";
import { Badge } from "@/components/ui/badge";
import { CONTRIBUTION_KIND_LABELS } from "@/lib/contribution-types";
import { REVIEW_SLA_HOURS } from "@/lib/review-sla";
import type {
  ReviewAnalytics,
  ReviewAnalyticsRange,
} from "@/server/services/review-analytics";
import { cn } from "@/lib/utils";

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string | number;
  tone: "warning" | "success" | "destructive" | "default";
}) {
  return (
    <div className="rounded-md border border-border bg-background px-3 py-2">
      <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
        {label}
      </p>
      <p
        className={
          tone === "warning"
            ? "mt-0.5 text-lg font-semibold text-amber-600 dark:text-amber-400"
            : tone === "success"
              ? "mt-0.5 text-lg font-semibold text-emerald-600 dark:text-emerald-400"
              : tone === "destructive"
                ? "mt-0.5 text-lg font-semibold text-rose-600 dark:text-rose-400"
                : "mt-0.5 text-lg font-semibold"
        }
      >
        {value}
      </p>
    </div>
  );
}

const RANGES: { value: ReviewAnalyticsRange; label: string }[] = [
  { value: "7", label: "7 days" },
  { value: "30", label: "30 days" },
  { value: "all", label: "All time" },
];

export function ReviewActivityPanel({
  analytics,
  basePath,
  range,
}: {
  analytics: ReviewAnalytics;
  basePath: "/teacher" | "/admin";
  range: ReviewAnalyticsRange;
}) {
  const reviewHref = `${basePath}/contributions`;
  const average =
    analytics.averageReviewHours === null
      ? "—"
      : analytics.averageReviewHours < 1
        ? "<1h"
        : `${analytics.averageReviewHours}h`;

  return (
    <DashboardPanel
      title="Review activity"
      description="Contribution proposals, approvals and author decisions."
      icon={<GitPullRequest className="size-4" />}
      action={
        <div className="flex items-center gap-3">
          <a
            href={`/api/v1/contributions/export?range=${range}`}
            download
            className="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground hover:text-primary"
          >
            <Download className="size-3" /> CSV
          </a>
          <Link
            href={reviewHref}
            className="text-[11px] font-medium text-primary hover:underline"
          >
            Open queue
          </Link>
        </div>
      }
    >
      <div className="mb-3 inline-flex rounded-md border border-border bg-muted/30 p-0.5">
        {RANGES.map((option) => (
          <Link
            key={option.value}
            href={`${basePath}?range=${option.value}`}
            className={cn(
              "rounded px-2.5 py-1 text-[11px] font-medium transition-colors",
              range === option.value
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {option.label}
          </Link>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Stat
          label="Pending"
          value={analytics.pendingContributions}
          tone="warning"
        />
        <Stat
          label="Approved"
          value={analytics.approvedContributions}
          tone="success"
        />
        <Stat
          label="Rejected"
          value={analytics.rejectedContributions}
          tone="destructive"
        />
        <Stat label="Avg review" value={average} tone="default" />
      </div>

      {analytics.overdueContributions > 0 ? (
        <Link
          href={reviewHref}
          className="mt-2 flex flex-wrap items-center gap-1.5 rounded-md border border-amber-300 bg-amber-50 px-2.5 py-1.5 text-xs text-amber-900 hover:bg-amber-100 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-100 dark:hover:bg-amber-900"
        >
          <Clock3 className="size-3.5" />
          <span className="font-semibold">
            {analytics.overdueContributions} proposal
            {analytics.overdueContributions === 1 ? "" : "s"} over{" "}
            {REVIEW_SLA_HOURS}h
          </span>
          {analytics.oldestPendingHours !== null ? (
            <span className="opacity-80">
              · oldest {analytics.oldestPendingHours}h
            </span>
          ) : null}
        </Link>
      ) : null}

      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        {analytics.byKind.length > 0 ? (
          analytics.byKind.map((row) => (
            <Badge key={row.kind} variant="outline">
              {CONTRIBUTION_KIND_LABELS[row.kind]}: {row.count}
            </Badge>
          ))
        ) : (
          <span className="text-xs text-muted-foreground">
            No proposals yet.
          </span>
        )}
        {analytics.pendingContestRequests > 0 ? (
          <Link href={reviewHref}>
            <Badge variant="warning">
              <Trophy className="size-3" />
              {analytics.pendingContestRequests} contest request
              {analytics.pendingContestRequests === 1 ? "" : "s"}
            </Badge>
          </Link>
        ) : null}
      </div>

      <div className="mt-4 border-t border-border pt-3">
        <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          <Clock3 className="size-3" /> Top contributors
        </p>
        {analytics.topContributors.length === 0 ? (
          <p className="mt-2 text-xs text-muted-foreground">
            Approved contributions will rank setters here.
          </p>
        ) : (
          <ul className="mt-2 divide-y divide-border">
            {analytics.topContributors.map((contributor, index) => (
              <li
                key={contributor.username}
                className="flex items-center gap-2.5 py-2"
              >
                <span className="w-3 font-mono text-[10px] text-muted-foreground">
                  {index + 1}
                </span>
                <UserAvatar
                  name={contributor.displayName}
                  username={contributor.username}
                  size="sm"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-medium">
                    {contributor.displayName}
                  </p>
                  <p className="truncate text-[10px] text-muted-foreground">
                    @{contributor.username}
                  </p>
                </div>
                <Badge variant="success">{contributor.approved} approved</Badge>
              </li>
            ))}
          </ul>
        )}
      </div>
    </DashboardPanel>
  );
}
