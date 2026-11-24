"use client";

import { useMemo, useRef, useState } from "react";
import type { HeatmapDay } from "@/lib/types";
import { cn } from "@/lib/utils";

type Week = Array<HeatmapDay | null>;
type ActiveDay = {
  day: HeatmapDay;
  x: number;
  y: number;
};

const monthFormatter = new Intl.DateTimeFormat("en-GB", {
  month: "short",
  timeZone: "UTC",
});

const dateFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

const LEGEND_COUNTS = [0, 1, 3, 6, 10] as const;
const TOOLTIP_HALF_WIDTH = 92;

function weekdayOf(date: string): number {
  return (new Date(`${date}T00:00:00Z`).getUTCDay() + 6) % 7;
}

function levelClass(accepted: number): string {
  if (accepted <= 0) {
    return "bg-foreground/[0.06] dark:bg-foreground/[0.08]";
  }
  if (accepted <= 2) {
    return "bg-emerald-500/20 dark:bg-emerald-400/20";
  }
  if (accepted <= 5) {
    return "bg-emerald-500/40 dark:bg-emerald-400/40";
  }
  if (accepted <= 9) {
    return "bg-emerald-500/65 dark:bg-emerald-400/65";
  }
  return "bg-emerald-500 dark:bg-emerald-400";
}

function buildWeeks(days: HeatmapDay[]) {
  const first = days[0];
  const cells: Week = first
    ? [
        ...Array.from({ length: weekdayOf(first.date) }, () => null),
        ...days,
      ]
    : [];
  while (cells.length % 7 !== 0) cells.push(null);

  const weeks: Week[] = [];
  for (let index = 0; index < cells.length; index += 7) {
    weeks.push(cells.slice(index, index + 7));
  }

  const labels: Array<{ index: number; label: string }> = [];
  let currentMonth = "";
  let lastLabelIndex = -3;

  weeks.forEach((week, index) => {
    const anchor = week.find((day): day is HeatmapDay => day !== null);
    if (!anchor) return;
    const month = monthFormatter.format(new Date(`${anchor.date}T00:00:00Z`));
    if (month !== currentMonth && index - lastLabelIndex >= 2) {
      labels.push({ index, label: month });
      currentMonth = month;
      lastLabelIndex = index;
    }
  });

  return { weeks, labels };
}

function formatDay(date: string): string {
  return dateFormatter.format(new Date(`${date}T00:00:00Z`));
}

export function ActivityGrid({
  days,
  today,
  activeDays,
  accepted,
}: {
  days: HeatmapDay[];
  today: string;
  activeDays: number;
  accepted: number;
}) {
  const { weeks, labels } = useMemo(() => buildWeeks(days), [days]);
  const [active, setActive] = useState<ActiveDay | null>(null);
  const frameRef = useRef<HTMLDivElement>(null);

  const showDay = (day: HeatmapDay, cell: HTMLElement) => {
    const frame = frameRef.current;
    if (!frame) return;
    const frameRect = frame.getBoundingClientRect();
    const cellRect = cell.getBoundingClientRect();
    const x = Math.min(
      Math.max(
        cellRect.left - frameRect.left + cellRect.width / 2,
        TOOLTIP_HALF_WIDTH,
      ),
      frameRect.width - TOOLTIP_HALF_WIDTH,
    );
    setActive({
      day,
      x,
      y: cellRect.top - frameRect.top,
    });
  };

  return (
    <div ref={frameRef} className="relative">
      <div className="overflow-x-auto pb-1">
        <div className="min-w-[620px]">
          <div className="flex gap-2">
            <span className="w-7 shrink-0" aria-hidden="true" />
            <div className="relative h-4 flex-1">
              {labels.map((label) => (
                <span
                  key={`${label.index}-${label.label}`}
                  className="absolute top-0 whitespace-nowrap text-[9px] font-medium text-muted-foreground"
                  style={{ left: `${(label.index / weeks.length) * 100}%` }}
                >
                  {label.label}
                </span>
              ))}
            </div>
          </div>

          <div
            className="flex gap-2"
            role="img"
            aria-label={`Activity heatmap: ${activeDays} active days and ${accepted} accepted submissions in the last year.`}
          >
            <div className="grid w-7 shrink-0 grid-rows-7 gap-[3px] pr-1 text-[9px] text-muted-foreground">
              {["Mon", "", "Wed", "", "Fri", "", "Sun"].map((day, index) => (
                <span key={`${day}-${index}`} className="flex items-center">
                  {day}
                </span>
              ))}
            </div>

            <div className="flex flex-1 gap-[3px]">
              {weeks.map((week, weekIndex) => (
                <div
                  key={week[0]?.date ?? `week-${weekIndex}`}
                  className="grid flex-1 grid-rows-7 gap-[3px]"
                >
                  {week.map((day, dayIndex) =>
                    day ? (
                      <span
                        key={day.date}
                        onMouseEnter={(event) =>
                          showDay(day, event.currentTarget)
                        }
                        onMouseLeave={() => setActive(null)}
                        className={cn(
                          "aspect-square w-full rounded-[3px] transition-colors",
                          "hover:ring-1 hover:ring-emerald-500/70",
                          levelClass(day.accepted),
                          day.date === today &&
                            "ring-1 ring-primary ring-offset-1 ring-offset-card",
                        )}
                      />
                    ) : (
                      <span
                        key={`empty-${weekIndex}-${dayIndex}`}
                        className="aspect-square w-full"
                        aria-hidden="true"
                      />
                    ),
                  )}
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>

      <div className="mt-2 flex items-center justify-end gap-1.5 text-[9px] text-muted-foreground">
        <span>Less</span>
        {LEGEND_COUNTS.map((count) => (
          <span
            key={count}
            className={cn("size-2.5 rounded-[2px]", levelClass(count))}
          />
        ))}
        <span>More</span>
      </div>

      {active ? (
        <div
          className="pointer-events-none absolute z-20 w-max max-w-56 -translate-x-1/2 -translate-y-full rounded-lg border border-border bg-popover px-2.5 py-1.5 text-[11px] text-popover-foreground shadow-lg"
          style={{ left: active.x, top: active.y - 6 }}
        >
          <p className="font-medium">{formatDay(active.day.date)}</p>
          <p className="mt-0.5 text-muted-foreground">
            {active.day.accepted} accepted · {active.day.total} submissions
          </p>
        </div>
      ) : null}
    </div>
  );
}
