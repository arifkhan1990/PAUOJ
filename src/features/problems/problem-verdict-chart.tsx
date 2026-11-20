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
import { BarChart3 } from "lucide-react";
import { Card } from "@/components/ui/card";
import type { ProblemStatistics } from "@/lib/types";
import { usePrefersReducedMotion } from "@/lib/use-prefers-reduced-motion";
import { cn, formatPercent } from "@/lib/utils";
import { verdictMeta } from "@/lib/verdicts";

type VerdictPoint = {
  status: string;
  label: string;
  count: number;
  share: number;
};

function VerdictTooltip({ active, payload }: TooltipContentProps) {
  if (!active || !payload || payload.length === 0) return null;
  const point = payload[0]?.payload as VerdictPoint | undefined;
  if (!point) return null;

  return (
    <div className="rounded-lg border border-border bg-popover px-3 py-2 text-xs shadow-lg">
      <p className="font-medium">{verdictMeta(point.status).label}</p>
      <p className="mt-1 font-mono tabular-nums text-muted-foreground">
        {point.count.toLocaleString("en-US")} submissions ·{" "}
        {formatPercent(point.share, 1)}
      </p>
    </div>
  );
}

export function ProblemVerdictChart({
  statistics,
  className,
}: {
  statistics: ProblemStatistics;
  className?: string;
}) {
  const reducedMotion = usePrefersReducedMotion();
  const total = statistics.submissionCount;
  const points: VerdictPoint[] = statistics.byVerdict.map((row) => ({
    status: row.status,
    label: verdictMeta(row.status).short,
    count: row.count,
    share: total > 0 ? (row.count / total) * 100 : 0,
  }));

  return (
    <Card className={cn("min-w-0 overflow-hidden", className)}>
      <div className="flex items-start gap-3 border-b border-border bg-muted/20 px-5 py-3.5">
        <span className="grid size-7 shrink-0 place-items-center rounded-md bg-primary/10 text-primary">
          <BarChart3 className="size-4" />
        </span>
        <div>
          <h3 className="text-sm font-semibold">Submissions by verdict</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Every judged attempt on this problem, grouped by answer.
          </p>
        </div>
      </div>
      <div className="px-5 pb-4 pt-4">
        {points.length > 0 ? (
          <div className="w-full">
            <ResponsiveContainer
              width="100%"
              height={240}
            >
              <BarChart
                data={points}
                margin={{ top: 8, right: 8, bottom: 0, left: -18 }}
                accessibilityLayer
                aria-label="Submissions grouped by verdict"
              >
                <CartesianGrid
                  vertical={false}
                  stroke="var(--border)"
                  strokeDasharray="3 3"
                />
                <XAxis
                  dataKey="label"
                  tick={{ fill: "var(--muted-foreground)", fontSize: 10 }}
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                />
                <YAxis
                  allowDecimals={false}
                  width={30}
                  tick={{ fill: "var(--muted-foreground)", fontSize: 10 }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  content={(props) => <VerdictTooltip {...props} />}
                  cursor={{ fill: "var(--muted)", opacity: 0.5 }}
                />
                <Bar
                  dataKey="count"
                  name="Submissions"
                  maxBarSize={36}
                  radius={[3, 3, 0, 0]}
                  isAnimationActive={!reducedMotion}
                  animationDuration={500}
                >
                  {points.map((point) => (
                    <Cell
                      key={point.status}
                      fill={verdictMeta(point.status).chartColor}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="flex items-center gap-3 rounded-lg border border-dashed border-border bg-muted/20 px-4 py-6 text-xs text-muted-foreground">
            <BarChart3 className="size-4 shrink-0" />
            No submissions yet. Be the first to solve it.
          </div>
        )}
      </div>
    </Card>
  );
}
