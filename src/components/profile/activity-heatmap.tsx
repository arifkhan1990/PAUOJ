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

function intensityClass(count: number): string {
  if (count <= 0) return "bg-slate-200/80 dark:bg-slate-800";
  if (count === 1) return "bg-emerald-200 dark:bg-emerald-950";
  if (count <= 4) return "bg-emerald-300 dark:bg-emerald-900";
  if (count <= 9) return "bg-emerald-400 dark:bg-emerald-700";
  if (count <= 15) return "bg-emerald-500 dark:bg-emerald-500";
  return "bg-emerald-600 dark:bg-emerald-400";
}

type Week = {
  key: string;
  days: Array<HeatmapDay | null>;
};

type Month = {
  key: string;
  label: string;
  weeks: Week[];
};

const monthFormatter = new Intl.DateTimeFormat("en-GB", {
  month: "short",
  timeZone: "UTC",
});

function monthOf(date: string): string {
  return monthFormatter.format(new Date(`${date}T00:00:00Z`));
}

function weekdayOf(date: string): number {
  return (new Date(`${date}T00:00:00Z`).getUTCDay() + 6) % 7;
}

function buildMonths(days: HeatmapDay[]): Month[] {
  const months: Month[] = [];
  let index = 0;

  while (index < days.length) {
    const first = days[index];
    const monthKey = first.date.slice(0, 7);
    const monthDays: HeatmapDay[] = [];

    while (index < days.length && days[index].date.startsWith(monthKey)) {
      monthDays.push(days[index]);
      index += 1;
    }

    const cells: Array<HeatmapDay | null> = [
      ...Array.from({ length: weekdayOf(first.date) }, () => null),
      ...monthDays,
    ];
    while (cells.length % 7 !== 0) cells.push(null);

    const weeks: Week[] = [];
    for (let start = 0; start < cells.length; start += 7) {
      const weekDays = cells.slice(start, start + 7);
      const anchor = weekDays.find((day): day is HeatmapDay => day !== null);
      weeks.push({
        key: anchor?.date ?? `${monthKey}-${start}`,
        days: weekDays,
      });
    }

    months.push({ key: monthKey, label: monthOf(first.date), weeks });
  }

  return months;
}

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
  const months = buildMonths(days);
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

      <div className="mt-5 overflow-hidden">
        <div
          className="w-full"
          role="img"
          aria-label={`Activity heatmap: ${activeDays} active days, ${accepted} accepted submissions in the last year`}
        >
          <div className="flex items-stretch gap-2">
            <div className="grid w-7 shrink-0 grid-rows-7 gap-[2px] text-[8px] text-muted-foreground">
              {["Mon", "", "Wed", "", "Fri", "", "Sun"].map((day, index) => (
                <span key={`${day}-${index}`} className="flex items-center">
                  {day}
                </span>
              ))}
            </div>
            <div className="flex min-w-0 flex-1 gap-x-1 sm:gap-x-2">
              {months.map((month) => (
                <div
                  key={month.key}
                  className="flex min-w-0 gap-[2px]"
                  style={{
                    flexGrow: month.weeks.length,
                    flexBasis: 0,
                  }}
                >
                  {month.weeks.map((week) => (
                    <div
                      key={week.key}
                      className="grid min-w-0 flex-1 grid-rows-7 gap-[2px]"
                    >
                      {week.days.map((day, index) =>
                        day ? (
                          <span
                            key={day.date}
                            className={cn(
                              "aspect-square w-full rounded-[2px] transition-colors hover:ring-1 hover:ring-emerald-500",
                              intensityClass(day.accepted),
                              day.date === today &&
                                "ring-1 ring-emerald-500 ring-inset",
                            )}
                            title={`${day.date}: ${day.accepted} accepted / ${day.total} submissions`}
                          />
                        ) : (
                          <span
                            key={`empty-${index}`}
                            className="aspect-square w-full"
                          />
                        ),
                      )}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
          <div className="mt-1.5 flex gap-x-1 pl-9 text-[8px] text-muted-foreground sm:gap-x-2">
            {months.map((month) => (
              <div
                key={month.key}
                className="min-w-0"
                style={{
                  flexGrow: month.weeks.length,
                  flexBasis: 0,
                }}
              >
                <span className="block truncate">{month.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-end gap-1.5 text-[9px] text-muted-foreground">
        <span>Less</span>
        {[0, 1, 3, 6, 10, 16].map((value) => (
          <span
            key={value}
            className={cn(
              "size-3 rounded-[3px]",
              intensityClass(value),
            )}
          />
        ))}
        <span>More</span>
      </div>
    </Card>
  );
}
