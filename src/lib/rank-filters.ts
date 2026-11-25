import type { SelectOption } from "@/lib/select-options";
import type { RankSort } from "@/lib/types";
import { DEFAULT_PAGE_SIZE } from "@/lib/constants";
import {
  buildQueryString,
  firstValue,
  type SearchParams,
} from "@/lib/pagination";

/** Bracket values used by the `/rank` `solved` param. */
export const RANK_SOLVED_BRACKETS = [
  "any",
  "1-10",
  "11-50",
  "51-100",
  "100+",
] as const;

export type RankSolvedBracket = (typeof RANK_SOLVED_BRACKETS)[number];

export const RANK_SOLVED_LABEL: Record<RankSolvedBracket, string> = {
  any: "Any solved",
  "1-10": "1–10 solved",
  "11-50": "11–50 solved",
  "51-100": "51–100 solved",
  "100+": "100+ solved",
};

export const RANK_PAGE_SIZES = [10, 20, 50] as const;

export type RankPageSize = (typeof RANK_PAGE_SIZES)[number];

const RANK_SORT_VALUES: readonly RankSort[] = ["points", "solved", "name"];

export const RANK_SORT_OPTIONS: readonly { value: RankSort; label: string }[] = [
  { value: "points", label: "Points" },
  { value: "solved", label: "Most solved" },
  { value: "name", label: "Name (A–Z)" },
];

export type RankFilterState = {
  q: string;
  institution: string;
  country: string;
  solved: RankSolvedBracket;
  sort: RankSort;
  pageSize: RankPageSize;
};

export type RankFacetItem = { value: string; count: number };

export type RankFilterChipKey = "q" | "institution" | "country" | "solved";

export type RankFilterChip = {
  key: RankFilterChipKey;
  label: string;
  href: string;
};

/** Shared text limits so both rank boards sanitise input the same way. */
export const FILTER_TEXT_LIMITS = {
  q: 100,
  institution: 120,
  country: 80,
} as const;

export function cleanFilterText(
  value: string | string[] | undefined,
  maxLength: number,
): string {
  return (firstValue(value) ?? "").trim().slice(0, maxLength);
}

export function parseSolvedBracket(
  value: string | string[] | undefined,
): RankSolvedBracket {
  const raw = firstValue(value)?.trim();
  return RANK_SOLVED_BRACKETS.find((bracket) => bracket === raw) ?? "any";
}

/** Inclusive solved bounds for the backend. */
export function solvedRange(bracket: RankSolvedBracket): {
  minSolved?: number;
  maxSolved?: number;
} {
  switch (bracket) {
    case "1-10":
      return { minSolved: 1, maxSolved: 10 };
    case "11-50":
      return { minSolved: 11, maxSolved: 50 };
    case "51-100":
      return { minSolved: 51, maxSolved: 100 };
    case "100+":
      return { minSolved: 100 };
    default:
      return {};
  }
}

export function parseRankSort(
  value: string | string[] | undefined,
): RankSort {
  const raw = firstValue(value)?.trim();
  return RANK_SORT_VALUES.find((sort) => sort === raw) ?? "points";
}

export function parseRankPageSize(
  value: string | string[] | undefined,
): RankPageSize {
  const raw = Number(firstValue(value));
  return RANK_PAGE_SIZES.find((size) => size === raw) ?? DEFAULT_PAGE_SIZE;
}

export function parseRankFilters(searchParams: SearchParams): RankFilterState {
  return {
    q: cleanFilterText(searchParams.q, FILTER_TEXT_LIMITS.q),
    institution: cleanFilterText(
      searchParams.institution,
      FILTER_TEXT_LIMITS.institution,
    ),
    country: cleanFilterText(
      searchParams.country,
      FILTER_TEXT_LIMITS.country,
    ),
    solved: parseSolvedBracket(searchParams.solved),
    sort: parseRankSort(searchParams.sort),
    pageSize: parseRankPageSize(searchParams.pageSize),
  };
}

export function hasActiveRankFilters(
  filters: Pick<RankFilterState, "q" | "institution" | "country" | "solved">,
): boolean {
  return Boolean(
    filters.q || filters.institution || filters.country,
  ) || filters.solved !== "any";
}

export function activeRankFilterCount(
  filters: Pick<RankFilterState, "q" | "institution" | "country" | "solved">,
): number {
  return [
    filters.q,
    filters.institution,
    filters.country,
    filters.solved !== "any" ? filters.solved : "",
  ].filter(Boolean).length;
}

/**
 * Canonical, sanitised query for pagination and filter links. Defaults are
 * dropped so URLs stay readable; `pageSize` is kept because the page-size
 * control lives outside the filter form.
 */
export function rankSearchParams(filters: RankFilterState): SearchParams {
  const params: SearchParams = {};
  if (filters.q) params.q = filters.q;
  if (filters.institution) params.institution = filters.institution;
  if (filters.country) params.country = filters.country;
  if (filters.solved !== "any") params.solved = filters.solved;
  if (filters.sort !== "points") params.sort = filters.sort;
  params.pageSize = String(filters.pageSize);
  return params;
}

function rankHref(
  searchParams: SearchParams,
  updates: Record<string, string | number | undefined>,
): string {
  const query = buildQueryString(searchParams, {
    ...updates,
    page: undefined,
  });
  return query ? `/rank?${query}` : "/rank";
}

export function rankFilterChips(
  filters: RankFilterState,
  searchParams: SearchParams = rankSearchParams(filters),
): RankFilterChip[] {
  const chips: RankFilterChip[] = [];
  if (filters.q) {
    chips.push({
      key: "q",
      label: `Search: ${filters.q}`,
      href: rankHref(searchParams, { q: undefined }),
    });
  }
  if (filters.institution) {
    chips.push({
      key: "institution",
      label: `Institution: ${filters.institution}`,
      href: rankHref(searchParams, { institution: undefined }),
    });
  }
  if (filters.country) {
    chips.push({
      key: "country",
      label: `Country: ${filters.country}`,
      href: rankHref(searchParams, { country: undefined }),
    });
  }
  if (filters.solved !== "any") {
    chips.push({
      key: "solved",
      label: RANK_SOLVED_LABEL[filters.solved],
      href: rankHref(searchParams, { solved: undefined }),
    });
  }
  return chips;
}

/**
 * Select options for a facet list. The active value is appended when it is not
 * part of the facet window, so a deep link always shows the current filter.
 */
export function facetSelectOptions(
  items: readonly RankFacetItem[],
  allLabel: string,
  activeValue?: string,
): SelectOption[] {
  const options: SelectOption[] = [{ value: "", label: allLabel }];
  const seen = new Set<string>();
  for (const item of items) {
    if (!item.value || seen.has(item.value)) continue;
    seen.add(item.value);
    options.push({
      value: item.value,
      label: `${item.value} (${item.count})`,
    });
  }
  const active = activeValue?.trim();
  if (active && !seen.has(active)) {
    options.push({ value: active, label: active });
  }
  return options;
}

/** Inclusive 1-based range of the rows shown on this page. */
export function rankResultRange(
  page: number,
  pageSize: number,
  total: number,
): { from: number; to: number } {
  if (total <= 0) return { from: 0, to: 0 };
  const from = (page - 1) * pageSize + 1;
  return { from, to: Math.min(total, page * pageSize) };
}
