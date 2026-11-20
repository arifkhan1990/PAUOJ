"use client";

import { TrendingDown, TrendingUp } from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type TooltipContentProps,
} from "recharts";
import { Card } from "@/components/ui/card";
import type { RatingBucket } from "@/lib/rating-distribution";
import type { RatingHistoryItem } from "@/lib/types";
import { getRatingTier } from "@/lib/rating-tiers";
import { cn } from "@/lib/utils";
import { RatingCardFooter } from "./rating-card-footer";
import { RatingHistogram } from "./rating-histogram";
import { RatingEmptyState } from "./rating-empty-state";

type RatingPoint = {
  label: string;
  rating: number;
  oldRating: number;
  delta: number;
  rank: number;
  title: string;
  baseline?: boolean;
};

function buildSeries(history: RatingHistoryItem[]): RatingPoint[] {
  const first = history[0];
  const points = history.map((item) => ({
    label: new Intl.DateTimeFormat("en-GB", {
      day: "2-digit",
      month: "short",
      timeZone: "UTC",
    }).format(new Date(item.createdAt)),
    rating: item.newRating,
    oldRating: item.oldRating,
    delta: item.delta,
    rank: item.rank,
    title: item.contestTitle,
  }));
  if (!first) return points;
  return [
    {
      label: "Start",
      rating: first.oldRating,
      oldRating: first.oldRating,
      delta: 0,
      rank: 0,
      title: "Starting rating",
      baseline: true,
    },
    ...points,
  ];
}

function RatingTooltip({ active, payload }: TooltipContentProps) {
  if (!active || !payload || payload.length === 0) return null;
  const point = payload[0]?.payload as RatingPoint | undefined;
  if (!point) return null;
  return (
    <div className="max-w-64 rounded-lg border border-border bg-popover px-2.5 py-2 text-[11px] shadow-lg">
      <p className="font-medium">{point.title}</p>
      <dl className="mt-1.5 space-y-0.5">
        <div className="flex items-center justify-between gap-5">
          <dt className="text-muted-foreground">Rating</dt>
          <dd className="font-mono tabular-nums">{point.rating}</dd>
        </div>
        {point.baseline ? (
          <p className="text-[10px] text-muted-foreground">
            Baseline before your first rated contest.
          </p>
        ) : (
          <>
            <div className="flex items-center justify-between gap-5">
              <dt className="text-muted-foreground">Rank</dt>
              <dd className="font-mono tabular-nums">#{point.rank}</dd>
            </div>
            <div className="flex items-center justify-between gap-5">
              <dt className="text-muted-foreground">Change</dt>
              <dd
                className={cn(
                  "font-mono tabular-nums",
                  point.delta >= 0
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-rose-600 dark:text-rose-400",
                )}
              >
                {point.delta >= 0 ? "+" : ""}
                {point.delta}
              </dd>
            </div>
          </>
        )}
      </dl>
    </div>
  );
}

function buildTicks(low: number, high: number) {
  const step =
    [10, 20, 25, 50, 100, 150, 200, 250, 500, 1000].find(
      (candidate) =>
        Math.ceil(high / candidate) - Math.floor(low / candidate) <= 4,
    ) ?? 2000;
  const min = Math.floor(low / step) * step;
  const max = Math.ceil(high / step) * step;
  const ticks: number[] = [];
  for (let value = min; value <= max; value += step) ticks.push(value);
  return {
    ticks,
    domain: [min - step / 2, max + step / 2] as [number, number],
  };
}

function Stat({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="border-l border-border/70 pl-3 first:border-0 first:pl-0 sm:pl-4">
      <dt className="text-[9px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
        {label}
      </dt>
      <dd className="mt-0.5 font-mono text-[15px] font-semibold leading-none tabular-nums">
        {value}
      </dd>
      <p className="mt-0.5 text-[9px] text-muted-foreground">{hint}</p>
    </div>
  );
}

