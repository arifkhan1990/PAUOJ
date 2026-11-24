import Link from "next/link";
import { Check, ChevronLeft, ChevronRight } from "lucide-react";
import { DIFFICULTY_META } from "@/lib/difficulty";
import type {
  DailyChallengeWeek,
  DailyChallengeWeekDay,
} from "@/server/services/daily-challenge-week";
import { cn } from "@/lib/utils";

const WEEKDAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"] as const;

const dayFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

const shortDayFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

const cellBase =
  "relative flex aspect-square items-center justify-center rounded-[4px] text-[10px] font-medium leading-none tabular-nums";

function dayLabel(date: string): string {
  return dayFormatter.format(new Date(`${date}T00:00:00Z`));
}

function shortDayLabel(date: string): string {
  return shortDayFormatter.format(new Date(`${date}T00:00:00Z`));
}

function dayNumber(date: string): number {
  return new Date(`${date}T00:00:00Z`).getUTCDate();
}

function tooltipAlignment(index: number): string {
  if (index <= 1) return "left-0";
  if (index >= 5) return "right-0";
  return "left-1/2 -translate-x-1/2";
}

function cellClassName(day: DailyChallengeWeekDay): string {
  if (day.isFuture) return cn(cellBase, "bg-transparent text-muted-foreground/40");
  if (day.isBeforeJoin) {
    return cn(cellBase, "bg-muted/20 text-muted-foreground/40");
  }
  if (!day.problem) {
    return cn(cellBase, "bg-muted/30 text-muted-foreground/60");
  }
  if (day.completed) {
    return cn(
      cellBase,
      "bg-emerald-700 text-white dark:bg-emerald-400 dark:text-emerald-950",
    );
  }
  return cn(cellBase, "bg-muted/40 text-muted-foreground");
}

function statusText(day: DailyChallengeWeekDay): string {
  if (day.isFuture) return "upcoming day";
  if (day.isBeforeJoin) return "before you joined";
  if (!day.problem) return "no daily challenge";
  return day.completed ? "completed" : "not completed";
}

function cellAriaLabel(day: DailyChallengeWeekDay): string {
  const date = dayLabel(day.date);
  if (!day.problem) return `${date}: ${statusText(day)}`;
  const meta = DIFFICULTY_META[day.problem.difficulty];
  return `${date}: daily challenge ${day.problem.title}, ${meta.label}, ${day.problem.points} points. ${
    day.completed ? "Completed." : "Not completed."
  } Opens the problem.`;
}

function WeekArrow({
  href,
  direction,
}: {
  href: string | null;
  direction: "prev" | "next";
}) {
  const Icon = direction === "prev" ? ChevronLeft : ChevronRight;
  const label = direction === "prev" ? "Previous week" : "Next week";
  const className =
    "relative inline-flex size-8 shrink-0 items-center justify-center rounded-md text-muted-foreground before:absolute before:-inset-1.5 before:content-['']";

  if (!href) {
    return (
      <span
        aria-hidden="true"
        title={direction === "next" ? "Future challenges are hidden" : "No earlier challenges"}
        className={cn(className, "cursor-not-allowed opacity-30")}
      >
        <Icon className="size-4" />
      </span>
    );
  }

  return (
    <Link
      href={href}
      scroll={false}
      aria-label={label}
      className={cn(
        className,
        "transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
      )}
    >
      <Icon className="size-4" aria-hidden="true" />
    </Link>
  );
}

