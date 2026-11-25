import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  index,
  integer,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { users } from "./auth";
import { problems } from "./problems";

export const problemResources = pgTable(
  "problem_resources",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    problemId: uuid("problem_id")
      .notNull()
      .references(() => problems.id, { onDelete: "cascade" }),
    createdById: uuid("created_by_id").references(() => users.id, {
      onDelete: "set null",
    }),
    title: text("title").notNull(),
    url: text("url").notNull(),
    description: text("description"),
    isVerified: boolean("is_verified").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("problem_resources_problem_created_idx").on(
      table.problemId,
      table.createdAt,
    ),
  ],
);

export const problemReferenceSolutions = pgTable(
  "problem_reference_solutions",
  {
    problemId: uuid("problem_id")
      .primaryKey()
      .references(() => problems.id, { onDelete: "cascade" }),
    language: text("language").notNull(),
    source: text("source").notNull(),
    /** SQL script labs need the multi-statement runner. */
    script: boolean("script").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
);

export const problemRatings = pgTable(
  "problem_ratings",
  {
    problemId: uuid("problem_id")
      .notNull()
      .references(() => problems.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    value: integer("value").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    primaryKey({ columns: [table.problemId, table.userId] }),
    index("problem_ratings_user_idx").on(table.userId),
    check(
      "problem_ratings_value_check",
      sql`${table.value} between 1 and 10`,
    ),
  ],
);

export type ProblemResource = typeof problemResources.$inferSelect;
export type ProblemReferenceSolution =
  typeof problemReferenceSolutions.$inferSelect;
export type ProblemRating = typeof problemRatings.$inferSelect;
