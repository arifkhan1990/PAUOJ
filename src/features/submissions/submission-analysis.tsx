import {
  BarChart3,
  Clock3,
  MemoryStick,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import type {
  SubmissionAnalysis,
  SubmissionBucket,
  SubmissionMetricAnalysis,
} from "@/lib/submission-types";
import { cn, formatMemory, formatPercent, formatRuntime } from "@/lib/utils";
import { RuntimeDistributionChart } from "./runtime-distribution-chart";

type Scope = SubmissionMetricAnalysis["scope"];

function scopeCaption(scope: Scope, languageLabel: string): string {
  return scope === "language"
    ? `vs accepted ${languageLabel} runs on this problem`
    : "vs accepted runs in all languages";
}

function MetricTile({
  label,
  value,
  metric,
  languageLabel,
  icon: Icon,
}: {
  label: string;
  value: string;
  metric: SubmissionMetricAnalysis;
  languageLabel: string;
  icon: LucideIcon;
}) {
  const beats = metric.beats;

  return (
    <Card className="p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
          <Icon className="size-3.5" aria-hidden="true" />
          {label}
        </h3>
        {beats !== null ? (
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold",
              beats >= 50
                ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                : "bg-muted text-muted-foreground",
            )}
          >
            {beats >= 50 ? (
              <TrendingUp className="size-3" aria-hidden="true" />
            ) : null}
            Beats {formatPercent(beats, 1)}
          </span>
        ) : null}
      </div>
      <p className="mt-2 font-mono text-2xl font-semibold tabular-nums tracking-tight">
        {value}
      </p>
      <p className="mt-1 text-[11px] text-muted-foreground">
        {beats !== null
          ? scopeCaption(metric.scope, languageLabel)
          : "Not enough data yet"}
      </p>
    </Card>
  );
}

/** Proportional strip under the histogram; the current bucket keeps the primary tone. */
function DistributionRail({ buckets }: { buckets: SubmissionBucket[] }) {
  return (
    <div className="mt-3">
      <div
        aria-hidden="true"
        className="flex h-2 w-full gap-px overflow-hidden rounded-full bg-muted"
      >
        {buckets.map((bucket, index) => (
          <span
            key={`${index}-${bucket.min}`}
            className={cn(
              "h-full",
              bucket.current ? "bg-primary" : "bg-muted-foreground/30",
            )}
            style={{ width: `${bucket.share}%` }}
          />
        ))}
      </div>
      <p className="mt-1.5 text-[11px] text-muted-foreground">
        The highlighted segment is the bucket this run falls into.
      </p>
    </div>
  );
}

function DistributionSummary({
  metric,
  scope,
  languageLabel,
}: {
  metric: SubmissionMetricAnalysis;
  scope: Scope;
  languageLabel: string;
}) {
  return (
    <dl className="mt-4 grid grid-cols-3 gap-3 border-t border-border pt-3 text-xs">
      <div>
        <dt className="text-muted-foreground">Fastest</dt>
        <dd className="mt-0.5 font-mono font-semibold tabular-nums">
          {formatRuntime(metric.best)}
        </dd>
      </div>
      <div>
        <dt className="text-muted-foreground">Median</dt>
        <dd className="mt-0.5 font-mono font-semibold tabular-nums">
          {formatRuntime(metric.median)}
        </dd>
      </div>
      <div>
        <dt className="text-muted-foreground">Accepted runs</dt>
        <dd className="mt-0.5 font-mono font-semibold tabular-nums">
          {metric.sampleSize.toLocaleString("en-US")}
          <span className="ml-1 font-sans text-[10px] font-normal text-muted-foreground">
            {scope === "language" ? languageLabel : "all languages"}
          </span>
        </dd>
      </div>
    </dl>
  );
}

/**
 * LeetCode-style analysis block for an accepted submission: two metric tiles
 * with percentile beats, then the runtime histogram and its distribution rail.
 */
export function SubmissionAnalysisBlock({
  analysis,
  languageLabel,
}: {
  analysis: SubmissionAnalysis;
  languageLabel: string;
}) {
  const runtime = analysis.runtime;
  const hasDistribution = runtime.buckets.length > 0 && runtime.sampleSize > 0;

  return (
    <section className="mt-6" aria-labelledby="performance-heading">
      <h2 id="performance-heading" className="sr-only">
        Performance analysis
      </h2>
      <div className="grid gap-3 sm:grid-cols-2">
        <MetricTile
          label="Runtime"
          value={formatRuntime(runtime.value)}
          metric={runtime}
          languageLabel={languageLabel}
          icon={Clock3}
        />
        <MetricTile
          label="Memory"
          value={formatMemory(analysis.memory.value)}
          metric={analysis.memory}
          languageLabel={languageLabel}
          icon={MemoryStick}
        />
      </div>

      <Card className="mt-3 overflow-hidden">
        <div className="flex items-start gap-3 border-b border-border bg-muted/20 px-5 py-3.5">
          <span className="grid size-7 shrink-0 place-items-center rounded-md bg-primary/10 text-primary">
            <BarChart3 className="size-4" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold">Runtime distribution</h3>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {hasDistribution
                ? `How accepted ${
                    runtime.scope === "language" ? `${languageLabel} ` : ""
                  }runs on this problem are spread.`
                : "Percentile and distribution data will appear once enough comparable runs exist."}
            </p>
          </div>
        </div>

        {hasDistribution ? (
          <div className="px-5 pb-5 pt-4">
            <RuntimeDistributionChart
              buckets={runtime.buckets}
              sampleSize={runtime.sampleSize}
              median={runtime.median}
              best={runtime.best}
            />
            <DistributionRail buckets={runtime.buckets} />
            <DistributionSummary
              metric={runtime}
              scope={runtime.scope}
              languageLabel={languageLabel}
            />
          </div>
        ) : (
          <div className="flex items-start gap-3 p-5 text-sm text-muted-foreground">
            <BarChart3 className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            <div>
              <p className="font-medium text-foreground">Not enough data yet</p>
              <p className="mt-1 text-xs leading-relaxed">
                We compare only accepted runs on this problem. A distribution
                appears once the sample is large enough.
              </p>
            </div>
          </div>
        )}
      </Card>
    </section>
  );
}