export function RatingChart({
  history,
  currentRating,
  ratingRank,
  ratedUserCount,
  ratingDistribution,
}: {
  history: RatingHistoryItem[];
  currentRating: number;
  ratingRank: number | null;
  ratedUserCount: number;
  ratingDistribution: RatingBucket[];
}) {
  if (history.length === 0) {
    return <RatingEmptyState />;
  }

  const series = buildSeries(history);
  const latest = series.at(-1);
  const peak = series.reduce(
    (best, point) => Math.max(best, point.rating),
    0,
  );
  const bestRank = history.reduce(
    (best, item) => Math.min(best, item.rank),
    Number.POSITIVE_INFINITY,
  );
  const ratings = series.map((point) => point.rating);
  const low = Math.min(...ratings);
  const high = Math.max(...ratings);
  const tier = getRatingTier(currentRating);
  const { ticks, domain } = buildTicks(low, high);

  const activeBucket = ratingDistribution.find((bucket) => bucket.active);
  const activeBand = activeBucket
    ? `${activeBucket.label}${
        activeBucket.max === Number.POSITIVE_INFINITY
          ? "+"
          : `–${activeBucket.max}`
      }`
    : "—";

  return (
    <Card
      className="flex flex-col overflow-hidden rounded-xl shadow-sm"
      role="region"
      aria-label="Contest rating"
    >
      <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-3 border-b border-border/70 px-5 pb-3 pt-4">
        <div className="min-w-0">
          <p className="text-[9px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
            Contest rating
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1.5">
            <span className="font-mono text-3xl font-semibold leading-none tabular-nums tracking-tight">
              {currentRating}
            </span>
            {latest ? (
              <span
                className={cn(
                  "inline-flex items-center gap-0.5 rounded-full border px-1.5 py-0.5 font-mono text-[10px] font-medium tabular-nums",
                  latest.delta >= 0
                    ? "border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                    : "border-rose-300 bg-rose-50 text-rose-700 dark:border-rose-800 dark:bg-rose-950 dark:text-rose-300",
                )}
                title="Change in your most recent rated contest"
              >
                {latest.delta >= 0 ? (
                  <TrendingUp className="size-3" aria-hidden="true" />
                ) : (
                  <TrendingDown className="size-3" aria-hidden="true" />
                )}
                {latest.delta >= 0 ? "+" : ""}
                {latest.delta}
              </span>
            ) : null}
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium",
                tier.badgeClassName,
              )}
              title={`${tier.label} tier`}
            >
              <span
                className={cn("size-1.5 rounded-full", tier.barClassName)}
                aria-hidden="true"
              />
              {tier.label}
            </span>
          </div>
          <p className="mt-1.5 text-[10px] text-muted-foreground">
            Peak <span className="font-mono tabular-nums">{peak}</span>
            <span aria-hidden="true"> · </span>
            Elo K=32
          </p>
        </div>

        <dl className="flex w-full shrink-0 items-start justify-between sm:w-auto sm:justify-start">
          <Stat
            label="Global"
            value={ratingRank ? `#${ratingRank}` : "—"}
            hint={ratedUserCount > 0 ? `of ${ratedUserCount}` : "rated"}
          />
          <Stat
            label="Contests"
            value={String(history.length)}
            hint="rated"
          />
          <Stat
            label="Best"
            value={Number.isFinite(bestRank) ? `#${bestRank}` : "—"}
            hint="rank"
          />
        </dl>
      </div>

      <div className="grid min-h-[210px] flex-1 md:grid-cols-[minmax(0,1fr)_240px] xl:grid-cols-[minmax(0,1fr)_260px]">
        <div className="flex min-w-0 flex-col px-4 pb-2 pt-3">
          <div>
            <p className="text-[9px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
              Rating trajectory
            </p>
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              {history.length} rated{" "}
              {history.length === 1 ? "contest" : "contests"}
            </p>
          </div>
          <div className="rating-chart mt-2 min-h-[150px] flex-1">
            <ResponsiveContainer
              width="100%"
              height="100%"
              initialDimension={{ width: 640, height: 168 }}
            >
              <AreaChart
                data={series}
                margin={{ top: 8, right: 12, bottom: 0, left: 0 }}
                accessibilityLayer
                aria-label="Rating change across rated contests"
              >
                <defs>
                  <linearGradient id="rating-fill" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="0%"
                      stopColor="var(--primary)"
                      stopOpacity={0.3}
                    />
                    <stop
                      offset="100%"
                      stopColor="var(--primary)"
                      stopOpacity={0}
                    />
                  </linearGradient>
                </defs>
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
                  tickMargin={6}
                  minTickGap={18}
                />
                <YAxis
                  domain={domain}
                  ticks={ticks}
                  width={38}
                  tick={{ fill: "var(--muted-foreground)", fontSize: 10 }}
                  tickLine={false}
                  axisLine={false}
                />
                <ReferenceLine
                  y={1500}
                  stroke="var(--border)"
                  strokeDasharray="4 4"
                />
                <Tooltip
                  content={(props) => <RatingTooltip {...props} />}
                  cursor={{ stroke: "var(--border)" }}
                />
                <Area
                  type="monotone"
                  dataKey="rating"
                  name="Rating"
                  stroke="var(--primary)"
                  strokeWidth={2}
                  fill="url(#rating-fill)"
                  dot={{ r: 2.5, fill: "var(--primary)", strokeWidth: 0 }}
                  activeDot={{ r: 5 }}
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="flex flex-col border-t border-border/70 px-4 pb-2 pt-3 md:border-l md:border-t-0">
          <RatingHistogram
            buckets={ratingDistribution}
            ratingRank={ratingRank}
            ratedUserCount={ratedUserCount}
          />
        </div>
      </div>

      <RatingCardFooter
        currentRating={currentRating}
        activeBand={activeBand}
      />
    </Card>
  );
}
