"use client";

import { useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  Globe2,
  PauseCircle,
  Send,
  ShieldCheck,
  ThumbsUp,
} from "lucide-react";
import { PublicationStatusBadge } from "@/components/problems/publication-status-badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  ReviewActionCard,
  ReviewFormError,
} from "@/features/reviews/review-action-shell";
import {
  ApproveCard,
  HoldCard,
} from "@/features/reviews/problem-review-reviewer-actions";
import { useProblemReviewAction } from "@/features/reviews/use-problem-review-action";
import type { ProblemReviewDetail } from "@/lib/problem-review-types";
import { formatDate } from "@/lib/utils";

function SubmitCard({ problemId }: { problemId: string }) {
  const { run, pending, error } = useProblemReviewAction(problemId);

  return (
    <ReviewActionCard
      title="Send to publication review"
      description="Two other setters can then review the problem. It stays private until it is published."
      icon={Send}
    >
      <Button
        type="button"
        className="w-full"
        disabled={pending}
        onClick={() =>
          void run(
            { action: "submit" },
            {
              successTitle: "Sent for review",
              successDescription: "Every eligible setter has been notified.",
            },
          )
        }
      >
        <Send className="size-4" />
        {pending ? "Sending…" : "Send for review"}
      </Button>
      <ReviewFormError message={error} />
    </ReviewActionCard>
  );
}

function PublishCard({ review }: { review: ProblemReviewDetail }) {
  const { run, pending, error } = useProblemReviewAction(review.problemId);
  const { gates } = review;

  return (
    <ReviewActionCard
      title="Publish problem"
      description="Publishing makes this problem visible in the public problem list immediately."
      icon={Globe2}
    >
      {gates.ready ? (
        <p className="mb-3 flex items-start gap-2 rounded-md border border-emerald-200 bg-emerald-50/60 px-3 py-2 text-xs text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200">
          <CheckCircle2 className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
          Every gate passes. They are met by setter approvals, so you are the
          last step.
        </p>
      ) : (
        <div className="mb-3 space-y-1.5 rounded-md border border-amber-300 bg-amber-50 px-3 py-2.5 text-xs text-amber-900 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-100">
          <p className="flex items-center gap-1.5 font-semibold">
            <AlertTriangle className="size-3.5" aria-hidden="true" />
            Not ready to publish
          </p>
          <ul className="list-disc space-y-0.5 pl-4">
            {gates.missing.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          {!gates.editorialReady || !gates.reviewerTestsReady ? (
            <p className="border-t border-amber-300/60 pt-2 text-[11px] leading-relaxed dark:border-amber-800/60">
              Content is locked while the problem is in review. Ask a reviewer
              to put it on hold so you can add the missing editorial or test.
            </p>
          ) : null}
        </div>
      )}
      <Button
        type="button"
        className="w-full"
        disabled={pending || !gates.ready}
        onClick={() =>
          void run(
            { action: "publish" },
            {
              successTitle: "Problem published",
              successDescription:
                "The author and every approver have been notified.",
            },
          )
        }
      >
        <Globe2 className="size-4" />
        {pending ? "Publishing…" : "Publish problem"}
      </Button>
      <ReviewFormError message={error} />
    </ReviewActionCard>
  );
}

function MyApprovalCard({ review }: { review: ProblemReviewDetail }) {
  return (
    <div className="flex items-start gap-2.5 rounded-lg border border-emerald-200 bg-emerald-50/60 px-4 py-3 dark:border-emerald-900 dark:bg-emerald-950/40">
      <ThumbsUp
        className="mt-0.5 size-4 shrink-0 text-emerald-700 dark:text-emerald-300"
        aria-hidden="true"
      />
      <div className="text-xs leading-relaxed text-emerald-900 dark:text-emerald-100">
        <p className="font-semibold">
          You approved this problem in cycle {review.reviewCycle}.
        </p>
        <p className="mt-0.5 opacity-80">
          The other setter still needs to sign off before it can publish.
        </p>
      </div>
    </div>
  );
}

function PublishedCard({ review }: { review: ProblemReviewDetail }) {
  const [note, setNote] = useState("");
  const [open, setOpen] = useState(false);
  const { run, pending, error } = useProblemReviewAction(review.problemId);

  const startRereview = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await run(
      { action: "reopen_publication", note: note.trim() },
      {
        successTitle: "Re-review started",
        successDescription:
          "The problem is hidden from the public list until it passes the two-setter gate again.",
      },
    );
  };

  return (
    <ReviewActionCard
      title="Published"
      description="This problem is live in the public problem list."
      icon={Globe2}
    >
      {review.publishedAt ? (
        <p className="flex items-center gap-2 text-xs text-muted-foreground">
          <CheckCircle2
            className="size-3.5 text-emerald-600 dark:text-emerald-400"
            aria-hidden="true"
          />
          Published on {formatDate(review.publishedAt)}.
        </p>
      ) : null}
      <Link
        href={`/problems/${review.slug}`}
        className="mt-3 inline-flex text-xs font-medium text-primary hover:underline"
      >
        Open the problem page
      </Link>

      {review.viewer.canRereview ? (
        <div className="mt-4 border-t border-border pt-4">
          {open ? (
            <form onSubmit={(event) => void startRereview(event)} className="space-y-2">
              <Label htmlFor="rereview-note">Why start a re-review?</Label>
              <Textarea
                id="rereview-note"
                value={note}
                onChange={(event) => setNote(event.target.value)}
                rows={3}
                maxLength={2_000}
                required
                placeholder="What needs to change? The problem is hidden from the public list while it is edited and reviewed again."
              />
              <p className="text-[11px] leading-relaxed text-muted-foreground">
                This withdraws the published problem, resets its approvals and
                lets you edit it as a draft. It must pass two fresh setter
                approvals before it returns to the public list.
              </p>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="submit"
                  variant="destructive"
                  size="sm"
                  disabled={pending || note.trim().length < 10}
                >
                  {pending ? "Withdrawing…" : "Start re-review"}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setOpen(false)}
                  disabled={pending}
                >
                  Cancel
                </Button>
              </div>
              <ReviewFormError message={error} />
            </form>
          ) : (
            <div className="space-y-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setOpen(true)}
              >
                Start re-review
              </Button>
              <p className="text-[11px] leading-relaxed text-muted-foreground">
                Needs a statement or test change? Start a re-review; the problem
                leaves the public list until it passes again.
              </p>
            </div>
          )}
        </div>
      ) : null}
    </ReviewActionCard>
  );
}

