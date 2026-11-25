"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type TooltipContentProps,
} from "recharts";
import type { SubmissionBucket } from "@/lib/submission-types";
import { usePrefersReducedMotion } from "@/lib/use-prefers-reduced-motion";
import { cn, formatPercent, formatRuntime } from "@/lib/utils";

type RuntimePoint = {
  label: string;
  rangeLabel: string;
  count: number;
  share: number;
  current: boolean;
};

/** Buckets are half-open: `max` is exclusive and missing on the last bucket. */
function bucketRangeLabel(bucket: SubmissionBucket): string {
  const start = formatRuntime(bucket.min);
  if (bucket.max === null) return `${start} or slower`;
  return `${start} – ${formatRuntime(bucket.max)}`;
}

function RuntimeDistributionTooltip({ active, payload }: TooltipContentProps) {
  if (!active || !payload || payload.length === 0) return null;
  const point = payload[0]?.payload as RuntimePoint | undefined;
  if (!point) return null;

  return (
    <div className="rounded-lg border border-border bg-popover px-3 py-2 text-xs shadow-lg">
      <p className="font-medium">
        {point.rangeLabel}
        {point.current ? (
          <span className="ml-1.5 rounded bg-primary/10 px-1 py-0.5 text-[10px] font-semibold text-primary">
            your run
          </span>
        ) : null}
      </p>
      <p className="mt-1 font-mono tabular-nums text-muted-foreground">
        {point.count.toLocaleString("en-US")} runs ·{" "}
        {formatPercent(point.share, 1)}
      </p>
    </div>
  );
}

/**
 * Runtime histogram for accepted runs on the same problem. The highlighted
 * bar is the bucket the current submission falls into.
 */
export function RuntimeDistributionChart({
  buckets,
  sampleSize,
  median,
  best,
  className,
}: {
  buckets: SubmissionBucket[];
  sampleSize: number;
  median: number | null;
  best: number | null;
  className?: string;
}) {
  const reducedMotion = usePrefersReducedMotion();
  const points: RuntimePoint[] = buckets.map((bucket) => ({
    label: formatRuntime(bucket.min),
    rangeLabel: bucketRangeLabel(bucket),
    count: bucket.count,
    share: bucket.share,
    current: bucket.current,
  }));
  // Keep at most ~8 labels so 24 buckets still read on a 390px screen.
  const tickInterval = Math.max(1, Math.ceil(points.length / 8)) - 1;

  return (
    <figure className={cn("min-w-0", className)}>
      <div className="w-full">
        <ResponsiveContainer width="100%" height={220}>
          <BarChart
            data={points}
            margin={{ top: 8, right: 8, bottom: 0, left: -12 }}
            accessibilityLayer
            aria-label="Runtime distribution of accepted runs on this problem"
          >
            <CartesianGrid
              vertical={false}
              stroke="var(--border)"
              strokeDasharray="3 3"
            />
            <XAxis
              dataKey="label"
              interval={tickInterval}
              tick={{ fill: "var(--muted-foreground)", fontSize: 10 }}
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={6}
            />
            <YAxis
              width={38}
              tick={{ fill: "var(--muted-foreground)", fontSize: 10 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value: number) => `${Math.round(value)}%`}
            />
            <Tooltip
              content={(props) => <RuntimeDistributionTooltip {...props} />}
              cursor={{ fill: "var(--muted)", opacity: 0.5 }}
            />
            <Bar
              dataKey="share"
              name="Share of runs"
              maxBarSize={40}
              radius={[3, 3, 0, 0]}
              isAnimationActive={!reducedMotion}
              animationDuration={500}
            >
              {points.map((point, index) => (
                <Cell
                  key={`${index}-${point.label}`}
                  fill={
                    point.current ? "var(--primary)" : "var(--muted-foreground)"
                  }
                  fillOpacity={point.current ? 1 : 0.35}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <figcaption className="sr-only">
        {`Runtime distribution across ${sampleSize} accepted runs. Median ${formatRuntime(
          median,
        )}, fastest ${formatRuntime(best)}.`}
      </figcaption>
    </figure>
  );
}
