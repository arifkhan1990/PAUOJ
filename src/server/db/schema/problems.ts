import {
  boolean,
  index,
  integer,
  pgEnum,
  pgTable,
  primaryKey,
  real,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { users } from "./auth";

export const problemDifficultyEnum = pgEnum("problem_difficulty", [
  "EASY",
  "MEDIUM",
  "HARD",
  "EXPERT",
]);

export const problemCheckerEnum = pgEnum("problem_checker", [
  "EXACT",
  "TOKEN",
  "FLOAT",
  "CUSTOM",
]);

export const problems = pgTable(
  "problems",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: text("slug").notNull(),
    title: text("title").notNull(),
    statement: text("statement").notNull(),
    inputFormat: text("input_format"),
    outputFormat: text("output_format"),
    constraints: text("constraints"),
    editorial: text("editorial"),
    category: text("category"),
    subcategory: text("subcategory"),
    companies: text("companies").array().notNull().default([]),
    checkerType: problemCheckerEnum("checker_type").notNull().default("EXACT"),
    checkerSource: text("checker_source"),
    floatTolerance: real("float_tolerance").notNull().default(0.000001),
    difficulty: problemDifficultyEnum("difficulty").notNull().default("EASY"),
    points: integer("points").notNull().default(100),
    timeLimitMs: integer("time_limit_ms").notNull().default(1000),
    memoryLimitMb: integer("memory_limit_mb").notNull().default(256),
    isPublic: boolean("is_public").notNull().default(true),
    authorId: uuid("author_id").references(() => users.id, {
      onDelete: "set null",
    }),
    acceptedCount: integer("accepted_count").notNull().default(0),
    submissionCount: integer("submission_count").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("problems_slug_unique").on(table.slug),
    index("problems_difficulty_idx").on(table.difficulty),
    index("problems_public_idx").on(table.isPublic),
    index("problems_category_idx").on(table.category, table.subcategory),
    index("problems_companies_idx").using("gin", table.companies),
  ],
);

export const testCases = pgTable(
  "test_cases",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    problemId: uuid("problem_id")
      .notNull()
      .references(() => problems.id, { onDelete: "cascade" }),
    input: text("input").notNull(),
    expectedOutput: text("expected_output").notNull(),
    isSample: boolean("is_sample").notNull().default(false),
    position: integer("position").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("test_cases_problem_position_unique").on(
      table.problemId,
      table.position,
    ),
    index("test_cases_problem_idx").on(table.problemId),
  ],
);

export const tags = pgTable(
  "tags",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
  },
  (table) => [uniqueIndex("tags_slug_unique").on(table.slug)],
);

export const problemTags = pgTable(
  "problem_tags",
  {
    problemId: uuid("problem_id")
      .notNull()
      .references(() => problems.id, { onDelete: "cascade" }),
    tagId: uuid("tag_id")
      .notNull()
      .references(() => tags.id, { onDelete: "cascade" }),
  },
  (table) => [
    primaryKey({ columns: [table.problemId, table.tagId] }),
    index("problem_tags_tag_idx").on(table.tagId),
  ],
);

export type Problem = typeof problems.$inferSelect;
export type TestCase = typeof testCases.$inferSelect;
export type ProblemDifficulty = Problem["difficulty"];
