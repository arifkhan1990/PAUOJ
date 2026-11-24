import type { SeedProblem } from "./seed-problems";
import { SQL_PROBLEMS_PRACTICE_ADVANCED_A_BUSINESS_METRICS } from "./sql-problems-practice-advanced-a-business-metrics";
import { SQL_PROBLEMS_BASIC } from "./sql-problems-basic";
import { SQL_PROBLEMS_BASIC_DATES } from "./sql-problems-basic-dates";
import { SQL_PROBLEMS_BASIC_JOINS } from "./sql-problems-basic-joins";
import { SQL_PROBLEMS_BASIC_LIFECYCLE } from "./sql-problems-basic-lifecycle";
import { SQL_PROBLEMS_BASIC_PAGINATION } from "./sql-problems-basic-pagination";
import { SQL_PROBLEMS_BASIC_MISSING } from "./sql-problems-basic-missing";
import { SQL_PROBLEMS_BASIC_SETOPS } from "./sql-problems-basic-setops";
import { SQL_PROBLEMS_BASIC_SUBQUERIES } from "./sql-problems-basic-subqueries";
import { SQL_PROBLEMS_BASIC_TEXTDATE } from "./sql-problems-basic-textdate";
import { SQL_PROBLEMS_ADVANCED } from "./sql-problems-advanced";
import { SQL_PROBLEMS_ADVANCED_CAPSTONE } from "./sql-problems-advanced-capstone";
import { SQL_PROBLEMS_ADVANCED_FINANCE } from "./sql-problems-advanced-finance";
import { SQL_PROBLEMS_ADVANCED_LABS } from "./sql-problems-advanced-labs";
import { SQL_PROBLEMS_ADVANCED_FUNNELS } from "./sql-problems-advanced-funnels";
import { SQL_PROBLEMS_ADVANCED_JSON } from "./sql-problems-advanced-json";
import { SQL_PROBLEMS_ADVANCED_METRICS } from "./sql-problems-advanced-metrics";
import { SQL_PROBLEMS_ADVANCED_PERFORMANCE } from "./sql-problems-advanced-performance";
import { SQL_PROBLEMS_ADVANCED_PIVOT } from "./sql-problems-advanced-pivot";
import { SQL_PROBLEMS_ADVANCED_WINDOWS2 } from "./sql-problems-advanced-windows2";
import { SQL_PROBLEMS_ADVANCED_TIMELINES } from "./sql-problems-advanced-timelines";
import { SQL_PROBLEMS_CHECKPOINTS_BASIC } from "./sql-problems-checkpoints-basic";
import { SQL_PROBLEMS_CHECKPOINTS_ADVANCED } from "./sql-problems-checkpoints-advanced";

import { SQL_PROBLEMS_PRACTICE_ADVANCED_A_FUNNELS_COUPONS } from "./sql-problems-practice-advanced-a-funnels-coupons";
import { SQL_PROBLEMS_PRACTICE_ADVANCED_A_HIERARCHIES } from "./sql-problems-practice-advanced-a-hierarchies";
import { SQL_PROBLEMS_PRACTICE_ADVANCED_A_JSON_INVENTORY } from "./sql-problems-practice-advanced-a-json-inventory";
import { SQL_PROBLEMS_PRACTICE_ADVANCED_A_TIMELINES } from "./sql-problems-practice-advanced-a-timelines";
import { SQL_PROBLEMS_PRACTICE_ADVANCED_A_WINDOW_THINKING } from "./sql-problems-practice-advanced-a-window-thinking";
import { SQL_PROBLEMS_PRACTICE_ADVANCED_B_ADVANCED_WINDOWS } from "./sql-problems-practice-advanced-b-advanced-windows";
import { SQL_PROBLEMS_PRACTICE_ADVANCED_B_CAPSTONE } from "./sql-problems-practice-advanced-b-capstone";
import { SQL_PROBLEMS_PRACTICE_ADVANCED_B_FINANCE_RECONCILIATION } from "./sql-problems-practice-advanced-b-finance-reconciliation";
import { SQL_PROBLEMS_PRACTICE_ADVANCED_B_PIVOT_GROUPING } from "./sql-problems-practice-advanced-b-pivot-grouping";
import { SQL_PROBLEMS_PRACTICE_ADVANCED_B_QUERY_PERFORMANCE } from "./sql-problems-practice-advanced-b-query-performance";

