export type RatingTierKey =
  | "unrated"
  | "prospect"
  | "contender"
  | "specialist"
  | "expert"
  | "master"
  | "grandmaster";

export type RatingTier = {
  key: RatingTierKey;
  label: string;
  min: number;
  max: number | null;
  badgeClassName: string;
  barClassName: string;
  textClassName: string;
};

export const RATING_RUNWAY_MIN = 1200;
export const RATING_RUNWAY_MAX = 2400;

export const UNRATED_TIER: RatingTier = {
  key: "unrated",
  label: "Unrated",
  min: 0,
  max: null,
  badgeClassName:
    "border-dashed border-border bg-muted/40 text-muted-foreground",
  barClassName: "bg-muted-foreground/40",
  textClassName: "text-muted-foreground",
};

export const RATING_TIERS: RatingTier[] = [
  {
    key: "prospect",
    label: "Prospect",
    min: 0,
    max: 1499,
    badgeClassName: "border-border bg-muted text-muted-foreground",
    barClassName: "bg-muted-foreground",
    textClassName: "text-muted-foreground",
  },
  {
    key: "contender",
    label: "Contender",
    min: 1500,
    max: 1599,
    badgeClassName:
      "border-teal-300 bg-teal-50 text-teal-800 dark:border-teal-800 dark:bg-teal-950 dark:text-teal-200",
    barClassName: "bg-teal-500",
    textClassName: "text-teal-700 dark:text-teal-300",
  },
  {
    key: "specialist",
    label: "Specialist",
    min: 1600,
    max: 1799,
    badgeClassName:
      "border-sky-300 bg-sky-50 text-sky-800 dark:border-sky-800 dark:bg-sky-950 dark:text-sky-200",
    barClassName: "bg-sky-500",
    textClassName: "text-sky-700 dark:text-sky-300",
  },
  {
    key: "expert",
    label: "Expert",
    min: 1800,
    max: 1999,
    badgeClassName:
      "border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-100",
    barClassName: "bg-amber-500",
    textClassName: "text-amber-700 dark:text-amber-300",
  },
  {
    key: "master",
    label: "Master",
    min: 2000,
    max: 2199,
    badgeClassName:
      "border-rose-300 bg-rose-50 text-rose-800 dark:border-rose-800 dark:bg-rose-950 dark:text-rose-200",
    barClassName: "bg-rose-500",
    textClassName: "text-rose-700 dark:text-rose-300",
  },
  {
    key: "grandmaster",
    label: "Grandmaster",
    min: 2200,
    max: null,
    badgeClassName:
      "border-orange-300 bg-orange-50 text-orange-900 dark:border-orange-800 dark:bg-orange-950 dark:text-orange-100",
    barClassName: "bg-orange-500",
    textClassName: "text-orange-700 dark:text-orange-300",
  },
];

export function getRatingTier(rating: number, rated = true): RatingTier {
  if (!rated) return UNRATED_TIER;
  return (
    RATING_TIERS.find(
      (tier) => rating >= tier.min && (tier.max === null || rating <= tier.max),
    ) ?? RATING_TIERS[0]
  );
}

export function getNextRatingTier(rating: number): RatingTier | null {
  return RATING_TIERS.find((tier) => tier.min > rating) ?? null;
}

export function getRatingRunwayPercent(rating: number): number {
  const clamped = Math.min(
    RATING_RUNWAY_MAX,
    Math.max(RATING_RUNWAY_MIN, rating),
  );
  return (
    ((clamped - RATING_RUNWAY_MIN) /
      (RATING_RUNWAY_MAX - RATING_RUNWAY_MIN)) *
    100
  );
}
