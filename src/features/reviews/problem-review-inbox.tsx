import Link from "next/link";
import { ArrowRight, Award, Inbox, PauseCircle, ShieldCheck } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";
import { buttonVariants } from "@/components/ui/button";
import {
  PublishedCreditsList,
  ReviewQueueList,
} from "@/features/reviews/problem-review-queue";
import type { SafeUser } from "@/server/auth/session";
import { listProblemReviewInbox } from "@/server/services/problem-review-records";

export async function ProblemReviewInboxSections({
  viewer,
  basePath,
}: {
  viewer: Pick<SafeUser, "id" | "role">;
  basePath: string;
}) {
  const inbox = await listProblemReviewInbox(viewer);
  const pending =
    inbox.counts.reviewQueue + inbox.counts.myReviews + inbox.counts.held;

  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="flex items-center gap-2 text-base font-semibold">
              <ShieldCheck className="size-4 text-primary" aria-hidden="true" />
              Publication reviews
            </h2>
            <p className="text-xs text-muted-foreground">
              Two setters must approve a problem before it goes public. Holds
              freeze approvals until they are resolved.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded-full border border-border px-2.5 py-0.5 font-mono text-xs text-muted-foreground">
              {pending} pending
            </span>
            <Link
              href={`${basePath}/reviews`}
              className={buttonVariants({ variant: "ghost", size: "sm" })}
            >
              Open reviews <ArrowRight className="size-3.5" />
            </Link>
          </div>
        </div>

        {pending === 0 ? (
          <EmptyState
            className="py-8"
            icon={Inbox}
            title="No publication reviews in flight"
            description="Requests from other setters, your own drafts and any holds will appear here."
          />
        ) : (
          <div className="space-y-5">
            {inbox.reviewQueue.length > 0 ? (
              <div className="space-y-2">
                <h3 className="text-sm font-semibold">Reviews in flight</h3>
                <ReviewQueueList
                  items={inbox.reviewQueue}
                  basePath={basePath}
                  emptyTitle="Nothing waiting"
                  emptyDescription="New review requests will appear here."
                />
              </div>
            ) : null}

            {inbox.myReviews.length > 0 ? (
              <div className="space-y-2">
                <h3 className="text-sm font-semibold">
                  Your problems in review
                </h3>
                <ReviewQueueList
                  items={inbox.myReviews}
                  basePath={basePath}
                  emptyTitle="No problems in review"
                  emptyDescription="Problems you send for review will appear here."
                />
              </div>
            ) : null}

            {inbox.held.length > 0 ? (
              <div className="space-y-2">
                <h3 className="flex items-center gap-1.5 text-sm font-semibold">
                  <PauseCircle
                    className="size-3.5 text-amber-600 dark:text-amber-400"
                    aria-hidden="true"
                  />
                  Held problems
                </h3>
                <ReviewQueueList
                  items={inbox.held}
                  basePath={basePath}
                  emptyTitle="No held problems"
                  emptyDescription="Holds you raised or received will appear here."
                />
              </div>
            ) : null}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="flex items-center gap-2 text-base font-semibold">
              <Award className="size-4 text-primary" aria-hidden="true" />
              Published review credits
            </h2>
            <p className="text-xs text-muted-foreground">
              Problems you approved that later went public.
            </p>
          </div>
          <span className="rounded-full border border-border px-2.5 py-0.5 font-mono text-xs text-muted-foreground">
            {inbox.counts.credits} credits
          </span>
        </div>
        <PublishedCreditsList credits={inbox.credits} />
      </section>
    </div>
  );
}
