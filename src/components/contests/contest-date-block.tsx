import type { ContestStatus } from "@/lib/types";
import { cn, formatDhakaDateTime } from "@/lib/utils";

const DHAKA_TIME_ZONE = "Asia/Dhaka";

const weekdayFormatter = new Intl.DateTimeFormat("en-GB", {
  weekday: "short",
  timeZone: DHAKA_TIME_ZONE,
});

const dayFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  timeZone: DHAKA_TIME_ZONE,
});

const monthFormatter = new Intl.DateTimeFormat("en-GB", {
  month: "short",
  timeZone: DHAKA_TIME_ZONE,
});

const timeFormatter = new Intl.DateTimeFormat("en-GB", {
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
  timeZone: DHAKA_TIME_ZONE,
});

export type ContestDateParts = {
  /** Uppercase short weekday, e.g. "SUN". */
  weekday: string;
  /** Two-digit day of month, e.g. "22". */
  day: string;
  /** Short month, e.g. "Nov". */
  month: string;
  /** 24-hour Dhaka wall clock, e.g. "22:00". */
  time: string;
};

/**
 * Contest schedule parts in the contest wall clock (Asia/Dhaka), independent of
 * the server's local timezone. Pure, so it can be unit-tested without a DOM.
 */
export function contestDateParts(value: Date | string): ContestDateParts {
  const date = typeof value === "string" ? new Date(value) : value;
  return {
    weekday: weekdayFormatter.format(date).toUpperCase(),
    day: dayFormatter.format(date),
    month: monthFormatter.format(date),
    time: timeFormatter.format(date),
  };
}

const ACCENT_CLASS: Record<ContestStatus, string> = {
  RUNNING: "text-emerald-700 dark:text-emerald-400",
  UPCOMING: "text-foreground",
  ENDED: "text-muted-foreground",
};

export function ContestDateBlock({
  startAt,
  status,
  className,
}: {
  startAt: Date | string;
  status: ContestStatus;
  className?: string;
}) {
  const parts = contestDateParts(startAt);
  const dateTime =
    typeof startAt === "string" ? startAt : startAt.toISOString();
  const accent = ACCENT_CLASS[status];

  return (
    <time
      dateTime={dateTime}
      title={formatDhakaDateTime(startAt)}
      className={cn(
        "flex min-w-0 items-baseline gap-2 sm:flex-col sm:items-start sm:gap-0.5",
        className,
      )}
    >
      <span
        className={cn(
          "text-[10px] font-semibold uppercase tracking-[0.16em]",
          accent,
        )}
      >
        {parts.weekday}
      </span>
      <span className="flex items-baseline gap-1.5 sm:flex-col sm:items-start sm:gap-0.5">
        <span
          className={cn(
            "text-sm font-semibold leading-none tabular-nums sm:text-2xl",
            accent,
          )}
        >
          {parts.day}
        </span>
        <span className="text-xs text-muted-foreground">
          {parts.month}
          <span aria-hidden="true"> · </span>
          <span className="tabular-nums">{parts.time}</span>
        </span>
      </span>
    </time>
  );
}
