import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import {
  SQL_PROJECT_EPICS,
  SQL_PROJECT_HANDOVER,
  SQL_PROJECT_METRICS,
  SQL_PROJECT_TICKETS,
} from "./sql-project";
import { SQL_PROJECT_TABLES } from "./sql-project-schema";
import {
  advancedSqlModule,
  basicSqlModule,
} from "./tracks/sql-track";
import { SQL_PROBLEMS } from "@/server/db/sql-problems";

type FixtureColumn = { name: string; type: string };

function parseFixtureTables(sql: string): Map<string, FixtureColumn[]> {
  const tables = new Map<string, FixtureColumn[]>();
  const createTable = /CREATE TABLE (\w+) \(([^;]*)\);/g;
  for (const match of sql.matchAll(createTable)) {
    const [, table, body] = match;
    const columns = body.split(",").map((definition) => {
      const parts = definition.trim().split(/\s+/);
      return { name: parts[0], type: parts[1] };
    });
    tables.set(table, columns);
  }
  return tables;
}

/** Counts seed rows without trusting the `rowCount` field under test. */
function countSeedRows(sql: string, table: string): number {
  const marker = `INSERT INTO ${table} VALUES`;
  const start = sql.indexOf(marker);
  if (start < 0) return 0;
  const end = sql.indexOf(";", start);
  const body = sql.slice(start + marker.length, end);

  let rows = 0;
  let depth = 0;
  let inString = false;
  for (let index = 0; index < body.length; index += 1) {
    const char = body[index];
    if (inString) {
      if (char === "'") {
        if (body[index + 1] === "'") index += 1;
        else inString = false;
      }
      continue;
    }
    if (char === "'") inString = true;
    else if (char === "(") {
      if (depth === 0) rows += 1;
      depth += 1;
    } else if (char === ")") depth -= 1;
  }
  return rows;
}

const fixtureSql = readFileSync("judge/shopsphere.sql", "utf8");
const fixtureTables = parseFixtureTables(fixtureSql);
const fixtureTableNames = [...fixtureTables.keys()];

const sqlModules = [basicSqlModule, advancedSqlModule];
const topicModule = new Map<string, string>();
for (const definition of sqlModules) {
  for (const topic of definition.topics) {
    topicModule.set(topic.slug, definition.slug);
  }
}
const topicSlugs = [...topicModule.keys()];
const problemSlugs = new Set(SQL_PROBLEMS.map((problem) => problem.slug));
const dupes = (values: string[]) =>
  values.filter((value, index) => values.indexOf(value) !== index);

describe("ShopSphere project data dictionary", () => {
  it("covers exactly the 19 fixture tables in fixture order", () => {
    expect(fixtureTableNames).toHaveLength(19);
    expect(SQL_PROJECT_TABLES.map((table) => table.name)).toEqual(
      fixtureTableNames,
    );
  });

  it("matches every fixture column name and base type in order", () => {
    for (const table of SQL_PROJECT_TABLES) {
      const expected = fixtureTables.get(table.name);
      expect(expected, `missing fixture table ${table.name}`).toBeDefined();
      expect(
        table.columns.map((column) => ({
          name: column.name,
          type: column.type,
        })),
        `column drift in ${table.name}`,
      ).toEqual(expected);
    }
  });

  it("records the seeded row count for every table", () => {
    const expected = [
      ["categories", 8],
      ["vendors", 6],
      ["customers", 6],
      ["products", 14],
      ["orders", 10],
      ["order_items", 15],
      ["reviews", 6],
      ["referrals", 5],
      ["product_attributes", 14],
      ["product_variants", 12],
      ["payments", 11],
      ["shipments", 8],
      ["returns", 4],
      ["coupons", 4],
      ["coupon_redemptions", 6],
      ["carts", 8],
      ["cart_items", 15],
      ["inventory_movements", 33],
      ["vendor_payouts", 5],
    ] as const;

    for (const [table, count] of expected) {
      expect(countSeedRows(fixtureSql, table), `seed rows in ${table}`).toBe(
        count,
      );
      const entry = SQL_PROJECT_TABLES.find((item) => item.name === table);
      expect(entry?.rowCount, `rowCount for ${table}`).toBe(count);
    }
  });

  it("ships the student download as a byte-identical fixture copy", () => {
    const download = readFileSync("public/learning/shopsphere.sql");
    expect(download.equals(readFileSync("judge/shopsphere.sql"))).toBe(true);
  });
});

