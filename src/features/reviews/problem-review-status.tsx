import {
  AlertTriangle,
  CheckCircle2,
  Circle,
  MessageSquare,
  PauseCircle,
  ShieldCheck,
} from "lucide-react";
import { HoldThreadActions } from "@/features/reviews/problem-review-hold-actions";
import { Badge, type BadgeProps } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  REQUIRED_PUBLICATION_APPROVALS,
  type ProblemReviewDetail,
  type ProblemReviewGates,
  type ProblemReviewHoldStatus,
} from "@/lib/problem-review-types";
import { cn, formatRelative } from "@/lib/utils";

const HOLD_STATUS_META: Record<
  ProblemReviewHoldStatus,
  { label: string; variant: BadgeProps["variant"] }
> = {
  OPEN: { label: "Open hold", variant: "destructive" },
  ADDRESSED: { label: "Author responded", variant: "warning" },
  RESOLVED: { label: "Resolved", variant: "success" },
};

type GateItem = {
  key: keyof Pick<
    ProblemReviewGates,
    "editorialReady" | "reviewerTestsReady" | "solutionReady" | "holdsClear"
  >;
  label: string;
  hint: string;
};

const GATE_ITEMS: GateItem[] = [
  {
    key: "editorialReady",
    label: "Editorial",
    hint: "A written approach the author or a reviewer supplied.",
  },
  {
    key: "reviewerTestsReady",
    label: "Reviewer test",
    hint: "At least one test case added by a reviewer.",
  },
  {
    key: "solutionReady",
    label: "Reference solution",
    hint: "An approver must ship the code they verified with.",
  },
  {
    key: "holdsClear",
    label: "Holds clear",
    hint: "No open or addressed hold blocks approvals.",
  },
];

function GateRow({
  ready,
  label,
  hint,
}: {
  ready: boolean;
  label: string;
  hint: string;
}) {
  return (
    <li className="flex items-start gap-2.5">
      {ready ? (
        <CheckCircle2
          className="mt-0.5 size-4 shrink-0 text-emerald-600 dark:text-emerald-400"
          aria-hidden="true"
        />
      ) : (
        <Circle
          className="mt-0.5 size-4 shrink-0 text-muted-foreground"
          aria-hidden="true"
        />
      )}
      <div className="min-w-0">
        <p
          className={cn(
            "text-xs font-medium",
            !ready && "text-muted-foreground",
          )}
        >
          {label}
          <span className="sr-only">{ready ? " ready" : " missing"}</span>
        </p>
        <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">
          {hint}
        </p>
      </div>
    </li>
  );
}

