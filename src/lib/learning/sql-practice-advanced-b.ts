/**
 * Practice problem slugs for the Advanced SQL module — practice set B.
 *
 * Keyed by the topic slug in `sql-track.ts` / `sql-advanced-*.ts` topic files.
 * Each topic gets one direct-application problem (easy) and one
 * boundary/tie/double-count twist problem (medium) on top of its two guided
 * problems, so every topic ships four problems.
 * Seed definitions live in `sql-problems-practice-advanced-b-<topic>.ts`.
 */
export const ADVANCED_SQL_PRACTICE_B: Record<
  string,
  { easy: string[]; medium: string[]; hard: string[] }
> = {
  "finance-reconciliation": {
    easy: ["sql-practice-finance-reconciliation-easy"],
    medium: ["sql-practice-finance-reconciliation-medium"],
    hard: [],
  },
  "advanced-windows": {
    easy: ["sql-practice-advanced-windows-easy"],
    medium: ["sql-practice-advanced-windows-medium"],
    hard: [],
  },
  "pivot-grouping": {
    easy: ["sql-practice-pivot-grouping-easy"],
    medium: ["sql-practice-pivot-grouping-medium"],
    hard: [],
  },
  "query-performance": {
    easy: ["sql-practice-query-performance-easy"],
    medium: ["sql-practice-query-performance-medium"],
    hard: [],
  },
  capstone: {
    easy: ["sql-practice-capstone-easy"],
    medium: ["sql-practice-capstone-medium"],
    hard: [],
  },
};
