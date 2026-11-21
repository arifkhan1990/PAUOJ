import Link from "next/link";
import {
  Award,
  CircleAlert,
  Inbox,
  ListChecks,
  PauseCircle,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";
import { DashboardMetric } from "@/components/dashboard/dashboard-metric";
import { PublicationStatusBadge } from "@/components/problems/publication-status-badge";
import { DifficultyBadge } from "@/components/shared/difficulty-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getLanguage } from "@/lib/languages";
import type {
  ProblemReviewCredit,
  ProblemReviewInbox,
  ProblemReviewQueueItem,
} from "@/lib/problem-review-types";
import { formatDate, formatRelative } from "@/lib/utils";

function QueueRow({
  item,
  basePath,
}: {
  item: ProblemReviewQueueItem;
  basePath: string;
}) {
  return (
    <li className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <Link
          href={`${basePath}/reviews/${item.problemId}`}
          className="block truncate text-[13px] font-medium hover:text-primary"
        >
          {item.title}
        </Link>
        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-muted-foreground">
          <span className="truncate">
            {item.author?.displayName ?? "Unknown author"}
          </span>
          <span aria-hidden="true">·</span>
          <span className="font-mono">
            {item.approvalCount}/{item.requiredApprovals} approvals
          </span>
          {item.openHoldCount > 0 ? (
            <Badge variant="destructive">
              {item.openHoldCount} open hold
              {item.openHoldCount === 1 ? "" : "s"}
            </Badge>
          ) : null}
          {item.addressedHoldCount > 0 ? (
            <Badge variant="warning">
              {item.addressedHoldCount} responded
            </Badge>
          ) : null}
          <span aria-hidden="true">·</span>
          <span>{formatRelative(item.updatedAt)}</span>
        </div>
      </div>
      <div className="flex shrink-0 flex-wrap items-center gap-1.5">
        <DifficultyBadge difficulty={item.difficulty} />
        <PublicationStatusBadge
          status={item.publicationStatus}
          withIcon={false}
        />
        {item.approvedByMe ? (
          <Badge variant="success">You approved</Badge>
        ) : null}
        {item.heldByMe ? (
          <Badge variant="destructive">Your hold</Badge>
        ) : null}
      </div>
    </li>
  );
}

export function ReviewQueueList({
  items,
  basePath,
  emptyTitle,
  emptyDescription,
}: {
  items: ProblemReviewQueueItem[];
  basePath: string;
  emptyTitle: string;
  emptyDescription: string;
}) {
  if (items.length === 0) {
    return (
      <EmptyState
        className="py-10"
        icon={Inbox}
        title={emptyTitle}
        description={emptyDescription}
      />
    );
  }

  return (
    <Card className="overflow-hidden p-1">
      <ul className="divide-y divide-border">
        {items.map((item) => (
          <QueueRow key={item.problemId} item={item} basePath={basePath} />
        ))}
      </ul>
    </Card>
  );
}

export function PublishedCreditsList({
  credits,
}: {
  credits: ProblemReviewCredit[];
}) {
  if (credits.length === 0) {
    return (
      <EmptyState
        className="py-10"
        icon={Award}
        title="No review credits yet"
        description="Approving a problem that later publishes earns you a permanent review credit."
      />
    );
  }

  return (
    <Card className="overflow-hidden p-1">
      <ul className="divide-y divide-border">
        {credits.map((credit) => (
          <li
            key={`${credit.problemId}-${credit.publishedAt}`}
            className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="min-w-0">
              <Link
                href={`/problems/${credit.slug}`}
                className="block truncate text-[13px] font-medium hover:text-primary"
              >
                {credit.title}
              </Link>
              <p className="mt-1 text-[11px] text-muted-foreground">
                Published {formatDate(credit.publishedAt)} ·{" "}
                {getLanguage(credit.solutionLanguage).label}
              </p>
            </div>
            <div className="flex shrink-0 flex-wrap items-center gap-1.5">
              <Badge variant="success">Credit</Badge>
              <Badge variant="outline">
                {credit.testsAdded} test
                {credit.testsAdded === 1 ? "" : "s"}
              </Badge>
              {credit.editorialProvided ? (
                <Badge variant="outline">Editorial</Badge>
              ) : null}
            </div>
          </li>
        ))}
      </ul>
    </Card>
  );
}

function SectionHeading({
  id,
  title,
  description,
  count,
  icon: Icon,
}: {
  id: string;
  title: string;
  description: string;
  count: number;
  icon: LucideIcon;
}) {
  return (
    <div id={id} className="flex flex-wrap items-end justify-between gap-2">
      <div className="flex items-start gap-2">
        <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-md bg-muted text-muted-foreground">
          <Icon className="size-3.5" aria-hidden="true" />
        </span>
        <div>
          <h2 className="text-base font-semibold">{title}</h2>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </div>
      <span className="rounded-full border border-border px-2.5 py-0.5 font-mono text-xs text-muted-foreground">
        {count}
      </span>
    </div>
  );
}

export function ProblemReviewQueue({
  inbox,
  basePath,
}: {
  inbox: ProblemReviewInbox;
  basePath: string;
}) {
  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Publication review"
        title="Reviews"
        description="Every problem needs two setter approvals, an editorial and a reviewer-added test before it can go public. A hold freezes approvals until the author responds and the hold is resolved."
        actions={
          <>
            <Link
              href={`${basePath}/contributions`}
              className={buttonVariants({ variant: "outline" })}
            >
              <ListChecks className="size-4" /> Contributions
            </Link>
            {basePath !== "/dashboard" ? (
              <Link
                href={`${basePath}/problems`}
                className={buttonVariants({ variant: "outline" })}
              >
                <ShieldCheck className="size-4" /> My problems
              </Link>
            ) : null}
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <DashboardMetric
          label="Open reviews"
          value={inbox.counts.reviewQueue}
          hint="Still collecting setter sign-offs"
          icon={Inbox}
          href="#waiting"
        />
        <DashboardMetric
          label="Your problems"
          value={inbox.counts.myReviews}
          hint="In review or changes requested"
          icon={CircleAlert}
          tone="warning"
          href="#mine"
        />
        <DashboardMetric
          label="On hold"
          value={inbox.counts.held}
          hint="Waiting on author responses"
          icon={PauseCircle}
          tone="danger"
          href="#held"
        />
        <DashboardMetric
          label="Credits"
          value={inbox.counts.credits}
          hint="Published reviews you approved"
          icon={Award}
          tone="success"
          href="#credits"
        />
      </div>

      <section className="space-y-3">
        <SectionHeading
          id="waiting"
          title="Reviews in flight"
          description="Problems from other setters that are still collecting approvals. Open one to approve, hold or follow progress."
          count={inbox.counts.reviewQueue}
          icon={Inbox}
        />
        <ReviewQueueList
          items={inbox.reviewQueue}
          basePath={basePath}
          emptyTitle="Nothing waiting for you"
          emptyDescription="New review requests from other setters will appear here."
        />
      </section>

      <section className="space-y-3">
        <SectionHeading
          id="mine"
          title="Your problems in review"
          description="Submit drafts, track approvals and publish once every gate passes."
          count={inbox.counts.myReviews}
          icon={CircleAlert}
        />
        <ReviewQueueList
          items={inbox.myReviews}
          basePath={basePath}
          emptyTitle="No problems in review"
          emptyDescription="Problems you send for review will appear here."
        />
      </section>

      <section className="space-y-3">
        <SectionHeading
          id="held"
          title="Held problems"
          description="Approvals are locked until the author responds and the hold is resolved."
          count={inbox.counts.held}
          icon={PauseCircle}
        />
        <ReviewQueueList
          items={inbox.held}
          basePath={basePath}
          emptyTitle="No held problems"
          emptyDescription="Holds you raised or received will appear here."
        />
      </section>

      <section className="space-y-3">
        <SectionHeading
          id="credits"
          title="Published review credits"
          description="Problems you approved that later went public."
          count={inbox.counts.credits}
          icon={Award}
        />
        <PublishedCreditsList credits={inbox.credits} />
      </section>
    </div>
  );
}
