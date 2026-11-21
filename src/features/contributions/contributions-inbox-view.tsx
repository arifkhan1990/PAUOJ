import Link from "next/link";
import { Download, ListChecks, Send } from "lucide-react";
import { ContributionList } from "@/features/contributions/contribution-list";
import { ContestApprovalList } from "@/features/contributions/contest-approval-list";
import { ProblemReviewInboxSections } from "@/features/reviews/problem-review-inbox";
import { PageHeader } from "@/components/shared/page-header";
import { buttonVariants } from "@/components/ui/button";
import type { SafeUser } from "@/server/auth/session";
import {
  countContestApprovalInbox,
  listContestApprovalInbox,
} from "@/server/services/contest-problem-approvals";
import {
  countReviewInbox,
  listMyContributions,
  listReviewInbox,
} from "@/server/services/problem-contributions";

const PANEL_META = {
  teacher: {
    basePath: "/teacher",
    queueHref: "/teacher/problems/{problemId}/contributions",
    description:
      "Problem setters own their problems. Teachers can propose statements, extra test cases and editorials; only the author can make them live.",
    queueHint: "Pending proposals on problems you own and across the whole judge",
  },
  admin: {
    basePath: "/admin",
    queueHref: "/admin/problems/{problemId}/contributions",
    description:
      "Problem setters own their problems. Teachers can propose statements, extra test cases and editorials; only the author can make them live.",
    queueHint: "Pending proposals on problems you own and across the whole judge",
  },
  coder: {
    basePath: "/dashboard",
    queueHref: "/dashboard/contributions/{problemId}",
    description:
      "Changes to the problems you set need your review. Approved proposals go live immediately; rejected ones stay private.",
    queueHint: "Pending proposals on problems you own",
  },
} as const;

export async function ContributionsInboxView({
  viewer,
  panel,
}: {
  viewer: SafeUser;
  panel: keyof typeof PANEL_META;
}) {
  const meta = PANEL_META[panel];
  const canProposeAll = panel !== "coder";
  const [queue, mine, queueTotal, contestRequests, contestTotal] =
    await Promise.all([
      listReviewInbox(viewer),
      listMyContributions(viewer.id),
      countReviewInbox(viewer),
      listContestApprovalInbox(viewer),
      countContestApprovalInbox(viewer),
    ]);

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Problem setter workflow"
        title="Contributions"
        description={meta.description}
        actions={
          <>
            <a
              href="/api/v1/contributions/export"
              download
              className={buttonVariants({ variant: "outline" })}
            >
              <Download className="size-4" /> Export CSV
            </a>
            {canProposeAll ? (
            <Link
              href={`${meta.basePath}/problems`}
              className={buttonVariants({ variant: "outline" })}
            >
              <ListChecks className="size-4" /> My problems
            </Link>
            ) : (
              <Link
                href="/problems"
                className={buttonVariants({ variant: "outline" })}
              >
                <Send className="size-4" /> Browse problems
              </Link>
            )}
          </>
        }
      />

      <ProblemReviewInboxSections viewer={viewer} basePath={meta.basePath} />

      {contestTotal > 0 ? (
        <section className="space-y-3">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <div>
              <h2 className="text-base font-semibold">
                Contest problem requests
              </h2>
              <p className="text-xs text-muted-foreground">
                Contest creators need your permission to use your problems.
              </p>
            </div>
            <span className="rounded-full border border-border px-2.5 py-0.5 font-mono text-xs text-muted-foreground">
              {contestTotal} pending
              {contestTotal > contestRequests.length
                ? ` · latest ${contestRequests.length}`
                : ""}
            </span>
          </div>
          <ContestApprovalList items={contestRequests} />
        </section>
      ) : null}

      <section className="space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="text-base font-semibold">Waiting for your review</h2>
            <p className="text-xs text-muted-foreground">
              {viewer.role === "ADMIN"
                ? "Pending proposals across the whole judge."
                : meta.queueHint + "."}
            </p>
          </div>
          <span className="rounded-full border border-border px-2.5 py-0.5 font-mono text-xs text-muted-foreground">
            {queueTotal} pending
            {queueTotal > queue.length ? ` · latest ${queue.length}` : ""}
          </span>
        </div>
        <ContributionList
          items={queue}
          viewerUsername={viewer.username}
          canReview
          reviewerQueueHref={meta.queueHref}
          showProblem
          emptyTitle="Nothing waiting"
          emptyDescription={
            canProposeAll
              ? "When a teacher proposes a change on one of your problems it will appear here for review."
              : "When another setter proposes a change on one of your problems it will appear here for review."
          }
        />
      </section>

      <section className="space-y-3">
        <div>
          <h2 className="text-base font-semibold">My proposals</h2>
          <p className="text-xs text-muted-foreground">
            {canProposeAll
              ? "Changes you sent to other setters. Pending proposals can still be withdrawn."
              : "Community editorials you sent to problem setters. Pending proposals can still be withdrawn."}
          </p>
        </div>
        <ContributionList
          items={mine}
          viewerUsername={viewer.username}
          canReview={false}
          showProblem
          emptyTitle="You have not proposed a change yet"
          emptyDescription={
            canProposeAll
              ? "Open any problem and choose Contribute to suggest a statement fix, extra tests or an editorial."
              : "Solve a problem, open its editorial tab and propose the approach that worked for you."
          }
        />
      </section>

      <div className="flex flex-col gap-3 rounded-lg border border-border bg-muted/30 px-4 py-3 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <p>
          Approval is atomic and audited: statement, test, editorial and
          contest-usage decisions apply in one transaction.
        </p>
        <Link
          href={canProposeAll ? `${meta.basePath}/problems` : "/problems"}
          className={buttonVariants({ variant: "ghost", size: "sm" })}
        >
          {canProposeAll ? (
            <>
              <Send className="size-3.5" /> Browse problems to contribute
            </>
          ) : (
            <>
              <ListChecks className="size-3.5" /> Browse problems
            </>
          )}
        </Link>
      </div>
    </div>
  );
}
