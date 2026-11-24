import {
  CalendarCheck2,
  CheckCircle2,
  Flame,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import type { HeatmapDay } from "@/lib/types";
import { cn } from "@/lib/utils";
import { ActivityGrid } from "./activity-grid";

function Metric({
  icon: Icon,
  label,
  value,
  hint,
  toneClassName,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  hint: string;
  toneClassName: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-muted/15 px-3 py-2.5">
      <p className="flex items-center gap-1.5 text-[9px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
        <Icon className={cn("size-3.5", toneClassName)} />
        {label}
      </p>
      <p className="mt-1 font-mono text-xl font-semibold leading-none tabular-nums">
        {value}
      </p>
      <p className="mt-1 truncate text-[10px] text-muted-foreground">{hint}</p>
    </div>
  );
}

export function ActivityHeatmap({
  days,
  activeDays,
  currentStreak,
  longestStreak,
}: {
  days: HeatmapDay[];
  activeDays: number;
  currentStreak: number;
  longestStreak: number;
}) {
  const total = days.reduce((sum, day) => sum + day.total, 0);
  const accepted = days.reduce((sum, day) => sum + day.accepted, 0);
  const today = new Date().toISOString().slice(0, 10);

  return (
    <Card className="rounded-2xl p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="grid size-9 place-items-center rounded-xl bg-primary/10 text-primary">
            <CalendarCheck2 className="size-4" />
          </span>
          <div>
            <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
              Consistency
            </p>
            <h2 className="text-sm font-semibold">Submission activity</h2>
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              {accepted} accepted / {total} submissions in the last year
            </p>
          </div>
        </div>
        <span className="rounded-full border border-border bg-muted/20 px-2.5 py-1 font-mono text-[10px] text-muted-foreground">
          last 365 days
        </span>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Metric
          icon={CalendarCheck2}
          label="Active days"
          value={String(activeDays)}
          hint={`of ${days.length} days`}
          toneClassName="text-emerald-500"
        />
        <Metric
          icon={Flame}
          label="Current streak"
          value={`${currentStreak}d`}
          hint={currentStreak > 0 ? "keep it alive" : "starts with a solve"}
          toneClassName="text-orange-500"
        />
        <Metric
          icon={Sparkles}
          label="Longest streak"
          value={`${longestStreak}d`}
          hint="personal best"
          toneClassName="text-amber-500"
        />
        <Metric
          icon={CheckCircle2}
          label="Accepted"
          value={String(accepted)}
          hint="last 365 days"
          toneClassName="text-primary"
        />
      </div>

      <div className="mt-5">
        <ActivityGrid
          days={days}
          today={today}
          activeDays={activeDays}
          accepted={accepted}
        />
      </div>
    </Card>
  );
}