function ChallengeTooltip({
  day,
  index,
}: {
  day: DailyChallengeWeekDay;
  index: number;
}) {
  if (!day.problem) return null;

  return (
    <span
      className={cn(
        "pointer-events-none invisible absolute top-full z-30 w-52 pt-1.5 opacity-0 transition-opacity duration-150 group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100",
        tooltipAlignment(index),
      )}
    >
      <span className="block rounded-lg border border-border bg-popover p-2 text-left text-popover-foreground shadow-xl">
        <span className="flex items-center justify-between gap-2">
          <span className="whitespace-nowrap text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            {shortDayLabel(day.date)}
          </span>
          <span
            className={cn(
              "inline-flex shrink-0 items-center gap-1 whitespace-nowrap text-[9px] font-medium",
              day.completed
                ? "text-emerald-700 dark:text-emerald-400"
                : "text-rose-700 dark:text-rose-400",
            )}
          >
            {day.completed ? (
              <Check className="size-2.5" aria-hidden="true" />
            ) : (
              <span className="size-1 rounded-full bg-rose-500" aria-hidden="true" />
            )}
            {day.completed ? "Completed" : "Not completed"}
          </span>
        </span>
        <span className="mt-1 block truncate text-[11px] font-medium">
          {day.problem.title}
        </span>
        <span className="mt-0.5 block text-[9px] text-muted-foreground">
          {DIFFICULTY_META[day.problem.difficulty].label} ·{" "}
          {day.problem.points} pts
        </span>
      </span>
    </span>
  );
}

export function DailyChallengeCalendar({
  week,
  prevHref,
  nextHref,
  className,
}: {
  week: DailyChallengeWeek;
  prevHref: string | null;
  nextHref: string | null;
  className?: string;
}) {
  const unit = week.completedCount === 1 ? "day" : "days";
  const summary = `${week.fullLabel} daily challenges: ${week.completedCount} ${unit} completed. Past days without a completed challenge show a red dot. Future challenges are hidden.`;

  return (
    <div
      role="group"
      aria-label={summary}
      className={cn("w-full max-w-[16rem] min-w-0", className)}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-1">
          <WeekArrow href={prevHref} direction="prev" />
          <p
            className="truncate text-[12px] font-semibold tracking-tight"
            title={week.fullLabel}
          >
            {week.label}
          </p>
          <WeekArrow href={nextHref} direction="next" />
        </div>
        <p
          className="shrink-0 text-[10px] text-muted-foreground"
          title={`${week.completedCount} ${unit} with a completed daily challenge`}
        >
          <span className="font-mono text-[11px] font-semibold tabular-nums text-foreground">
            {week.completedCount}
          </span>{" "}
          {unit} solved
        </p>
      </div>

      <p className="sr-only">
        {week.completedCount} {unit} completed in {week.fullLabel}.
      </p>

      <div
        className="mt-2 grid grid-cols-7 gap-1 text-center text-[9px] font-medium text-muted-foreground"
        aria-hidden="true"
      >
        {WEEKDAY_LABELS.map((label, index) => (
          <span key={`${label}-${index}`}>{label}</span>
        ))}
      </div>

      <div className="mt-1 grid grid-cols-7 gap-1">
        {week.days.map((day, index) => {
          const classes = cn(
            cellClassName(day),
            day.isToday && "font-bold",
            day.problem &&
              "transition-[filter] hover:brightness-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-card",
          );
          const number = (
            <span
              className={cn(
                day.isToday &&
                  "underline decoration-2 underline-offset-2",
              )}
            >
              {dayNumber(day.date)}
            </span>
          );
          const status = day.problem ? (
            day.completed ? (
              <Check
                className="pointer-events-none absolute right-0 top-0 size-2"
                strokeWidth={3}
                aria-hidden="true"
              />
            ) : (
              <span
                className="pointer-events-none absolute bottom-0.5 left-1/2 size-1 -translate-x-1/2 rounded-full bg-rose-500 dark:bg-rose-400"
                aria-hidden="true"
              />
            )
          ) : null;

          if (day.problem) {
            return (
              <div key={day.date} className="group relative">
                <Link
                  href={`/problems/${day.problem.slug}`}
                  aria-label={cellAriaLabel(day)}
                  className={classes}
                >
                  {number}
                  {status}
                </Link>
                <ChallengeTooltip day={day} index={index} />
              </div>
            );
          }

          return (
            <span
              key={day.date}
              aria-label={cellAriaLabel(day)}
              className={classes}
            >
              {number}
            </span>
          );
        })}
      </div>
    </div>
  );
}
