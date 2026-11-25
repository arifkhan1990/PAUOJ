import {
  and,
  asc,
  count,
  desc,
  isNotNull,
  ne,
} from "drizzle-orm";
import type { Subquery } from "drizzle-orm";
import type { AnyPgColumn } from "drizzle-orm/pg-core";
import { getDb } from "@/server/db";
import type { RankFacet } from "@/lib/types";

/** Top values returned for each leaderboard facet. */
export const RANK_FACET_LIMIT = 50;

/**
 * Top facet values by board count, ignoring empty values. Shared by the points
 * and contest-rating boards so both expose the same facet shape.
 */
export async function rankFacetValues(
  board: Subquery,
  column: AnyPgColumn,
): Promise<RankFacet[]> {
  const db = getDb();
  const rows = await db
    .select({ value: column, valueCount: count() })
    .from(board)
    .where(and(isNotNull(column), ne(column, "")))
    .groupBy(column)
    .orderBy(desc(count()), asc(column))
    .limit(RANK_FACET_LIMIT);

  return rows.map((row) => ({
    // Facets are text columns; the generic column type erases that.
    value: (row.value as string | null) ?? "",
    count: Number(row.valueCount),
  }));
}
