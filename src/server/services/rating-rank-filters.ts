import {
  asc,
  desc,
  sql,
  type AnyColumn,
  type SQL,
  type SQLWrapper,
} from "drizzle-orm";
import type { RatingSort } from "@/lib/rating-rank-types";
import { rankSolvedRangeCondition } from "./rank-filters";

/** Rating totals exposed by the rated board subquery. */
export type RatingFilterColumns = {
  username: AnyColumn;
  rating: AnyColumn | SQLWrapper;
  maxRating: AnyColumn | SQLWrapper;
  contestCount: AnyColumn | SQLWrapper;
};

/**
 * Inclusive rating range on the current rating; either bound may be omitted.
 * The numeric range builder is shared with the points board.
 */
export function ratingRangeCondition(
  minRating: number | undefined,
  maxRating: number | undefined,
  column: AnyColumn | SQLWrapper,
): SQL | undefined {
  return rankSolvedRangeCondition(minRating, maxRating, column);
}

/**
 * ORDER BY for the requested sort. `rating` is the default board order and the
 * order used for the global rank; `username` is unique, so it settles ties.
 */
export function ratingSortOrder(
  sort: RatingSort | undefined,
  columns: Pick<RatingFilterColumns, "username" | "rating" | "maxRating" | "contestCount">,
): SQL[] {
  switch (sort) {
    case "peak":
      return [
        desc(columns.maxRating),
        desc(columns.rating),
        desc(columns.contestCount),
        asc(columns.username),
      ];
    case "contests":
      return [
        desc(columns.contestCount),
        desc(columns.rating),
        desc(columns.maxRating),
        asc(columns.username),
      ];
    case "name":
      return [asc(columns.username)];
    case "rating":
    default:
      return [
        desc(columns.rating),
        desc(columns.maxRating),
        desc(columns.contestCount),
        asc(columns.username),
      ];
  }
}

/**
 * Global 1-based position inside the full rated set, ordered by current rating,
 * peak rating, contest count and username. Computed before any filter or
 * pagination, so filtered rows keep their real rank.
 */
export function ratingGlobalRankExpression(columns: {
  rating: SQLWrapper;
  maxRating: SQLWrapper;
  contestCount: SQLWrapper;
  username: SQLWrapper;
}): SQL<number> {
  return sql<number>`(row_number() over (order by ${columns.rating} desc, ${columns.maxRating} desc, ${columns.contestCount} desc, ${columns.username} asc))::int`;
}
