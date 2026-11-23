import type { SeedProblem } from "./seed-problems";
import { SQL_PROBLEMS_BASIC } from "./sql-problems-basic";
import { SQL_PROBLEMS_BASIC_MISSING } from "./sql-problems-basic-missing";
import { SQL_PROBLEMS_BASIC_SUBQUERIES } from "./sql-problems-basic-subqueries";
import { SQL_PROBLEMS_ADVANCED } from "./sql-problems-advanced";
import { SQL_PROBLEMS_ADVANCED_CAPSTONE } from "./sql-problems-advanced-capstone";
import { SQL_PROBLEMS_ADVANCED_METRICS } from "./sql-problems-advanced-metrics";
import { SQL_PROBLEMS_CHECKPOINTS_BASIC } from "./sql-problems-checkpoints-basic";
import { SQL_PROBLEMS_CHECKPOINTS_ADVANCED } from "./sql-problems-checkpoints-advanced";

/** All ShopSphere SQL problems, grouped for maintainability. */
export const SQL_PROBLEMS: SeedProblem[] = [
  ...SQL_PROBLEMS_BASIC,
  ...SQL_PROBLEMS_BASIC_MISSING,
  ...SQL_PROBLEMS_BASIC_SUBQUERIES,
  ...SQL_PROBLEMS_ADVANCED,
  ...SQL_PROBLEMS_ADVANCED_METRICS,
  ...SQL_PROBLEMS_ADVANCED_CAPSTONE,
  ...SQL_PROBLEMS_CHECKPOINTS_BASIC,
  ...SQL_PROBLEMS_CHECKPOINTS_ADVANCED,
];