import { SQL_PROBLEMS_PRACTICE_BASIC_JOINS_IN_DEPTH } from "./sql-problems-practice-basic-joins-in-depth";
import { SQL_PROBLEMS_PRACTICE_BASIC_MISSING_ROWS } from "./sql-problems-practice-basic-missing-rows";
import { SQL_PROBLEMS_PRACTICE_BASIC_MONEY_AND_ORDERS } from "./sql-problems-practice-basic-money-and-orders";
import { SQL_PROBLEMS_PRACTICE_BASIC_ORDER_LIFECYCLE } from "./sql-problems-practice-basic-order-lifecycle";
import { SQL_PROBLEMS_PRACTICE_BASIC_ORIENTATION } from "./sql-problems-practice-basic-orientation";
import { SQL_PROBLEMS_PRACTICE_BASIC_PAGINATION } from "./sql-problems-practice-basic-pagination";
import { SQL_PROBLEMS_PRACTICE_BASIC_SET_OPERATIONS } from "./sql-problems-practice-basic-set-operations";
import { SQL_PROBLEMS_PRACTICE_BASIC_SUBQUERIES } from "./sql-problems-practice-basic-subqueries";
import { SQL_PROBLEMS_PRACTICE_BASIC_TEXT_AND_DATES } from "./sql-problems-practice-basic-text-and-dates";
import { SQL_PROBLEMS_PRACTICE_BASIC_TEXT_DATES_TIME } from "./sql-problems-practice-basic-text-dates-time";
/** All ShopSphere SQL problems, grouped for maintainability. */
export const SQL_PROBLEMS: SeedProblem[] = [
  ...SQL_PROBLEMS_BASIC,
  ...SQL_PROBLEMS_BASIC_MISSING,
  ...SQL_PROBLEMS_BASIC_SUBQUERIES,
  ...SQL_PROBLEMS_BASIC_SETOPS,
  ...SQL_PROBLEMS_BASIC_TEXTDATE,
  ...SQL_PROBLEMS_BASIC_LIFECYCLE,
  ...SQL_PROBLEMS_BASIC_JOINS,
  ...SQL_PROBLEMS_BASIC_PAGINATION,
  ...SQL_PROBLEMS_BASIC_DATES,
  ...SQL_PROBLEMS_PRACTICE_BASIC_JOINS_IN_DEPTH,
  ...SQL_PROBLEMS_PRACTICE_BASIC_MISSING_ROWS,
  ...SQL_PROBLEMS_PRACTICE_BASIC_MONEY_AND_ORDERS,
  ...SQL_PROBLEMS_PRACTICE_BASIC_ORDER_LIFECYCLE,
  ...SQL_PROBLEMS_PRACTICE_BASIC_ORIENTATION,
  ...SQL_PROBLEMS_PRACTICE_BASIC_PAGINATION,
  ...SQL_PROBLEMS_PRACTICE_BASIC_SET_OPERATIONS,
  ...SQL_PROBLEMS_PRACTICE_BASIC_SUBQUERIES,
  ...SQL_PROBLEMS_PRACTICE_BASIC_TEXT_AND_DATES,
  ...SQL_PROBLEMS_PRACTICE_BASIC_TEXT_DATES_TIME,
  ...SQL_PROBLEMS_ADVANCED,
  ...SQL_PROBLEMS_ADVANCED_METRICS,
  ...SQL_PROBLEMS_ADVANCED_TIMELINES,
  ...SQL_PROBLEMS_ADVANCED_FUNNELS,
  ...SQL_PROBLEMS_ADVANCED_JSON,
  ...SQL_PROBLEMS_ADVANCED_FINANCE,
  ...SQL_PROBLEMS_ADVANCED_LABS,
  ...SQL_PROBLEMS_ADVANCED_WINDOWS2,
  ...SQL_PROBLEMS_ADVANCED_PIVOT,
  ...SQL_PROBLEMS_ADVANCED_PERFORMANCE,
  ...SQL_PROBLEMS_ADVANCED_CAPSTONE,
  ...SQL_PROBLEMS_PRACTICE_ADVANCED_A_BUSINESS_METRICS,
  ...SQL_PROBLEMS_PRACTICE_ADVANCED_A_FUNNELS_COUPONS,
  ...SQL_PROBLEMS_PRACTICE_ADVANCED_A_HIERARCHIES,
  ...SQL_PROBLEMS_PRACTICE_ADVANCED_A_JSON_INVENTORY,
  ...SQL_PROBLEMS_PRACTICE_ADVANCED_A_TIMELINES,
  ...SQL_PROBLEMS_PRACTICE_ADVANCED_A_WINDOW_THINKING,
  ...SQL_PROBLEMS_PRACTICE_ADVANCED_B_ADVANCED_WINDOWS,
  ...SQL_PROBLEMS_PRACTICE_ADVANCED_B_CAPSTONE,
  ...SQL_PROBLEMS_PRACTICE_ADVANCED_B_FINANCE_RECONCILIATION,
  ...SQL_PROBLEMS_PRACTICE_ADVANCED_B_PIVOT_GROUPING,
  ...SQL_PROBLEMS_PRACTICE_ADVANCED_B_QUERY_PERFORMANCE,
  ...SQL_PROBLEMS_CHECKPOINTS_BASIC,
  ...SQL_PROBLEMS_CHECKPOINTS_ADVANCED,
];
