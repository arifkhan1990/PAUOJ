import type { ContestStatus, ContestDivision } from "./types";

export const CONTEST_DIVISION_LABEL: Record<ContestDivision, string> = {
  OPEN: "Open",
  DIV1: "Div. 1",
  DIV2: "Div. 2",
  DIV3: "Div. 3",
  DIV4: "Div. 4",
};

export const CONTEST_STATUS_META: Record<
  ContestStatus,
  { label: string; className: string; dotClassName: string }
> = {
  RUNNING: {
    label: "Live",
    className:
      "border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-200",
    dotClassName: "bg-emerald-500 animate-pulse",
  },
  UPCOMING: {
    label: "Upcoming",
    className:
      "border-sky-300 bg-sky-50 text-sky-800 dark:border-sky-800 dark:bg-sky-950 dark:text-sky-200",
    dotClassName: "bg-sky-500",
  },
  ENDED: {
    label: "Ended",
    className:
      "border-border bg-muted text-muted-foreground",
    dotClassName: "bg-muted-foreground",
  },
};


export function contestStatus(
  startAt: string | Date,
  endAt: string | Date,
  now: Date = new Date(),
): ContestStatus {
  const start = typeof startAt === "string" ? new Date(startAt) : startAt;
  const end = typeof endAt === "string" ? new Date(endAt) : endAt;
  if (now < start) return "UPCOMING";
  if (now >= end) return "ENDED";
  return "RUNNING";
}

export function contestDurationMs(
  startAt: string | Date,
  endAt: string | Date,
): number {
  const start = typeof startAt === "string" ? new Date(startAt) : startAt;
  const end = typeof endAt === "string" ? new Date(endAt) : endAt;
  return Math.max(0, end.getTime() - start.getTime());
}

export function isContestRunning(
  startAt: string | Date,
  endAt: string | Date,
  now: Date = new Date(),
): boolean {
  return contestStatus(startAt, endAt, now) === "RUNNING";
}
