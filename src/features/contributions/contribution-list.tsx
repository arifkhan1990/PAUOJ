"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Check,
  FilePenLine,
  GitPullRequest,
  Undo2,
  X,
} from "lucide-react";
import { useToast } from "@/components/providers/toast-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { ApiClientError, apiPatch } from "@/lib/api-client";
import {
  ContributionPayloadPreview,
  type CurrentProblemContent,
} from "@/features/contributions/contribution-payload-preview";
import {
  CONTRIBUTION_KIND_LABELS,
  type ProblemContributionItem,
  type ProblemContributionStatus,
} from "@/lib/contribution-types";
import { formatRelative } from "@/lib/utils";

const STATUS_META: Record<
  ProblemContributionStatus,
  { label: string; variant: "warning" | "success" | "destructive" | "muted" }
> = {
  PENDING: { label: "Waiting for review", variant: "warning" },
  APPROVED: { label: "Approved", variant: "success" },
  REJECTED: { label: "Rejected", variant: "destructive" },
  WITHDRAWN: { label: "Withdrawn", variant: "muted" },
};

export function ContributionList({
  items,
  viewerUsername,
  canReview,
  reviewerQueueHref,
  showProblem = false,
  current,
  emptyTitle = "No proposals yet",
  emptyDescription,
}: {
  items: ProblemContributionItem[];
  viewerUsername: string;
  canReview: boolean;
  reviewerQueueHref?: string;
  showProblem?: boolean;
  current?: CurrentProblemContent;
  emptyTitle?: string;
  emptyDescription?: string;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectNote, setRejectNote] = useState("");
  const [rejudgeIds, setRejudgeIds] = useState<Set<string>>(new Set());

  const decide = async (
    item: ProblemContributionItem,
    action: "approve" | "reject" | "withdraw",
    reviewNote?: string,
    rejudge = false,
  ) => {
    setBusyId(item.id);
    try {
      const result = await apiPatch<{
        rejudged?: number;
        rejudgeFailed?: boolean;
      }>(`/api/v1/contributions/${item.id}`, {
        action,
        reviewNote: reviewNote ?? "",
        rejudge,
      });
      let description =
        action === "approve"
          ? "The change is now live on the problem."
          : "The contributor has been notified.";
      if (action === "approve" && rejudge) {
        description = result.rejudgeFailed
          ? "The change is live, but the judge queue was unavailable; no submissions were queued."
          : result.rejudged
            ? `The change is live. ${result.rejudged} practice submission${result.rejudged === 1 ? "" : "s"} queued for rejudge.`
            : "The change is live; there were no practice submissions to rejudge.";
      }
      toast({
        title:
          action === "approve"
            ? "Proposal approved"
            : action === "reject"
              ? "Proposal rejected"
              : "Proposal withdrawn",
        description,
        variant: action === "reject" ? "warning" : "success",
      });
      setRejectingId(null);
      setRejectNote("");
      setRejudgeIds((current) => {
        const next = new Set(current);
        next.delete(item.id);
        return next;
      });
      router.refresh();
    } catch (error) {
      toast({
        title: "Action failed",
        description:
          error instanceof ApiClientError
            ? error.message
            : "Could not update the proposal.",
        variant: "error",
      });
    } finally {
      setBusyId(null);
    }
  };

  if (items.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border px-6 py-10 text-center">
        <GitPullRequest className="mx-auto size-5 text-muted-foreground" />
        <h3 className="mt-2 text-sm font-semibold">{emptyTitle}</h3>
        {emptyDescription ? (
          <p className="mt-1 text-xs text-muted-foreground">
            {emptyDescription}
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((item) => {
        const status = STATUS_META[item.status];
        const mine = item.contributor?.username === viewerUsername;
        const reviewerActions = canReview && !mine;
        const busy = busyId === item.id;
        return (
          <Card key={item.id} className="p-4 sm:p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant={status.variant}>{status.label}</Badge>
                  <Badge variant="outline">
                    <FilePenLine className="size-3" />
                    {CONTRIBUTION_KIND_LABELS[item.kind]}
                  </Badge>
                  {showProblem ? (
                    <Link
                      href={`/problems/${item.problemSlug}`}
                      className="truncate text-sm font-medium hover:text-primary"
                    >
                      {item.problemTitle}
                    </Link>
                  ) : null}
                </div>
                <p className="mt-1.5 text-xs text-muted-foreground">
                  {item.contributor ? (
                    <>
                      by{" "}
                      <Link
                        href={`/users/${item.contributor.username}`}
                        className="font-medium text-foreground hover:text-primary"
                      >
                        {item.contributor.displayName}
                      </Link>
                    </>
                  ) : (
                    "by a removed user"
                  )}{" "}
                  · {formatRelative(item.createdAt)}
                </p>
              </div>
              {reviewerQueueHref ? (
                <Link
                  href={reviewerQueueHref.replace(
                    "{problemId}",
                    item.problemId,
                  )}
                  className="text-xs font-medium text-primary hover:underline"
                >
                  Open queue
                </Link>
              ) : null}
            </div>

            {item.note ? (
              <p className="mt-3 rounded-md border border-border bg-muted/30 px-3 py-2 text-xs leading-relaxed text-muted-foreground">
                <span className="font-semibold text-foreground">Note: </span>
                {item.note}
              </p>
            ) : null}

            <details className="group mt-3 rounded-md border border-border">
              <summary className="cursor-pointer list-none px-3 py-2 text-xs font-medium text-muted-foreground hover:text-foreground">
                Preview proposed{" "}
                {CONTRIBUTION_KIND_LABELS[item.kind].toLowerCase()}
                <span className="ml-1 inline-block transition-transform group-open:rotate-90">
                  ›
                </span>
              </summary>
              <div className="max-h-[28rem] overflow-auto border-t border-border px-3 py-3">
                <ContributionPayloadPreview item={item} current={current} />
              </div>
            </details>

            {item.status !== "PENDING" ? (
              <p className="mt-3 text-xs text-muted-foreground">
                {item.reviewer ? (
                  <>
                    Reviewed by{" "}
                    <span className="font-medium text-foreground">
                      {item.reviewer.displayName}
                    </span>
                    {item.reviewedAt ? ` · ${formatRelative(item.reviewedAt)}` : ""}
                  </>
                ) : item.status === "WITHDRAWN" ? (
                  "Withdrawn by the contributor."
                ) : null}
                {item.reviewNote ? (
                  <span className="mt-1 block italic">
                    “{item.reviewNote}”
                  </span>
                ) : null}
              </p>
            ) : null}

            {item.status === "PENDING" ? (
              <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-border pt-3">
                {reviewerActions && item.kind === "TESTS" ? (
                  <label className="flex w-full items-center gap-2 text-xs text-muted-foreground sm:w-auto">
                    <input
                      type="checkbox"
                      checked={rejudgeIds.has(item.id)}
                      onChange={(event) =>
                        setRejudgeIds((current) => {
                          const next = new Set(current);
                          if (event.target.checked) next.add(item.id);
                          else next.delete(item.id);
                          return next;
                        })
                      }
                      className="size-3.5 accent-[var(--primary)]"
                    />
                    Rejudge up to 500 practice submissions
                  </label>
                ) : null}
                {reviewerActions ? (
                  <>
                    <Button
                      type="button"
                      size="sm"
                      variant="success"
                      disabled={busy}
                      onClick={() =>
                        void decide(
                          item,
                          "approve",
                          undefined,
                          rejudgeIds.has(item.id),
                        )
                      }
                    >
                      <Check className="size-3.5" /> Approve & go live
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={busy}
                      onClick={() =>
                        setRejectingId((current) =>
                          current === item.id ? null : item.id,
                        )
                      }
                    >
                      <X className="size-3.5" /> Reject
                    </Button>
                  </>
                ) : null}
                {mine ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    disabled={busy}
                    onClick={() => void decide(item, "withdraw")}
                  >
                    <Undo2 className="size-3.5" /> Withdraw
                  </Button>
                ) : null}
                {!canReview && !mine ? (
                  <span className="text-xs text-muted-foreground">
                    The problem author reviews this proposal.
                  </span>
                ) : null}
              </div>
            ) : null}

            {rejectingId === item.id ? (
              <div className="mt-3 space-y-2 rounded-md border border-rose-200 bg-rose-50/60 p-3 dark:border-rose-900 dark:bg-rose-950/40">
                <Textarea
                  autoFocus
                  value={rejectNote}
                  onChange={(event) => setRejectNote(event.target.value)}
                  rows={2}
                  maxLength={1_000}
                  placeholder="Why is this proposal rejected? The contributor will see this note."
                />
                <div className="flex gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="destructive"
                    disabled={busy || rejectNote.trim().length < 3}
                    onClick={() => void decide(item, "reject", rejectNote)}
                  >
                    Confirm rejection
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setRejectingId(null);
                      setRejectNote("");
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : null}
          </Card>
        );
      })}
    </div>
  );
}
