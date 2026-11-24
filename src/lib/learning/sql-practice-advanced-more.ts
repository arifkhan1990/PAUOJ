/**
 * Practice problem slugs for the Advanced SQL module — extra hard batch.
 *
 * Keyed by the topic slug in `sql-track.ts` / `sql-advanced-*.ts` topic
 * files, on top of the guided problems and the A/B practice sets, so every
 * topic ships 6 problems. Both entries are HARD seeds; `medium` carries the
 * challenge problem so the topic UI keeps a two-step practice ladder.
 * Seed definitions live in `sql-problems-practice-advanced-more-<topic>.ts`.
 */
export const ADVANCED_SQL_PRACTICE_MORE: Record<
  string,
  { easy: string[]; medium: string[]; hard: string[] }
> = {
  "window-thinking": {
    easy: [],
    medium: ["sql-practice-window-thinking-challenge"],
    hard: ["sql-practice-window-thinking-hard"],
  },
  hierarchies: {
    easy: [],
    medium: ["sql-practice-hierarchies-challenge"],
    hard: ["sql-practice-hierarchies-hard"],
  },
  "business-metrics": {
    easy: [],
    medium: ["sql-practice-business-metrics-challenge"],
    hard: ["sql-practice-business-metrics-hard"],
  },
  timelines: {
    easy: [],
    medium: ["sql-practice-timelines-challenge"],
    hard: ["sql-practice-timelines-hard"],
  },
  "funnels-coupons": {
    easy: [],
    medium: ["sql-practice-funnels-coupons-challenge"],
    hard: ["sql-practice-funnels-coupons-hard"],
  },
  "json-inventory": {
    easy: [],
    medium: ["sql-practice-json-inventory-challenge"],
    hard: ["sql-practice-json-inventory-hard"],
  },
  "finance-reconciliation": {
    easy: [],
    medium: ["sql-practice-finance-reconciliation-challenge"],
    hard: ["sql-practice-finance-reconciliation-hard"],
  },
  "advanced-windows": {
    easy: [],
    medium: ["sql-practice-advanced-windows-challenge"],
    hard: ["sql-practice-advanced-windows-hard"],
  },
  "pivot-grouping": {
    easy: [],
    medium: ["sql-practice-pivot-grouping-challenge"],
    hard: ["sql-practice-pivot-grouping-hard"],
  },
  "query-performance": {
    easy: [],
    medium: ["sql-practice-query-performance-challenge"],
    hard: ["sql-practice-query-performance-hard"],
  },
  capstone: {
    easy: [],
    medium: ["sql-practice-capstone-challenge"],
    hard: ["sql-practice-capstone-hard"],
  },
};
