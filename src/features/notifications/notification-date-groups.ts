export type NotificationDayKey = "today" | "yesterday" | "earlier";

export type NotificationDaySection<T extends { createdAt: string }> = {
  key: NotificationDayKey;
  label: "Today" | "Yesterday" | "Earlier";
  items: T[];
};

const SECTION_LABELS: Record<NotificationDayKey, "Today" | "Yesterday" | "Earlier"> = {
  today: "Today",
  yesterday: "Yesterday",
  earlier: "Earlier",
};

function startOfLocalDay(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

function bucketFor(createdAt: string, todayStart: number, yesterdayStart: number): NotificationDayKey {
  const time = new Date(createdAt).getTime();
  if (Number.isNaN(time)) return "earlier";
  if (time >= todayStart) return "today";
  if (time >= yesterdayStart) return "yesterday";
  return "earlier";
}

/**
 * Split newest-first rows into local-calendar-day sections (Today, Yesterday,
 * Earlier). Order inside every section is preserved; empty sections are
 * omitted. `now` is injectable so tests can pin the clock.
 */
export function groupByLocalDay<T extends { createdAt: string }>(
  items: readonly T[],
  now: Date = new Date(),
): NotificationDaySection<T>[] {
  const todayStart = startOfLocalDay(now);
  const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
  const yesterdayStart = startOfLocalDay(yesterday);

  const buckets: Record<NotificationDayKey, T[]> = {
    today: [],
    yesterday: [],
    earlier: [],
  };
  for (const item of items) {
    buckets[bucketFor(item.createdAt, todayStart, yesterdayStart)].push(item);
  }

  const order: NotificationDayKey[] = ["today", "yesterday", "earlier"];
  return order
    .filter((key) => buckets[key].length > 0)
    .map((key) => ({
      key,
      label: SECTION_LABELS[key],
      items: buckets[key],
    }));
}

/** Navbar badge text: hidden at zero, capped at 99+. */
export function formatUnreadBadge(count: number): string | null {
  const value = Math.trunc(Number(count));
  if (!Number.isFinite(value) || value <= 0) return null;
  return value > 99 ? "99+" : String(value);
}
