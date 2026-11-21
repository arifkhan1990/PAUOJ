import Link from "next/link";
import { ClipboardCheck, Trophy } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ReviewerLeaderboardPodium } from "@/features/reviewers/reviewer-leaderboard-podium";
import { ReviewerRangeTabs } from "@/features/reviewers/reviewer-leaderboard-range-tabs";
import { ReviewerLeaderboardSummary } from "@/features/reviewers/reviewer-leaderboard-summary";
import { ReviewerLeaderboardTable } from "@/features/reviewers/reviewer-leaderboard-table";
import type { ReviewerLeaderboard } from "@/lib/reviewer-leaderboard-types";

export function ReviewerLeaderboardView({
  board,
}: {
  board: ReviewerLeaderboard;
}) {
  const podium = board.rows.slice(0, 3);

  return (
    <div>
      <PageHeader
        eyebrow="Contribution review"
        title="Reviewer leaderboard"
        description="Reviewers ranked by completed statement, test and editorial reviews. Decisions, approval rate and turnaround time follow the selected period."
        actions={
          <Link
            href="/rank"
            className={buttonVariants({ variant: "outline" })}
          >
            <Trophy className="size-4" /> Coder ranking
          </Link>
        }
      />

      <div className="mt-6">
        <ReviewerRangeTabs active={board.range} />
      </div>

      <ReviewerLeaderboardSummary board={board} />

      {board.rows.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            title="No reviews yet"
            description="Reviews appear here after setters and admins approve or reject contributed statements, test cases or editorials. Once a contribution is decided, the reviewer and their turnaround time show up on this board."
            icon={ClipboardCheck}
            action={
              <Link href="/problems" className={buttonVariants()}>
                Browse problems
              </Link>
            }
          />
        </div>
      ) : (
        <>
          {podium.length === 3 ? (
            <ReviewerLeaderboardPodium rows={podium} className="mt-8" />
          ) : null}
          <Card className="mt-8 overflow-hidden p-1">
            <ReviewerLeaderboardTable rows={board.rows} />
          </Card>
          {board.totalReviewers > board.rows.length ? (
            <p className="mt-2 text-[11px] text-muted-foreground">
              Showing the top {board.rows.length} of {board.totalReviewers}{" "}
              reviewers. Totals above cover the full period.
            </p>
          ) : null}
        </>
      )}

      <div className="mt-8 rounded-lg border border-border bg-muted/30 p-4 text-xs leading-relaxed text-muted-foreground">
        <p className="font-medium text-foreground">How reviews are counted</p>
        <p className="mt-1">
          A decision is one completed review of a contribution: approving it
          makes the change live, rejecting it keeps it private. Approval rate is
          approved decisions divided by total decisions. Average review time is
          measured from submission of the proposal to the decision.
        </p>
      </div>
    </div>
  );
}
