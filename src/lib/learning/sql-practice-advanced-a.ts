/**
 * Practice problem slugs for the Advanced SQL module, batch A.
 *
 * Key = topic slug in `advancedSqlModule` (src/lib/learning/tracks/sql-track.ts
 * and the extra topic files). Each topic gets 1 easy + 1 medium practice
 * problem on top of its 2 guided problems, so every topic has 4 problems.
 * The problems live in src/server/db/sql-problems-practice-advanced-a-<topic>.ts.
 */
export const ADVANCED_SQL_PRACTICE_A: Record<
  string,
  { easy: string[]; medium: string[]; hard: string[] }
> = {
  "window-thinking": {
    easy: ["sql-practice-window-thinking-easy"],
    medium: ["sql-practice-window-thinking-medium"],
    hard: [],
  },
  hierarchies: {
    easy: ["sql-practice-hierarchies-easy"],
    medium: ["sql-practice-hierarchies-medium"],
    hard: [],
  },
  "business-metrics": {
    easy: ["sql-practice-business-metrics-easy"],
    medium: ["sql-practice-business-metrics-medium"],
    hard: [],
  },
  timelines: {
    easy: ["sql-practice-timelines-easy"],
    medium: ["sql-practice-timelines-medium"],
    hard: [],
  },
  "funnels-coupons": {
    easy: ["sql-practice-funnels-coupons-easy"],
    medium: ["sql-practice-funnels-coupons-medium"],
    hard: [],
  },
  "json-inventory": {
    easy: ["sql-practice-json-inventory-easy"],
    medium: ["sql-practice-json-inventory-medium"],
    hard: [],
  },
};
