const DHAKA_OFFSET_MINUTES = 6 * 60;

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export type MonthlySeriesSchedule = {
  weekday: number;
  weekOfMonth: number;
  hour: number;
  minute: number;
  durationMinutes: number;
};

export const MONTHLY_SERIES_SCHEDULE: MonthlySeriesSchedule = {
  weekday: 0,
  weekOfMonth: 3,
  hour: 10,
  minute: 0,
  durationMinutes: 90,
};

function dhakaParts(date: Date): {
  year: number;
  month: number;
  day: number;
  hour: number;
} {
  const shifted = new Date(date.getTime() + DHAKA_OFFSET_MINUTES * 60_000);
  return {
    year: shifted.getUTCFullYear(),
    month: shifted.getUTCMonth(),
    day: shifted.getUTCDate(),
    hour: shifted.getUTCHours(),
  };
}

function occurrenceForMonth(
  year: number,
  month: number,
  schedule: MonthlySeriesSchedule,
): Date | null {
  if (schedule.weekday < 0 || schedule.weekday > 6) return null;
  if (schedule.weekOfMonth < 1 || schedule.weekOfMonth > 5) return null;
  if (schedule.hour < 0 || schedule.hour > 23) return null;
  if (schedule.minute < 0 || schedule.minute > 59) return null;

  const firstWeekday = new Date(Date.UTC(year, month, 1)).getUTCDay();
  const firstMatch = 1 + ((schedule.weekday - firstWeekday + 7) % 7);
  const day = firstMatch + (schedule.weekOfMonth - 1) * 7;
  const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  if (day > daysInMonth) return null;

  return new Date(
    Date.UTC(
      year,
      month,
      day,
      schedule.hour - DHAKA_OFFSET_MINUTES / 60,
      schedule.minute,
      0,
      0,
    ),
  );
}

/**
 * Next occurrence of the monthly series. Asia/Dhaka has no DST, so the
 * wall-clock schedule is a fixed UTC offset (10:00 Dhaka = 04:00 UTC).
 */
export function nextMonthlySeriesStart(
  now: Date,
  schedule: MonthlySeriesSchedule = MONTHLY_SERIES_SCHEDULE,
): Date {
  const { year, month } = dhakaParts(now);
  for (let offset = 0; offset <= 3; offset += 1) {
    const target = new Date(Date.UTC(year, month + offset, 1));
    const candidate = occurrenceForMonth(
      target.getUTCFullYear(),
      target.getUTCMonth(),
      schedule,
    );
    if (candidate && candidate.getTime() > now.getTime()) return candidate;
  }
  const fallback = new Date(Date.UTC(year + 1, month + 1, 1, 4, 0, 0, 0));
  return fallback;
}

export function monthlySeriesEnd(
  startAt: Date,
  schedule: MonthlySeriesSchedule = MONTHLY_SERIES_SCHEDULE,
): Date {
  return new Date(startAt.getTime() + schedule.durationMinutes * 60_000);
}

export function monthlySeriesTitle(startAt: Date): string {
  const { year, month } = dhakaParts(startAt);
  return `PAU Monthly Contest — ${MONTH_NAMES[month]} ${year}`;
}

export function monthlySeriesSlug(startAt: Date): string {
  const { year, month } = dhakaParts(startAt);
  return `pau-monthly-${year}-${String(month + 1).padStart(2, "0")}`;
}

export function monthlySeriesOccurrenceKey(startAt: Date): string {
  const { year, month, day } = dhakaParts(startAt);
  return `monthly-third-sunday-${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function monthlySeriesDescription(): string {
  return [
    "The official PAU Online Judge monthly round: fresh contest-only problems, ICPC scoring and a 90-minute sprint.",
    "",
    "Starts at 10:00 Asia/Dhaka (04:00 UTC) on the third Sunday. The problem set is sealed until the start bell, editorials stay locked for the whole round, and every problem is used for the first time in a contest.",
    "",
    "Solo coders take part. The contest crew (setters, editorial writers and testers) cannot compete.",
  ].join("\n");
}
