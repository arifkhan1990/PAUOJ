"use client";

import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  type TooltipContentProps,
} from "recharts";
import { ChartPie } from "lucide-react";
import { Card } from "@/components/ui/card";
import { getLanguage } from "@/lib/languages";
import type { ProblemStatistics } from "@/lib/types";
import { usePrefersReducedMotion } from "@/lib/use-prefers-reduced-motion";
import { cn, formatPercent } from "@/lib/utils";

const LANGUAGE_FILL: Record<string, string> = {
  cpp: "#2563eb",
  c: "#06b6d4",
  java: "#f97316",
  python: "#8b5cf6",
  javascript: "#eab308",
};

type LanguagePoint = {
  language: string;
  label: string;
  count: number;
  share: number;
};

function LanguageTooltip({ active, payload }: TooltipContentProps) {
  if (!active || !payload || payload.length === 0) return null;
  const point = payload[0]?.payload as LanguagePoint | undefined;
  if (!point) return null;

  return (
    <div className="rounded-lg border border-border bg-popover px-3 py-2 text-xs shadow-lg">
      <p className="font-medium">{point.label}</p>
      <p className="mt-1 font-mono tabular-nums text-muted-foreground">
        {point.count.toLocaleString("en-US")} submissions ·{" "}
        {formatPercent(point.share, 1)}
      </p>
    </div>
  );
}

export function ProblemLanguageChart({
  statistics,
  className,
}: {
  statistics: ProblemStatistics;
  className?: string;
}) {
  const reducedMotion = usePrefersReducedMotion();
  const total = statistics.submissionCount;
  const points: LanguagePoint[] = statistics.byLanguage.map((row) => ({
    language: row.language,
    label: getLanguage(row.language).shortLabel,
    count: row.count,
    share: total > 0 ? (row.count / total) * 100 : 0,
  }));

  return (
    <Card className={cn("min-w-0 overflow-hidden", className)}>
      <div className="flex items-start gap-3 border-b border-border bg-muted/20 px-5 py-3.5">
        <span className="grid size-7 shrink-0 place-items-center rounded-md bg-primary/10 text-primary">
          <ChartPie className="size-4" />
        </span>
        <div>
          <h3 className="text-sm font-semibold">Languages statistics</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Which languages solvers reach for on this problem.
          </p>
        </div>
      </div>

      {points.length > 0 ? (
        <div className="px-5 pb-4 pt-3">
          <div className="w-full">
            <ResponsiveContainer
              width="100%"
              height={170}
            >
              <PieChart
                accessibilityLayer
                aria-label="Submissions grouped by programming language"
              >
                <Pie
                  data={points}
                  dataKey="count"
                  nameKey="label"
                  innerRadius="55%"
                  outerRadius="82%"
                  paddingAngle={2}
                  stroke="var(--card)"
                  strokeWidth={2}
                  isAnimationActive={!reducedMotion}
                  animationDuration={500}
                >
                  {points.map((point) => (
                    <Cell
                      key={point.language}
                      fill={LANGUAGE_FILL[point.language] ?? "#64748b"}
                    />
                  ))}
                </Pie>
                <Tooltip content={(props) => <LanguageTooltip {...props} />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <ul className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1.5 text-[11px] text-muted-foreground">
            {points.map((point) => (
              <li key={point.language} className="flex items-center gap-1.5">
                <span
                  className="size-2.5 shrink-0 rounded-sm"
                  style={{
                    backgroundColor: LANGUAGE_FILL[point.language] ?? "#64748b",
                  }}
                />
                <span className="truncate text-foreground">{point.label}</span>
                <span className="ml-auto font-mono tabular-nums">
                  {formatPercent(point.share, 0)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="flex items-center gap-3 px-5 py-8 text-xs text-muted-foreground">
          <ChartPie className="size-4 shrink-0" />
          Language statistics appear after the first submission.
        </div>
      )}
    </Card>
  );
}
