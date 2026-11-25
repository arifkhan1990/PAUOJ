import {
  buildQueryString,
  firstValue,
  type SearchParams,
} from "@/lib/pagination";
import {
  cleanFilterText,
  FILTER_TEXT_LIMITS,
  parseRankPageSize,
  type RankPageSize,
} from "@/lib/rank-filters";
import { RATING_TIERS, type RatingTierKey } from "@/lib/rating-tiers";
import type { SelectOption } from "@/lib/select-options";

/** `/rank` boards. `points` is the default and stays out of URLs. */
export const RANK_BOARDS = ["points", "rating"] as const;

export type RankBoard = (typeof RANK_BOARDS)[number];

export function parseRankBoard(
  value: string | string[] | undefined,
): RankBoard {
  return firstValue(value)?.trim() === "rating" ? "rating" : "points";
}

export type RatedTierKey = Exclude<RatingTierKey, "unrated">;

export type RatingTierFilter = RatedTierKey | "any";

export const RATING_SORT_VALUES = [
  "rating",
  "peak",
  "contests",
  "name",
] as const;

export type RatingSortValue = (typeof RATING_SORT_VALUES)[number];

export const RATING_SORT_OPTIONS: readonly {
  value: RatingSortValue;
  label: string;
}[] = [
  { value: "rating", label: "Rating" },
  { value: "peak", label: "Peak rating" },
  { value: "contests", label: "Most contests" },
  { value: "name", label: "Name (A–Z)" },
];

export function parseRatingSort(
  value: string | string[] | undefined,
): RatingSortValue {
  const raw = firstValue(value)?.trim();
  return RATING_SORT_VALUES.find((sort) => sort === raw) ?? "rating";
}

function isRatedTierKey(value: string): value is RatedTierKey {
  return (
    value !== "unrated" &&
    RATING_TIERS.some((tier) => tier.key === value)
  );
}

export function parseRatingTier(
  value: string | string[] | undefined,
): RatingTierFilter {
  const raw = firstValue(value)?.trim();
  return raw && isRatedTierKey(raw) ? raw : "any";
}

export function parseRatingPageSize(
  value: string | string[] | undefined,
): RankPageSize {
  return parseRankPageSize(value);
}

export type RatingFilterState = {
  q: string;
  institution: string;
  country: string;
  tier: RatingTierFilter;
  sort: RatingSortValue;
  pageSize: RankPageSize;
};

export function parseRatingFilters(
  searchParams: SearchParams,
): RatingFilterState {
  return {
    q: cleanFilterText(searchParams.q, FILTER_TEXT_LIMITS.q),
    institution: cleanFilterText(
      searchParams.institution,
      FILTER_TEXT_LIMITS.institution,
    ),
    country: cleanFilterText(searchParams.country, FILTER_TEXT_LIMITS.country),
    tier: parseRatingTier(searchParams.tier),
    sort: parseRatingSort(searchParams.sort),
    pageSize: parseRatingPageSize(searchParams.pageSize),
  };
}

export function hasActiveRatingFilters(
  filters: Pick<RatingFilterState, "q" | "institution" | "country" | "tier">,
): boolean {
  return (
    Boolean(filters.q || filters.institution || filters.country) ||
    filters.tier !== "any"
  );
}

export function activeRatingFilterCount(
  filters: Pick<RatingFilterState, "q" | "institution" | "country" | "tier">,
): number {
  return [
    filters.q,
    filters.institution,
    filters.country,
    filters.tier !== "any" ? filters.tier : "",
  ].filter(Boolean).length;
}

/** Inclusive rating bounds for the active tier, derived from `RATING_TIERS`. */
export function ratingTierRange(tier: RatingTierFilter): {
  minRating?: number;
  maxRating?: number;
} {
  if (tier === "any") return {};
  const found = RATING_TIERS.find((item) => item.key === tier);
  if (!found) return {};
  return {
    minRating: found.min,
    ...(found.max === null ? {} : { maxRating: found.max }),
  };
}