describe("ShopSphere project epics", () => {
  it("ships the seven squads in order with unique prefixes", () => {
    expect(SQL_PROJECT_EPICS.map((epic) => epic.slug)).toEqual([
      "catalog-health",
      "order-desk",
      "fulfillment",
      "vendor-finance",
      "growth",
      "analytics-platform",
      "platform-quality",
    ]);
    expect(new Set(SQL_PROJECT_EPICS.map((epic) => epic.ticketPrefix)).size).toBe(
      7,
    );
  });

  it("assigns every curriculum topic to exactly one epic", () => {
    const owners = new Map<string, number>();
    for (const epic of SQL_PROJECT_EPICS) {
      for (const slug of epic.topicSlugs) {
        expect(topicModule.has(slug), `unknown topic ${slug}`).toBe(true);
        owners.set(slug, (owners.get(slug) ?? 0) + 1);
      }
      const derivedTracks = [
        ...new Set(
          epic.topicSlugs.map((slug) => {
            const moduleSlug = topicModule.get(slug);
            return moduleSlug === "advanced-sql" ? "advanced-sql" : "basic-sql";
          }),
        ),
      ].sort();
      expect([...epic.tracks].sort(), `tracks in ${epic.slug}`).toEqual(
        derivedTracks,
      );
    }
    expect([...owners.keys()].sort()).toEqual([...topicSlugs].sort());
    expect([...owners.values()].every((count) => count === 1)).toBe(true);
  });

  it("references only real tables and metric ids", () => {
    const tableNames = new Set(fixtureTableNames);
    const metricIds = new Set(SQL_PROJECT_METRICS.map((metric) => metric.id));
    for (const epic of SQL_PROJECT_EPICS) {
      expect(epic.metricIds.length, `metrics in ${epic.slug}`).toBeGreaterThan(
        0,
      );
      for (const table of epic.tables) {
        expect(tableNames.has(table), `${epic.slug} uses ${table}`).toBe(true);
      }
      for (const metricId of epic.metricIds) {
        expect(metricIds.has(metricId), `${epic.slug} uses ${metricId}`).toBe(
          true,
        );
      }
      expect(epic.acceptance.length).toBeGreaterThanOrEqual(3);
    }
  });

  it("derives each epic's table list from the dictionary used-by lists", () => {
    for (const epic of SQL_PROJECT_EPICS) {
      const expected = SQL_PROJECT_TABLES.filter((table) =>
        table.usedByEpicSlugs.includes(epic.slug),
      )
        .map((table) => table.name)
        .sort();
      expect([...epic.tables].sort(), epic.slug).toEqual(expected);
    }
  });

  it("marks every table as used by at least one real epic", () => {
    const epicSlugs = new Set(SQL_PROJECT_EPICS.map((epic) => epic.slug));
    for (const table of SQL_PROJECT_TABLES) {
      expect(
        table.usedByEpicSlugs.length,
        `${table.name} has no epic`,
      ).toBeGreaterThan(0);
      for (const epicSlug of table.usedByEpicSlugs) {
        expect(epicSlugs.has(epicSlug), `${table.name} -> ${epicSlug}`).toBe(
          true,
        );
      }
    }
  });
});

