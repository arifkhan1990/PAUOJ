"use client";

import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type TooltipContentProps,
} from "recharts";
import { BarChart3 } from "lucide-react";
import { Card } from "@/components/ui/card";
import type { HeatmapDay } from "@/lib/types";
import { usePrefersReducedMotion } from "@/lib/use-prefers-reduced-motion";
import { cn, formatPercent } from "@/lib/utils";

type ActivityPoint = {
  date: string;
  label: string;
  total: number;
  accepted: number;
  other: number;
  acceptance: number | null;
};

function buildSeries(days: HeatmapDay[]): ActivityPoint[] {
  return days.map((day) => ({
    date: day.date,
    label: day.date.slice(8),
    total: day.total,
    accepted: day.accepted,
    other: Math.max(0, day.total - day.accepted),
    acceptance:
      day.total > 0
        ? Math.round((day.accepted / day.total) * 1000) / 10
        : null,
  }));
}

function ActivityTooltip({
  active,
  payload,
}: TooltipContentProps) {
  if (!active || !payload || payload.length === 0) return null;
  const point = payload[0]?.payload as ActivityPoint | undefined;
  if (!point) return null;

  return (
    <div className="rounded-lg border border-border bg-popover px-3 py-2 text-xs shadow-lg">
      <p className="font-medium">{point.date}</p>
      <dl className="mt-2 space-y-1">
        <div className="flex items-center justify-between gap-6">
          <dt className="text-muted-foreground">Total</dt>
          <dd className="font-mono tabular-nums">{point.total}</dd>
        </div>
        <div className="flex items-center justify-between gap-6">
          <dt className="text-muted-foreground">Accepted</dt>
          <dd className="font-mono tabular-nums text-emerald-600 dark:text-emerald-400">
            {point.accepted}
          </dd>
        </div>
        <div className="flex items-center justify-between gap-6">
          <dt className="text-muted-foreground">Acceptance rate</dt>
          <dd className="font-mono tabular-nums">
            {point.acceptance === null
              ? "—"
              : formatPercent(point.acceptance, 0)}
          </dd>
        </div>
      </dl>
    </div>
  );
}

function LegendSwatch({ className, label }: { className: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={cn("size-2.5 rounded-sm", className)} />
      {label}
    </span>
  );
}

export function SubmissionActivityChart({
  days,
  title = "Judge pulse",
  description = "Submissions and accepted verdicts over the last 14 days.",
  compact = false,
  className,
}: {
  days: HeatmapDay[];
  title?: string;
  description?: string;
  compact?: boolean;
  className?: string;
}) {
  const reducedMotion = usePrefersReducedMotion();
  const series = buildSeries(days);
  const total = days.reduce((sum, day) => sum + day.total, 0);
  const accepted = days.reduce((sum, day) => sum + day.accepted, 0);
  const acceptance = total > 0 ? (accepted / total) * 100 : 0;
  const hasActivity = total > 0;
  const height = compact ? 190 : 250;

  return (
    <Card className={cn("overflow-hidden", className)}>
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border bg-muted/20 px-5 py-4">
        <div>
          <h2 className="text-sm font-semibold">{title}</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
          <LegendSwatch className="bg-primary" label="Accepted" />
          <LegendSwatch className="bg-accent/40" label="Other" />
          <span className="inline-flex items-center gap-1.5">
            <span className="h-0.5 w-4 rounded-full bg-foreground/45" />
            Acceptance rate
          </span>
        </div>
      </div>

      <div className="px-5 pb-4 pt-4">
        <div className="flex flex-wrap items-baseline gap-x-5 gap-y-1">
          <p className="flex items-baseline gap-1.5">
            <span className="text-2xl font-semibold tabular-nums">
              {total.toLocaleString("en-US")}
            </span>
            <span className="text-xs text-muted-foreground">submissions</span>
          </p>
          <p className="flex items-baseline gap-1.5">
            <span className="text-sm font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
              {accepted.toLocaleString("en-US")}
            </span>
            <span className="text-xs text-muted-foreground">accepted</span>
          </p>
          <p className="text-xs text-muted-foreground">
            {formatPercent(acceptance, 0)} acceptance
          </p>
        </div>

        {hasActivity ? (
          <div className="mt-3 w-full">
            <ResponsiveContainer
              width="100%"
              height={height}
              initialDimension={{ width: 800, height }}
            >
              <ComposedChart
                data={series}
                margin={{
                  top: 8,
                  right: compact ? 4 : 8,
                  bottom: 0,
                  left: compact ? -20 : -8,
                }}
                accessibilityLayer
                aria-label={`Daily submissions and acceptance rate for the last ${days.length} days`}
              >
                <CartesianGrid
                  vertical={false}
                  stroke="var(--border)"
                  strokeDasharray="3 3"
                />
                <XAxis
                  dataKey="label"
                  interval={compact ? 1 : 0}
                  tick={{ fill: "var(--muted-foreground)", fontSize: 10 }}
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                />
                <YAxis
                  yAxisId="total"
                  hide={compact}
                  width={30}
                  allowDecimals={false}
                  tick={{ fill: "var(--muted-foreground)", fontSize: 10 }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  yAxisId="rate"
                  orientation="right"
                  hide={compact}
                  width={34}
                  domain={[0, 100]}
                  tickFormatter={(value: number) => `${value}%`}
                  tick={{ fill: "var(--muted-foreground)", fontSize: 10 }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  content={(props) => <ActivityTooltip {...props} />}
                  cursor={{ fill: "var(--muted)", opacity: 0.5 }}
                />
                <Bar
                  yAxisId="total"
                  dataKey="accepted"
                  name="Accepted"
                  stackId="submissions"
                  fill="var(--primary)"
                  maxBarSize={30}
                  radius={[0, 0, 0, 0]}
                  isAnimationActive={!reducedMotion}
                  animationDuration={500}
                />
                <Bar
                  yAxisId="total"
                  dataKey="other"
                  name="Other"
                  stackId="submissions"
                  fill="var(--accent)"
                  fillOpacity={0.35}
                  maxBarSize={30}
                  radius={[3, 3, 0, 0]}
                  isAnimationActive={!reducedMotion}
                  animationDuration={500}
                />
                <Line
                  yAxisId="rate"
                  type="monotone"
                  dataKey="acceptance"
                  name="Acceptance rate"
                  stroke="var(--foreground)"
                  strokeOpacity={0.45}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 3 }}
                  connectNulls={false}
                  isAnimationActive={!reducedMotion}
                  animationDuration={500}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="mt-4 flex items-center gap-3 rounded-lg border border-dashed border-border bg-muted/20 px-4 py-6 text-xs text-muted-foreground">
            <BarChart3 className="size-4 shrink-0" />
            No submissions in the last {days.length} days yet.
          </div>
        )}
      </div>
    </Card>
  );
}
