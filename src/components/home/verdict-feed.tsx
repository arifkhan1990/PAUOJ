import Link from "next/link";
import { Code2 } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";
import { SectionHeading } from "@/components/shared/section-heading";
import { SubmissionActivityChart } from "@/components/shared/submission-activity-chart";
import { VerdictBadge } from "@/components/shared/verdict-badge";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getLanguage } from "@/lib/languages";
import type { HeatmapDay, SubmissionListItem } from "@/lib/types";
import { isAccepted, verdictMeta } from "@/lib/verdicts";
import {
  cn,
  formatMemory,
  formatRelative,
  formatRuntime,
} from "@/lib/utils";

function VerdictRow({ item }: { item: SubmissionListItem }) {
  const language = getLanguage(item.language);

  return (
    <Link
      href={`/submissions/${item.id}`}
      className="group grid grid-cols-[auto_minmax(0,1fr)] items-center gap-x-3 gap-y-1 px-4 py-3.5 transition-colors hover:bg-muted/40 sm:grid-cols-[7rem_minmax(0,1fr)_5rem_4.5rem] sm:px-5 md:grid-cols-[7rem_minmax(0,1fr)_5rem_5rem_4.5rem] lg:grid-cols-[7rem_minmax(0,1fr)_8rem_5rem_5rem_4.5rem]"
    >
      <VerdictBadge status={item.status} short />
      <div className="min-w-0">
        <p className="truncate text-sm font-medium transition-colors group-hover:text-primary">
          {item.problem.title}
        </p>
        <p className="mt-0.5 truncate text-xs text-muted-foreground">
          {item.user.displayName} · {language.shortLabel} · {item.passedTests}/
          {item.totalTests} tests
          <span className="sm:hidden">
            {" "}
            · {formatRelative(item.createdAt)}
          </span>
        </p>
      </div>
      <span className="hidden text-xs text-muted-foreground lg:block">
        {language.label}
      </span>
      <span className="hidden text-right font-mono text-xs tabular-nums sm:block">
        {formatRuntime(item.runtimeMs)}
      </span>
      <span className="hidden text-right font-mono text-xs tabular-nums md:block">
        {formatMemory(item.memoryKb)}
      </span>
      <span className="hidden text-right text-xs text-muted-foreground sm:block">
        {formatRelative(item.createdAt)}
      </span>
    </Link>
  );
}

export function VerdictFeed({
  items,
  activity,
}: {
  items: SubmissionListItem[];
  activity: HeatmapDay[];
}) {
  const accepted = items.filter((item) => isAccepted(item.status)).length;

  return (
    <section id="verdicts" className="mx-auto max-w-7xl scroll-mt-20 px-4 py-16 sm:px-6 lg:px-8">
      <SectionHeading
        eyebrow="The judge"
        title="Every verdict, out in the open"
        description="Compiled and tested in isolation, then reported with runtime, memory and the exact tests that failed."
        href="/submissions"
        linkLabel="All submissions"
        size="lg"
      />

      <SubmissionActivityChart
        days={activity}
        compact
        className="reveal mt-5"
        title="Judge pulse"
        description="Submissions and accepted verdicts over the last 14 days."
      />

      <Card className="reveal mt-4 overflow-hidden">
        {items.length === 0 ? (
          <EmptyState
            className="border-0"
            title="No submissions yet"
            description="Be the first to send code to the judge."
            icon={Code2}
            action={
              <Link href="/problems" className={buttonVariants()}>
                Find a problem
              </Link>
            }
          />
        ) : (
          <>
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-muted/30 px-4 py-3 sm:px-5">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="relative flex size-2">
                  <span className="absolute inline-flex size-full rounded-full bg-emerald-500/50 animate-pulse-soft" />
                  <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
                </span>
                Judge active
                <span className="text-border">/</span>
                {accepted} of the latest {items.length} accepted
              </div>
              <div className="flex items-center gap-1" aria-hidden>
                {items.map((item) => (
                  <span
                    key={item.id}
                    className={cn(
                      "h-1.5 w-6 rounded-full opacity-80",
                      verdictMeta(item.status).dotClassName,
                    )}
                  />
                ))}
              </div>
            </div>
            <div className="divide-y divide-border">
              {items.map((item) => (
                <VerdictRow key={item.id} item={item} />
              ))}
            </div>
          </>
        )}
      </Card>
    </section>
  );
}