/** Tier select options; the empty value means "Any rating". */
export function ratingTierOptions(): SelectOption[] {
  return [
    { value: "", label: "Any rating" },
    ...RATING_TIERS.map((tier) => ({
      value: tier.key,
      label: tier.label,
    })),
  ];
}

/**
 * Canonical query for rating pagination, chips and the filter form. The board
 * marker is always present so every link stays on the rating board.
 */
export function ratingSearchParams(filters: RatingFilterState): SearchParams {
  const params: SearchParams = { board: "rating" };
  if (filters.q) params.q = filters.q;
  if (filters.institution) params.institution = filters.institution;
  if (filters.country) params.country = filters.country;
  if (filters.tier !== "any") params.tier = filters.tier;
  if (filters.sort !== "rating") params.sort = filters.sort;
  params.pageSize = String(filters.pageSize);
  return params;
}

function ratingHref(
  searchParams: SearchParams,
  updates: Record<string, string | number | undefined>,
): string {
  const base: SearchParams = {};
  for (const [key, value] of Object.entries(searchParams)) {
    if (key === "board" || key === "page") continue;
    base[key] = value;
  }
  const query = buildQueryString(base, { ...updates, page: undefined });
  return query ? `/rank?board=rating&${query}` : "/rank?board=rating";
}

export type RatingFilterChipKey = "q" | "institution" | "country" | "tier";

export type RatingFilterChip = {
  key: RatingFilterChipKey;
  label: string;
  href: string;
};

export function ratingFilterChips(
  filters: RatingFilterState,
  searchParams: SearchParams = ratingSearchParams(filters),
): RatingFilterChip[] {
  const chips: RatingFilterChip[] = [];
  if (filters.q) {
    chips.push({
      key: "q",
      label: `Search: ${filters.q}`,
      href: ratingHref(searchParams, { q: undefined }),
    });
  }
  if (filters.institution) {
    chips.push({
      key: "institution",
      label: `Institution: ${filters.institution}`,
      href: ratingHref(searchParams, { institution: undefined }),
    });
  }
  if (filters.country) {
    chips.push({
      key: "country",
      label: `Country: ${filters.country}`,
      href: ratingHref(searchParams, { country: undefined }),
    });
  }
  if (filters.tier !== "any") {
    const label =
      RATING_TIERS.find((tier) => tier.key === filters.tier)?.label ??
      filters.tier;
    chips.push({
      key: "tier",
      label: `Rating: ${label}`,
      href: ratingHref(searchParams, { tier: undefined }),
    });
  }
  return chips;
}

/**
 * Href for moving between boards. Only the filters both boards share survive
 * (`q`, `institution`, `country`, `pageSize`); board-specific `page`, `solved`,
 * `tier` and `sort` reset so the new board starts from a clean default.
 */
export function rankBoardHref(
  board: RankBoard,
  searchParams: SearchParams = {},
): string {
  const params: SearchParams = {};
  if (board === "rating") params.board = "rating";
  for (const key of ["q", "institution", "country", "pageSize"] as const) {
    const value = firstValue(searchParams[key])?.trim();
    if (value) params[key] = value;
  }
  const query = buildQueryString(params, {});
  return query ? `/rank?${query}` : "/rank";
}

/** Same board, all filters and board-specific params cleared. */
export function rankBoardResetHref(board: RankBoard): string {
  return board === "rating" ? "/rank?board=rating" : "/rank";
}

export function rankSignInHref(board: RankBoard): string {
  const target = board === "rating" ? "/rank?board=rating" : "/rank";
  return `/login?next=${encodeURIComponent(target)}`;
}

export const RANK_BOARD_META: Record<
  RankBoard,
  { eyebrow: string; title: string; description: string }
> = {
  points: {
    eyebrow: "Leaderboard",
    title: "Ranking",
    description:
      "Every accepted problem earns points once. Coders are ranked by total points, then by problems solved.",
  },
  rating: {
    eyebrow: "Contest rating",
    title: "Rating leaderboard",
    description:
      "Contest rating leaderboard for PrimeAsia University programmers, ranked by Elo rating from finalized rated solo contests.",
  },
};
