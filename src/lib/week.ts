const shortMonthFormatter = new Intl.DateTimeFormat("en-GB", {
  month: "short",
  timeZone: "UTC",
});

const longMonthFormatter = new Intl.DateTimeFormat("en-GB", {
  month: "long",
  timeZone: "UTC",
});

export function utcDayKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function startOfUtcWeek(date: Date = new Date()): Date {
  const start = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
  start.setUTCDate(start.getUTCDate() - start.getUTCDay());
  return start;
}

export function addUtcDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

export function formatWeekLabel(
  start: Date,
  end: Date,
  style: "short" | "long" = "long",
): string {
  const month = style === "short" ? shortMonthFormatter : longMonthFormatter;
  const startDay = start.getUTCDate();
  const endDay = end.getUTCDate();
  const startMonth = month.format(start);
  const endMonth = month.format(end);
  const startYear = start.getUTCFullYear();
  const endYear = end.getUTCFullYear();

  if (startYear === endYear && startMonth === endMonth) {
    return `${startDay}–${endDay} ${month.format(end)} ${endYear}`;
  }

  const startLabel = `${startDay} ${startMonth}${
    startYear === endYear ? "" : ` ${startYear}`
  }`;
  return `${startLabel} – ${endDay} ${endMonth} ${endYear}`;
}

export function parseWeekAnchor(
  value: string | string[] | undefined,
  current: Date,
  earliest: Date,
): Date {
  const raw = Array.isArray(value) ? value[0] : value;
  if (!raw || !/^\d{4}-\d{2}-\d{2}$/.test(raw)) return current;

  const parsed = new Date(`${raw}T00:00:00.000Z`);
  if (Number.isNaN(parsed.getTime()) || parsed.getUTCDay() !== 0) return current;
  if (parsed < earliest) return earliest;
  if (parsed > current) return current;
  return parsed;
}