describe("ShopSphere project tickets", () => {
  const tickets = Object.values(SQL_PROJECT_TICKETS);

  it("ships exactly one ticket per curriculum topic", () => {
    expect(Object.keys(SQL_PROJECT_TICKETS).sort()).toEqual(
      [...topicSlugs].sort(),
    );
    expect(tickets).toHaveLength(23);
    expect(dupes(tickets.map((ticket) => ticket.id))).toEqual([]);
  });

  it("keeps ticket topic, module and epic aligned", () => {
    for (const [topicSlug, ticket] of Object.entries(SQL_PROJECT_TICKETS)) {
      expect(ticket.topicSlug, ticket.id).toBe(topicSlug);
      expect(ticket.moduleSlug, ticket.id).toBe(topicModule.get(topicSlug));
      const epic = SQL_PROJECT_EPICS.find(
        (item) => item.slug === ticket.epicSlug,
      );
      expect(epic, `${ticket.id} epic`).toBeDefined();
      expect(epic?.topicSlugs, `${ticket.id} topic in epic`).toContain(
        topicSlug,
      );
      expect(ticket.id.startsWith(`${epic?.ticketPrefix}-`), ticket.id).toBe(
        true,
      );
      expect(ticket.acceptance.length, ticket.id).toBeGreaterThanOrEqual(2);
      for (const table of ticket.tables) {
        expect(fixtureTables.has(table), `${ticket.id} uses ${table}`).toBe(
          true,
        );
      }
    }
  });

  it("uses only tables that belong to the ticket's epic", () => {
    for (const ticket of tickets) {
      const epic = SQL_PROJECT_EPICS.find(
        (item) => item.slug === ticket.epicSlug,
      );
      expect(epic, `${ticket.id} epic`).toBeDefined();
      for (const table of ticket.tables) {
        expect(epic?.tables, `${ticket.id} uses ${table}`).toContain(table);
      }
    }
  });

  it("points every deliverable at a real judge problem", () => {
    for (const ticket of tickets) {
      expect(ticket.deliverableProblemSlugs.length, ticket.id).toBe(2);
      for (const slug of ticket.deliverableProblemSlugs) {
        expect(problemSlugs.has(slug), `${ticket.id} -> ${slug}`).toBe(true);
      }
    }
  });

  it("covers the same deliverables as the lesson's guided problems", () => {
    for (const definition of sqlModules) {
      for (const topic of definition.topics) {
        const ticket = SQL_PROJECT_TICKETS[topic.slug];
        expect(ticket, `missing ticket for ${topic.slug}`).toBeDefined();
        expect(ticket.deliverableProblemSlugs, topic.slug).toEqual(
          topic.guidedProblemSlugs,
        );
      }
    }
  });
});

describe("ShopSphere metric catalog", () => {
  it("defines unique metrics over real tables", () => {
    expect(SQL_PROJECT_METRICS.length).toBeGreaterThanOrEqual(8);
    expect(dupes(SQL_PROJECT_METRICS.map((metric) => metric.id))).toEqual([]);
    for (const metric of SQL_PROJECT_METRICS) {
      expect(metric.definition.length, metric.id).toBeGreaterThan(20);
      expect(metric.formula.length, metric.id).toBeGreaterThan(10);
      for (const table of metric.tables) {
        expect(fixtureTables.has(table), `${metric.id} uses ${table}`).toBe(
          true,
        );
      }
    }
  });

  it("covers the metrics the squads report on", () => {
    const ids = new Set(SQL_PROJECT_METRICS.map((metric) => metric.id));
    for (const required of [
      "gmv",
      "collected-revenue",
      "aov",
      "discount-cost",
      "refund-rate",
      "repeat-rate",
      "cart-conversion",
      "dead-stock",
      "payout-variance",
      "retention",
    ]) {
      expect(ids.has(required), required).toBe(true);
    }
  });
});

describe("ShopSphere handover", () => {
  it("references only real topics and problems", () => {
    expect(SQL_PROJECT_HANDOVER.length).toBeGreaterThanOrEqual(10);
    expect(dupes(SQL_PROJECT_HANDOVER.map((item) => item.id))).toEqual([]);
    for (const item of SQL_PROJECT_HANDOVER) {
      expect(item.topicSlugs.length, item.id).toBeGreaterThan(0);
      expect(item.problemSlugs.length, item.id).toBeGreaterThan(0);
      for (const slug of item.topicSlugs) {
        expect(topicModule.has(slug), `${item.id} -> ${slug}`).toBe(true);
      }
      for (const slug of item.problemSlugs) {
        expect(problemSlugs.has(slug), `${item.id} -> ${slug}`).toBe(true);
      }
    }
  });
});
