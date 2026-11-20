import type { HeatmapDay } from "@/lib/types";

export type ActivityRow = {
  date: string;
  total: number | string;
  accepted: number | string;
};

function utcDayKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function buildHeatmap(
  rows: ActivityRow[],
  days = 365,
  now: Date = new Date(),
): HeatmapDay[] {
  const byDate = new Map<string, { total: number; accepted: number }>();
  for (const row of rows) {
    byDate.set(row.date, {
      total: Number(row.total),
      accepted: Number(row.accepted),
    });
  }

  const end = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  );
  const start = new Date(end);
  start.setUTCDate(end.getUTCDate() - days + 1);

  const result: HeatmapDay[] = [];
  for (let cursor = start; cursor <= end; cursor.setUTCDate(cursor.getUTCDate() + 1)) {
    const key = utcDayKey(cursor);
    const entry = byDate.get(key);
    result.push({
      date: key,
      total: entry?.total ?? 0,
      accepted: entry?.accepted ?? 0,
    });
  }
  return result;
}

export function computeActiveDays(days: HeatmapDay[]): number {
  return days.reduce((total, day) => total + (day.accepted > 0 ? 1 : 0), 0);
}

export function computeLongestStreak(days: HeatmapDay[]): number {
  let best = 0;
  let current = 0;
  let previous: number | null = null;

  for (const day of days) {
    if (day.accepted <= 0) {
      current = 0;
      previous = null;
      continue;
    }
    const timestamp = Date.parse(`${day.date}T00:00:00Z`);
    current =
      previous !== null && timestamp - previous === 86_400_000 ? current + 1 : 1;
    previous = timestamp;
    best = Math.max(best, current);
  }

  return best;
}

export function computeCurrentStreak(
  days: HeatmapDay[],
  now: Date = new Date(),
): number {
  const active = new Set(
    days.filter((day) => day.accepted > 0).map((day) => day.date),
  );
  const cursor = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  );
  if (!active.has(utcDayKey(cursor))) {
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }
  let streak = 0;
  while (active.has(utcDayKey(cursor))) {
    streak += 1;
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }
  return streak;
}
