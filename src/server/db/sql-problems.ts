import type { SeedProblem } from "./seed-problems";
import { SQL_PROBLEMS_BASIC } from "./sql-problems-basic";
import { SQL_PROBLEMS_BASIC_LIFECYCLE } from "./sql-problems-basic-lifecycle";
import { SQL_PROBLEMS_BASIC_MISSING } from "./sql-problems-basic-missing";
import { SQL_PROBLEMS_BASIC_SETOPS } from "./sql-problems-basic-setops";
import { SQL_PROBLEMS_BASIC_SUBQUERIES } from "./sql-problems-basic-subqueries";
import { SQL_PROBLEMS_BASIC_TEXTDATE } from "./sql-problems-basic-textdate";
import { SQL_PROBLEMS_ADVANCED } from "./sql-problems-advanced";
import { SQL_PROBLEMS_ADVANCED_CAPSTONE } from "./sql-problems-advanced-capstone";
import { SQL_PROBLEMS_ADVANCED_FINANCE } from "./sql-problems-advanced-finance";
import { SQL_PROBLEMS_ADVANCED_FUNNELS } from "./sql-problems-advanced-funnels";
import { SQL_PROBLEMS_ADVANCED_JSON } from "./sql-problems-advanced-json";
import { SQL_PROBLEMS_ADVANCED_METRICS } from "./sql-problems-advanced-metrics";
import { SQL_PROBLEMS_ADVANCED_TIMELINES } from "./sql-problems-advanced-timelines";
import { SQL_PROBLEMS_CHECKPOINTS_BASIC } from "./sql-problems-checkpoints-basic";
import { SQL_PROBLEMS_CHECKPOINTS_ADVANCED } from "./sql-problems-checkpoints-advanced";

/** All ShopSphere SQL problems, grouped for maintainability. */
export const SQL_PROBLEMS: SeedProblem[] = [
  ...SQL_PROBLEMS_BASIC,
  ...SQL_PROBLEMS_BASIC_MISSING,
  ...SQL_PROBLEMS_BASIC_SUBQUERIES,
  ...SQL_PROBLEMS_BASIC_SETOPS,
  ...SQL_PROBLEMS_BASIC_TEXTDATE,
  ...SQL_PROBLEMS_BASIC_LIFECYCLE,
  ...SQL_PROBLEMS_ADVANCED,
  ...SQL_PROBLEMS_ADVANCED_METRICS,
  ...SQL_PROBLEMS_ADVANCED_TIMELINES,
  ...SQL_PROBLEMS_ADVANCED_FUNNELS,
  ...SQL_PROBLEMS_ADVANCED_JSON,
  ...SQL_PROBLEMS_ADVANCED_FINANCE,
  ...SQL_PROBLEMS_ADVANCED_CAPSTONE,
  ...SQL_PROBLEMS_CHECKPOINTS_BASIC,
  ...SQL_PROBLEMS_CHECKPOINTS_ADVANCED,
];
