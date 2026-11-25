import {
  and,
  asc,
  desc,
  eq,
  ilike,
  or,
  sql,
  type AnyColumn,
  type SQL,
  type SQLWrapper,
} from "drizzle-orm";
import type { RankSort } from "@/lib/types";

/**
 * Columns a ranking filter can reference: real table columns from `users` or
 * the aliased columns of the ranked subquery (aggregates expose `SQL.Aliased`).
 */
export type RankFilterColumns = {
  username: AnyColumn;
  displayName: AnyColumn;
  institution: AnyColumn;
  country: AnyColumn;
  points: AnyColumn | SQLWrapper;
  solvedCount: AnyColumn | SQLWrapper;
};

/** `q` is a literal substring search: `%`, `_` and `\` must not act as wildcards. */
export function escapeLikePattern(value: string): string {
  return value.replace(/[\\%_]/g, (match) => `\\${match}`);
}

/**
 * Case-insensitive substring match over username, display name and institution.
 * Returns undefined for a blank term so callers can skip the condition.
 */
export function rankSearchCondition(
  q: string | undefined,
  columns: Pick<RankFilterColumns, "username" | "displayName" | "institution">,
): SQL | undefined {
  const term = q?.trim();
  if (!term) return undefined;
  const pattern = `%${escapeLikePattern(term)}%`;
  return or(
    ilike(columns.username, pattern),
    ilike(columns.displayName, pattern),
    ilike(columns.institution, pattern),
  )!;
}

/** Exact match on institution; blank input means "no filter". */
export function rankInstitutionCondition(
  institution: string | undefined,
  column: AnyColumn,
): SQL | undefined {
  const value = institution?.trim();
  return value ? eq(column, value) : undefined;
}

/** Exact match on country; blank input means "no filter". */
export function rankCountryCondition(
  country: string | undefined,
  column: AnyColumn,
): SQL | undefined {
  const value = country?.trim();
  return value ? eq(column, value) : undefined;
}

/** Inclusive solved-count range; either bound may be omitted. */
export function rankSolvedRangeCondition(
  minSolved: number | undefined,
  maxSolved: number | undefined,
  column: AnyColumn | SQLWrapper,
): SQL | undefined {
  const clauses: SQL[] = [];
  if (minSolved !== undefined) clauses.push(sql`${column} >= ${minSolved}`);
  if (maxSolved !== undefined) clauses.push(sql`${column} <= ${maxSolved}`);
  if (clauses.length === 0) return undefined;
  return clauses.length === 1 ? clauses[0] : and(...clauses)!;
}

/**
 * ORDER BY for the requested sort. `points` is the default board order and the
 * order used for the global rank; `username` is unique, so it settles ties.
 */
export function rankSortOrder(
  sort: RankSort | undefined,
  columns: Pick<RankFilterColumns, "username" | "points" | "solvedCount">,
): SQL[] {
  switch (sort) {
    case "solved":
      return [
        desc(columns.solvedCount),
        desc(columns.points),
        asc(columns.username),
      ];
    case "name":
      return [asc(columns.username)];
    case "points":
    default:
      return [
        desc(columns.points),
        desc(columns.solvedCount),
        asc(columns.username),
      ];
  }
}

/**
 * Global 1-based position inside the full ranked set. Evaluated in a subquery
 * before any filter or pagination, so filtered rows keep their real rank.
 */
export function rankGlobalRankExpression(columns: {
  points: SQLWrapper;
  solvedCount: SQLWrapper;
  username: SQLWrapper;
}): SQL<number> {
  return sql<number>`(row_number() over (order by ${columns.points} desc, ${columns.solvedCount} desc, ${columns.username} asc))::int`;
}
