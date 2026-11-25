/**
 * The ShopSphere data dictionary for the industry-project page.
 *
 * Every table and column must match the judge fixture (`judge/shopsphere.sql`).
 * `sql-project.test.ts` parses the fixture and fails on drift, so students never
 * read a table or column that the judge does not actually have.
 */

import { SQL_PROJECT_TABLES_COMMERCE } from "./sql-project-schema-commerce";
import { SQL_PROJECT_TABLES_CORE } from "./sql-project-schema-core";

import type { SqlProjectTable } from "./sql-project";

/** All 19 fixture tables, in the fixture's own `CREATE TABLE` order. */
export const SQL_PROJECT_TABLES: SqlProjectTable[] = [
  ...SQL_PROJECT_TABLES_CORE,
  ...SQL_PROJECT_TABLES_COMMERCE,
];
