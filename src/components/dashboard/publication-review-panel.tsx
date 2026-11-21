import Link from "next/link";
import { Inbox, PauseCircle, ShieldCheck } from "lucide-react";
import { PublicationStatusBadge } from "@/components/problems/publication-status-badge";
import { DashboardPanel } from "@/components/dashboard/dashboard-panel";
import { EmptyState } from "@/components/shared/empty-state";
import type { ProblemReviewQueueItem } from "@/lib/problem-review-types";
import type { SafeUser } from "@/server/auth/session";
import { listProblemReviewInbox } from "@/server/services/problem-review-records";

function Count({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "default" | "warning" | "danger";
}) {
  return (
    <div className="rounded-md border border-border bg-background px-2.5 py-2">
      <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
        {label}
      </p>
      <p
        className={
          tone === "warning"
            ? "mt-0.5 font-mono text-lg font-semibold text-amber-600 dark:text-amber-400"
            : tone === "danger"
              ? "mt-0.5 font-mono text-lg font-semibold text-rose-600 dark:text-rose-400"
              : "mt-0.5 font-mono text-lg font-semibold"
        }
      >
        {value}
      </p>
    </div>
  );
}

function pickLinks(items: ProblemReviewQueueItem[]): ProblemReviewQueueItem[] {
  const seen = new Set<string>();
  return items
    .filter((item) => {
      if (seen.has(item.problemId)) return false;
      seen.add(item.problemId);
      return true;
    })
    .slice(0, 3);
}

export async function PublicationReviewPanel({
  viewer,
  basePath,
}: {
  viewer: Pick<SafeUser, "id" | "role">;
  basePath: string;
}) {
  const inbox = await listProblemReviewInbox(viewer);
  const links = pickLinks([
    ...inbox.reviewQueue,
    ...inbox.held,
    ...inbox.myReviews,
  ]);

  return (
    <DashboardPanel
      title="Publication review"
      description="Setter approvals, holds and review credits."
      icon={<ShieldCheck className="size-4" />}
      action={
        <Link
          href={`${basePath}/reviews`}
          className="text-[11px] font-medium text-primary hover:underline"
        >
          Open
        </Link>
      }
      bodyClassName="px-4 pb-3 pt-2"
    >
      <div className="grid grid-cols-3 gap-2">
        <Count label="Open reviews" value={inbox.counts.reviewQueue} tone="default" />
        <Count label="Your problems" value={inbox.counts.myReviews} tone="warning" />
        <Count label="Held" value={inbox.counts.held} tone="danger" />
      </div>

      {links.length === 0 ? (
        <EmptyState
          className="mt-2 border-0 px-0 py-6"
          icon={Inbox}
          title="No reviews in flight"
          description="Send a problem for review or wait for another setter."
        />
      ) : (
        <ul className="mt-1 divide-y divide-border">
          {links.map((item) => (
            <li
              key={item.problemId}
              className="flex items-center justify-between gap-2 py-2.5"
            >
              <div className="min-w-0">
                <Link
                  href={`${basePath}/reviews/${item.problemId}`}
                  className="block truncate text-[13px] font-medium hover:text-primary"
                >
                  {item.title}
                </Link>
                <p className="flex items-center gap-1 text-[11px] text-muted-foreground">
                  {item.openHoldCount > 0 ? (
                    <>
                      <PauseCircle className="size-3" aria-hidden="true" />
                      {item.openHoldCount} hold
                      {item.openHoldCount === 1 ? "" : "s"} ·{" "}
                    </>
                  ) : null}
                  <span className="font-mono">
                    {item.approvalCount}/{item.requiredApprovals} approvals
                  </span>
                </p>
              </div>
              <PublicationStatusBadge
                status={item.publicationStatus}
                withIcon={false}
                className="shrink-0"
              />
            </li>
          ))}
        </ul>
      )}

      {inbox.counts.credits > 0 ? (
        <p className="mt-1 border-t border-border pt-2 text-[11px] text-muted-foreground">
          {inbox.counts.credits} published review credit
          {inbox.counts.credits === 1 ? "" : "s"}.
        </p>
      ) : null}
    </DashboardPanel>
  );
}
