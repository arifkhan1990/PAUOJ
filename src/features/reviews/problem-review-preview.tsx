import {
  ArrowDownToLine,
  ArrowUpFromLine,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  FileText,
  FlaskConical,
  ListChecks,
  ShieldAlert,
} from "lucide-react";
import { Markdown } from "@/components/shared/markdown";
import { UserAvatar } from "@/components/shared/user-avatar";
import { DifficultyBadge } from "@/components/shared/difficulty-badge";
import { ProblemSectionCard } from "@/components/problems/problem-section-card";
import { Badge } from "@/components/ui/badge";
import type { ProblemReviewDetail } from "@/lib/problem-review-types";
import { getLanguage } from "@/lib/languages";
import { formatDate, formatRelative } from "@/lib/utils";

function PreBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
        {label}
      </p>
      <pre className="max-h-56 overflow-auto rounded-md border border-border bg-muted/40 p-2.5 font-mono text-[11px] leading-relaxed whitespace-pre">
        {value || "—"}
      </pre>
    </div>
  );
}

function MetaPill({ label, value }: { label: string; value: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-md border border-border bg-muted/40 px-2 py-1 text-[11px]">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-mono font-medium">{value}</span>
    </span>
  );
}

function Approvals({ review }: { review: ProblemReviewDetail }) {
  const active = review.approvals.filter(
    (approval) => approval.status === "ACTIVE",
  );
  const superseded = review.approvals.length - active.length;

  return (
    <ProblemSectionCard
      title="Setter approvals"
      description={`${active.length} active of ${review.gates.requiredApprovals} required · each approval keeps the reference solution the setter verified with.`}
      icon={CheckCircle2}
      bodyClassName="px-5 py-4"
    >
      {active.length === 0 ? (
        <p className="text-xs text-muted-foreground">
          No active approvals in cycle {review.reviewCycle} yet.
        </p>
      ) : (
        <ul className="space-y-4">
          {active.map((approval) => (
            <li
              key={approval.id}
              className="min-w-0 rounded-lg border border-border"
            >
              <div className="flex flex-wrap items-center gap-2 border-b border-border px-3 py-2.5">
                {approval.reviewer ? (
                  <UserAvatar
                    name={approval.reviewer.displayName}
                    username={approval.reviewer.username}
                    size="sm"
                  />
                ) : null}
                <span className="text-sm font-medium">
                  {approval.reviewer?.displayName ?? "Removed setter"}
                </span>
                <Badge variant="success">Approved</Badge>
                <Badge variant="outline">
                  {getLanguage(approval.solutionLanguage).label}
                </Badge>
                <Badge variant="outline">
                  {approval.testsAdded} test
                  {approval.testsAdded === 1 ? "" : "s"} added
                </Badge>
                {approval.editorialProvided ? (
                  <Badge variant="outline">Editorial provided</Badge>
                ) : null}
                <span className="ml-auto text-[11px] text-muted-foreground">
                  {formatRelative(approval.createdAt)}
                </span>
              </div>
              <div className="space-y-2 px-3 py-3">
                {approval.note ? (
                  <p className="whitespace-pre-wrap text-sm leading-relaxed">
                    {approval.note}
                  </p>
                ) : null}
                <PreBlock
                  label="Reference solution"
                  value={approval.solutionSource}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
      {superseded > 0 ? (
        <p className="mt-3 text-[11px] text-muted-foreground">
          {superseded} earlier approval{superseded === 1 ? "" : "s"} were
          superseded when the problem was held or the cycle restarted.
        </p>
      ) : null}
    </ProblemSectionCard>
  );
}

export function ProblemReviewPreview({
  review,
}: {
  review: ProblemReviewDetail;
}) {
  const hasIo = Boolean(review.inputFormat || review.outputFormat);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-1.5">
        <DifficultyBadge difficulty={review.difficulty} />
        <MetaPill label="Points" value={String(review.points)} />
        <MetaPill label="Time" value={`${review.timeLimitMs} ms`} />
        <MetaPill label="Memory" value={`${review.memoryLimitMb} MB`} />
        <MetaPill label="Tests" value={String(review.testCounts.total)} />
        <span className="text-[11px] text-muted-foreground">
          {review.author
            ? `By ${review.author.displayName} · `
            : "Unknown author · "}
          created {formatDate(review.createdAt)}
        </span>
      </div>

      <ProblemSectionCard
        title="Problem statement"
        icon={FileText}
        bodyClassName="px-5 py-5 sm:px-6"
      >
        <Markdown className="max-w-3xl">{review.statement}</Markdown>
      </ProblemSectionCard>

      {hasIo ? (
        <div className="grid gap-5 md:grid-cols-2">
          {review.inputFormat ? (
            <ProblemSectionCard title="Input" icon={ArrowDownToLine}>
              <Markdown className="max-w-3xl">{review.inputFormat}</Markdown>
            </ProblemSectionCard>
          ) : null}
          {review.outputFormat ? (
            <ProblemSectionCard title="Output" icon={ArrowUpFromLine}>
              <Markdown className="max-w-3xl">{review.outputFormat}</Markdown>
            </ProblemSectionCard>
          ) : null}
        </div>
      ) : null}

      {review.constraints ? (
        <ProblemSectionCard
          title="Constraints"
          icon={ShieldAlert}
          bodyClassName="px-5 py-4"
        >
          <Markdown className="max-w-3xl">{review.constraints}</Markdown>
        </ProblemSectionCard>
      ) : null}

      <ProblemSectionCard
        title="Editorial"
        description={
          review.editorial
            ? "Shown to solvers after they solve the problem."
            : "A gate: publishing requires an editorial."
        }
        icon={BookOpen}
        bodyClassName="px-5 py-4"
      >
        {review.editorial ? (
          <Markdown className="max-w-3xl">{review.editorial}</Markdown>
        ) : (
          <div className="flex items-start gap-2 rounded-md border border-dashed border-border bg-muted/20 px-3 py-2.5 text-xs text-muted-foreground">
            <ListChecks
              className="mt-0.5 size-3.5 shrink-0"
              aria-hidden="true"
            />
            <p>
              No editorial yet. An approver can add one while approving, or the
              author can write it before submitting or while fixing a hold.
            </p>
          </div>
        )}
      </ProblemSectionCard>

      <ProblemSectionCard
        title="Test cases"
        description={`${review.testCounts.total} total · ${review.testCounts.samples} sample · ${review.testCounts.hidden} hidden`}
        icon={FlaskConical}
        bodyClassName="px-5 py-4"
      >
        {review.testCases.length === 0 ? (
          <p className="text-xs text-muted-foreground">
            This problem has no test cases yet.
          </p>
        ) : (
          <ul className="space-y-2">
            {review.testCases.map((test, index) => (
              <li key={index}>
                <details className="group rounded-md border border-border">
                  <summary className="flex cursor-pointer list-none items-center gap-2 px-3 py-2 text-xs font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                    <ChevronRight
                      className="size-3.5 shrink-0 text-muted-foreground transition-transform group-open:rotate-90"
                      aria-hidden="true"
                    />
                    <span className="font-mono">Test {index + 1}</span>
                    <Badge variant={test.isSample ? "success" : "muted"}>
                      {test.isSample ? "Sample" : "Hidden"}
                    </Badge>
                  </summary>
                  <div className="grid gap-3 border-t border-border p-3 md:grid-cols-2">
                    <PreBlock label="Input" value={test.input} />
                    <PreBlock
                      label="Expected output"
                      value={test.expectedOutput}
                    />
                  </div>
                </details>
              </li>
            ))}
          </ul>
        )}
      </ProblemSectionCard>

      <Approvals review={review} />

      {review.tags.length > 0 ? (
        <div className="flex flex-wrap items-center gap-1.5 px-1">
          {review.tags.map((tag) => (
            <span
              key={tag}
              className="rounded border border-border bg-muted/60 px-1.5 py-0.5 text-[11px] text-muted-foreground"
            >
              {tag}
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}
