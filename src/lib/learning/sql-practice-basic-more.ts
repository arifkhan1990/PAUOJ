/**
 * Additional practice problem slugs for the Basic SQL module: one hard + one
 * challenge problem per topic, on top of the guided pair and the first
 * practice pair (BASIC_SQL_PRACTICE). Each topic therefore has 6 problems.
 *
 * Key = topic slug in `basicSqlModule` (src/lib/learning/tracks/sql-track.ts).
 * The problems live in src/server/db/sql-problems-practice-basic-more-<topic>.ts
 * and are integrated into the seed index by the lead (sql-problems.ts).
 */
export const BASIC_SQL_PRACTICE_MORE: Record<
  string,
  { easy: string[]; medium: string[]; hard: string[] }
> = {
  orientation: {
    easy: [],
    medium: ["sql-practice-orientation-challenge"],
    hard: ["sql-practice-orientation-hard"],
  },
  "money-and-orders": {
    easy: [],
    medium: ["sql-practice-money-and-orders-challenge"],
    hard: ["sql-practice-money-and-orders-hard"],
  },
  "missing-rows": {
    easy: [],
    medium: ["sql-practice-missing-rows-challenge"],
    hard: ["sql-practice-missing-rows-hard"],
  },
  subqueries: {
    easy: [],
    medium: ["sql-practice-subqueries-challenge"],
    hard: ["sql-practice-subqueries-hard"],
  },
  "set-operations": {
    easy: [],
    medium: ["sql-practice-set-operations-challenge"],
    hard: ["sql-practice-set-operations-hard"],
  },
  "text-and-dates": {
    easy: [],
    medium: ["sql-practice-text-and-dates-challenge"],
    hard: ["sql-practice-text-and-dates-hard"],
  },
  "order-lifecycle": {
    easy: [],
    medium: ["sql-practice-order-lifecycle-challenge"],
    hard: ["sql-practice-order-lifecycle-hard"],
  },
  "joins-in-depth": {
    easy: [],
    medium: ["sql-practice-joins-in-depth-challenge"],
    hard: ["sql-practice-joins-in-depth-hard"],
  },
  pagination: {
    easy: [],
    medium: ["sql-practice-pagination-challenge"],
    hard: ["sql-practice-pagination-hard"],
  },
  "text-dates-time": {
    easy: [],
    medium: ["sql-practice-text-dates-time-challenge"],
    hard: ["sql-practice-text-dates-time-hard"],
  },
};
