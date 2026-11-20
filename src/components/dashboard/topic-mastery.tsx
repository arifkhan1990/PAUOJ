"use client";

import Link from "next/link";
import { Tags } from "lucide-react";
import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  type TooltipContentProps,
} from "recharts";
import { DashboardPanel } from "@/components/dashboard/dashboard-panel";
import { EmptyState } from "@/components/shared/empty-state";
import { buttonVariants } from "@/components/ui/button";
import type { ProfileTagStat } from "@/lib/profile-types";

type TopicPoint = {
  name: string;
  solved: number;
  attempted: number;
  total: number;
};

function TopicTooltip({ active, payload }: TooltipContentProps) {
  if (!active || !payload || payload.length === 0) return null;
  const point = payload[0]?.payload as TopicPoint | undefined;
  if (!point) return null;

  const coverage =
    point.total > 0 ? Math.round((point.solved / point.total) * 100) : 0;

  return (
    <div className="min-w-40 rounded-lg border border-border bg-popover px-2.5 py-2 text-[11px] shadow-lg">
      <p className="font-medium">{point.name}</p>
      <dl className="mt-1.5 space-y-0.5">
        <div className="flex items-center justify-between gap-5">
          <dt className="text-muted-foreground">Solved</dt>
          <dd className="font-mono tabular-nums">{point.solved}</dd>
        </div>
        <div className="flex items-center justify-between gap-5">
          <dt className="text-muted-foreground">Attempted</dt>
          <dd className="font-mono tabular-nums">{point.attempted}</dd>
        </div>
        <div className="flex items-center justify-between gap-5">
          <dt className="text-muted-foreground">Coverage</dt>
          <dd className="font-mono tabular-nums">{coverage}%</dd>
        </div>
      </dl>
    </div>
  );
}

export function TopicMastery({ tags }: { tags: ProfileTagStat[] }) {
  const topTags = tags.slice(0, 6);
  const totalSolved = topTags.reduce((sum, tag) => sum + tag.solved, 0);
  const maxAttempted = Math.max(1, ...topTags.map((tag) => tag.attempted));
  const domainMax = Math.max(2, Math.ceil(maxAttempted * 1.15));
  const data: TopicPoint[] = topTags.map((tag) => ({
    name: tag.name,
    solved: tag.solved,
    attempted: tag.attempted,
    total: tag.total,
  }));

  return (
    <DashboardPanel
      title="Skill mastery"
      description="Your strongest topics by solved problems."
      icon={<Tags className="size-4" />}
      action={
        <Link
          href="/problems"
          className="text-[11px] font-medium text-primary hover:underline"
        >
          Practice
        </Link>
      }
      bodyClassName="flex flex-col px-3 pb-3 pt-2"
    >
      {topTags.length === 0 ? (
        <EmptyState
          className="border-0 px-0 py-8"
          title="No topic data yet"
          description="Solve a tagged problem to see your strengths and weak spots."
          icon={Tags}
          action={
            <Link href="/problems" className={buttonVariants({ size: "sm" })}>
              Browse problems
            </Link>
          }
        />
      ) : (
        <div className="flex min-h-0 flex-1 flex-col gap-2">
          <div className="min-h-[240px] flex-1">
            <ResponsiveContainer
              width="100%"
              height="100%"
              initialDimension={{ width: 520, height: 260 }}
            >
              <RadarChart
                data={data}
                outerRadius="64%"
                margin={{ top: 10, right: 24, bottom: 4, left: 24 }}
                accessibilityLayer
                aria-label="Skill mastery radar chart by problem topic"
              >
                <PolarGrid stroke="var(--border)" gridType="polygon" />
                <PolarAngleAxis
                  dataKey="name"
                  tick={{ fill: "var(--muted-foreground)", fontSize: 10 }}
                  tickFormatter={(value: string) =>
                    value.length > 20 ? `${value.slice(0, 19)}…` : value
                  }
                />
                <PolarRadiusAxis
                  domain={[0, domainMax]}
                  tick={false}
                  axisLine={false}
                />
                <Tooltip
                  content={(props) => <TopicTooltip {...props} />}
                  cursor={false}
                />
                <Radar
                  name="Attempted"
                  dataKey="attempted"
                  stroke="var(--warning)"
                  strokeWidth={1.5}
                  strokeDasharray="3 3"
                  fill="var(--warning)"
                  fillOpacity={0.05}
                  isAnimationActive={false}
                />
                <Radar
                  name="Solved"
                  dataKey="solved"
                  stroke="var(--primary)"
                  strokeWidth={2}
                  fill="var(--primary)"
                  fillOpacity={0.24}
                  dot={{
                    r: 3,
                    fill: "var(--primary)",
                    stroke: "var(--card)",
                    strokeWidth: 1,
                  }}
                  activeDot={{
                    r: 4.5,
                    fill: "var(--primary)",
                    stroke: "var(--card)",
                    strokeWidth: 1,
                  }}
                  isAnimationActive={false}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 border-t border-border pt-2.5 text-[10px] text-muted-foreground">
            <span className="inline-flex items-center gap-3">
              <span className="inline-flex items-center gap-1.5">
                <span className="size-1.5 rounded-full bg-primary" />
                Solved
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="size-1.5 rounded-full bg-[var(--warning)]" />
                Attempted
              </span>
            </span>
            <span className="font-mono tabular-nums">
              {totalSolved} solved · {topTags.length} topics
            </span>
          </div>
        </div>
      )}
    </DashboardPanel>
  );
}
