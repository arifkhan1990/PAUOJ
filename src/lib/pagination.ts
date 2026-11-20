export type SearchParams = Record<string, string | string[] | undefined>;

export function firstValue(
  value: string | string[] | undefined,
): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

export function readPage(
  searchParams: SearchParams,
  key = "page",
  max = 10000,
): number {
  const raw = Number(firstValue(searchParams[key]));
  if (!Number.isFinite(raw) || raw < 1) return 1;
  return Math.min(Math.floor(raw), max);
}

export function readInt(
  searchParams: SearchParams,
  key: string,
  fallback: number,
  min: number,
  max: number,
): number {
  const raw = Number(firstValue(searchParams[key]));
  if (!Number.isFinite(raw)) return fallback;
  return Math.min(max, Math.max(min, Math.floor(raw)));
}

export function buildQueryString(
  current: SearchParams,
  updates: Record<string, string | number | undefined | null>,
): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(current)) {
    if (key in updates) continue;
    if (Array.isArray(value)) {
      for (const item of value) params.append(key, item);
    } else if (value !== undefined) {
      params.set(key, value);
    }
  }
  for (const [key, value] of Object.entries(updates)) {
    if (value === undefined || value === null || value === "") continue;
    params.set(key, String(value));
  }
  return params.toString();
}

export function pageHref(
  pathname: string,
  searchParams: SearchParams,
  page: number,
): string {
  const query = buildQueryString(searchParams, { page });
  return query ? `${pathname}?${query}` : pathname;
}