export function ProblemReviewActions({
  review,
  isAdmin = false,
}: {
  review: ProblemReviewDetail;
  isAdmin?: boolean;
}) {
  const { viewer, publicationStatus } = review;
  const inReview = publicationStatus === "IN_REVIEW";

  if (publicationStatus === "PUBLISHED") {
    return <PublishedCard review={review} />;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <PublicationStatusBadge status={publicationStatus} />
        <span className="text-[11px] text-muted-foreground">
          Cycle {review.reviewCycle}
        </span>
      </div>

      {publicationStatus === "DRAFT" && viewer.canSubmit ? (
        <SubmitCard problemId={review.problemId} />
      ) : null}

      {publicationStatus === "DRAFT" && !viewer.canSubmit ? (
        <ReviewActionCard
          title="Draft"
          description="The author still needs to finish the problem and send it to review."
          icon={ShieldCheck}
        >
          <p className="flex items-center gap-2 text-xs text-muted-foreground">
            <Clock3 className="size-3.5" aria-hidden="true" />
            No action is available to you yet.
          </p>
        </ReviewActionCard>
      ) : null}

      {inReview && (viewer.isAuthor || viewer.canPublish || isAdmin) ? (
        <PublishCard review={review} />
      ) : null}

      {inReview && viewer.myApproval ? <MyApprovalCard review={review} /> : null}

      {inReview && viewer.canReview ? <ApproveCard review={review} /> : null}

      {inReview && viewer.canHold ? (
        <HoldCard problemId={review.problemId} />
      ) : null}

      {publicationStatus === "CHANGES_REQUESTED" ? (
        <ReviewActionCard
          title="Approvals locked"
          description={
            viewer.isAuthor
              ? "Respond to every open hold above. Once all holds are resolved the review reopens and approvals unlock."
              : "The author has to respond and the hold raiser (or an admin) has to resolve every hold. Until then nobody can approve."
          }
          icon={PauseCircle}
        >
          <p className="flex items-start gap-2 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-xs leading-relaxed text-amber-900 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-100">
            <AlertTriangle
              className="mt-0.5 size-3.5 shrink-0"
              aria-hidden="true"
            />
            Approvals stay locked until every hold is resolved.
          </p>
        </ReviewActionCard>
      ) : null}
    </div>
  );
}