function HoldThread({ review }: { review: ProblemReviewDetail }) {
  return (
    <Card className="overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-5 py-3.5">
        <div className="flex items-center gap-2.5">
          <span className="grid size-7 place-items-center rounded-md bg-muted text-muted-foreground">
            <MessageSquare className="size-4" aria-hidden="true" />
          </span>
          <div>
            <h2 className="text-sm font-semibold">Holds</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              A hold resets approvals and freezes the review until it is
              resolved.
            </p>
          </div>
        </div>
        <Badge variant={review.holds.length > 0 ? "outline" : "muted"}>
          {review.holds.length} total
        </Badge>
      </div>

      {review.holds.length === 0 ? (
        <p className="px-5 py-4 text-xs text-muted-foreground">
          No holds were raised in this review cycle.
        </p>
      ) : (
        <ul className="divide-y divide-border">
          {review.holds.map((hold) => {
            const meta = HOLD_STATUS_META[hold.status];
            return (
              <li key={hold.id} className="space-y-2.5 px-5 py-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant={meta.variant}>{meta.label}</Badge>
                  <span className="text-sm font-medium">
                    {hold.reviewer?.displayName ?? "Removed setter"}
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    raised {formatRelative(hold.createdAt)}
                  </span>
                </div>
                <p className="whitespace-pre-wrap text-sm leading-relaxed">
                  {hold.note}
                </p>

                {hold.authorResponse ? (
                  <div className="rounded-md border border-border bg-muted/30 p-3">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                      Author response
                      {hold.respondedAt
                        ? ` · ${formatRelative(hold.respondedAt)}`
                        : ""}
                    </p>
                    <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed">
                      {hold.authorResponse}
                    </p>
                  </div>
                ) : null}

                {hold.resolutionNote || hold.resolvedAt ? (
                  <div className="rounded-md border border-emerald-200 bg-emerald-50/60 p-3 dark:border-emerald-900 dark:bg-emerald-950/40">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-emerald-800 dark:text-emerald-300">
                      Resolved
                      {hold.resolver
                        ? ` by ${hold.resolver.displayName}`
                        : ""}
                      {hold.resolvedAt
                        ? ` · ${formatRelative(hold.resolvedAt)}`
                        : ""}
                    </p>
                    {hold.resolutionNote ? (
                      <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed">
                        {hold.resolutionNote}
                      </p>
                    ) : null}
                  </div>
                ) : null}

                {hold.reopenNote ? (
                  <div className="rounded-md border border-amber-200 bg-amber-50/60 p-3 dark:border-amber-900 dark:bg-amber-950/40">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-amber-900 dark:text-amber-200">
                      Reopened
                      {hold.reopenedAt
                        ? ` · ${formatRelative(hold.reopenedAt)}`
                        : ""}
                    </p>
                    <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed">
                      {hold.reopenNote}
                    </p>
                  </div>
                ) : null}

                <HoldThreadActions
                  problemId={review.problemId}
                  hold={hold}
                  canRespond={review.viewer.respondableHoldIds.includes(
                    hold.id,
                  )}
                  canResolve={review.viewer.resolvableHoldIds.includes(hold.id)}
                  canReopen={review.viewer.reopenableHoldIds.includes(hold.id)}
                />
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}

export function ProblemReviewStatus({
  review,
}: {
  review: ProblemReviewDetail;
}) {
  const { gates } = review;
  const missingApprovals = Math.max(
    gates.requiredApprovals - gates.approvalCount,
    0,
  );

  if (review.publicationStatus === "PUBLISHED" && gates.approvalCount === 0) {
    return (
      <Card className="p-5">
        <div className="flex items-start gap-2.5">
          <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-md bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">
            <CheckCircle2 className="size-4" aria-hidden="true" />
          </span>
          <div>
            <h2 className="text-sm font-semibold">
              Published before the review workflow
            </h2>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              This problem was already public when the two-setter gate was
              introduced, so it has no approval history. Future content changes
              need a re-review.
            </p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-5 py-3.5">
          <div className="flex items-center gap-2.5">
            <span className="grid size-7 place-items-center rounded-md bg-primary/10 text-primary">
              <ShieldCheck className="size-4" aria-hidden="true" />
            </span>
            <div>
              <h2 className="text-sm font-semibold">Publication checklist</h2>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Cycle {review.reviewCycle} · two setters must sign off before
                this problem can go public.
              </p>
            </div>
          </div>
          <Badge variant={gates.ready ? "success" : "muted"}>
            {gates.ready ? "All gates pass" : `${gates.missing.length} missing`}
          </Badge>
        </div>

        <div className="grid gap-4 px-5 py-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="flex items-start gap-2.5">
            {missingApprovals === 0 ? (
              <CheckCircle2
                className="mt-0.5 size-4 shrink-0 text-emerald-600 dark:text-emerald-400"
                aria-hidden="true"
              />
            ) : (
              <Circle
                className="mt-0.5 size-4 shrink-0 text-muted-foreground"
                aria-hidden="true"
              />
            )}
            <div>
              <p className="text-xs font-medium">
                {gates.approvalCount} of{" "}
                {gates.requiredApprovals || REQUIRED_PUBLICATION_APPROVALS}{" "}
                approvals
              </p>
              <p className="mt-0.5 font-mono text-[11px] text-muted-foreground">
                {missingApprovals === 0
                  ? "Every setter approval is in."
                  : `${missingApprovals} more setter${missingApprovals === 1 ? "" : "s"} needed.`}
              </p>
            </div>
          </div>
          {GATE_ITEMS.map((item) => (
            <GateRow
              key={item.key}
              ready={gates[item.key]}
              label={item.label}
              hint={item.hint}
            />
          ))}
        </div>

        {gates.missing.length > 0 ? (
          <div className="flex items-start gap-2 border-t border-border px-5 py-3 text-xs text-muted-foreground">
            <AlertTriangle
              className="mt-0.5 size-3.5 shrink-0 text-amber-600 dark:text-amber-400"
              aria-hidden="true"
            />
            <p>Still needed: {gates.missing.join(", ")}.</p>
          </div>
        ) : (
          <div className="flex items-start gap-2 border-t border-border px-5 py-3 text-xs text-emerald-700 dark:text-emerald-300">
            <CheckCircle2
              className="mt-0.5 size-3.5 shrink-0"
              aria-hidden="true"
            />
            <p>
              Every gate passes. The author or an admin can publish this
              problem.
            </p>
          </div>
        )}
      </Card>

      {review.publicationStatus === "IN_REVIEW" &&
      review.eligibleReviewerCount < 2 ? (
        <div className="flex items-start gap-2 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-xs leading-relaxed text-amber-900 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-100">
          <AlertTriangle className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
          <p>
            Only {review.eligibleReviewerCount} other eligible setter
            {review.eligibleReviewerCount === 1 ? "" : "s"} can review this
            problem. An admin needs to add another teacher or admin before two
            approvals can be collected.
          </p>
        </div>
      ) : null}

      <HoldThread review={review} />

      {review.viewer.myHold && review.viewer.myHold.status !== "RESOLVED" ? (
        <p className="flex items-start gap-2 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-[11px] leading-relaxed text-amber-900 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-100">
          <PauseCircle className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
          You are holding this problem. Approvals stay locked until the author
          responds and the hold is resolved.
        </p>
      ) : null}
    </div>
  );
}
