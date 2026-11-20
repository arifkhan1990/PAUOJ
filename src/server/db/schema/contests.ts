import {
  boolean,
  index,
  integer,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { users } from "./auth";
import { problems } from "./problems";

export const contestDivisionEnum = pgEnum("contest_division", [
  "OPEN",
  "DIV1",
  "DIV2",
  "DIV3",
  "DIV4",
]);

export const contests = pgTable(
  "contests",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: text("slug").notNull(),
    title: text("title").notNull(),
    description: text("description").notNull(),
    startAt: timestamp("start_at", { withTimezone: true }).notNull(),
    endAt: timestamp("end_at", { withTimezone: true }).notNull(),
    isPublic: boolean("is_public").notNull().default(true),
    division: contestDivisionEnum("division").notNull().default("OPEN"),
    freezeMinutes: integer("freeze_minutes").notNull().default(0),
    createdBy: uuid("created_by").references(() => users.id, {
      onDelete: "set null",
    }),
    ratedAt: timestamp("rated_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("contests_slug_unique").on(table.slug),
    index("contests_start_idx").on(table.startAt),
    index("contests_end_idx").on(table.endAt),
  ],
);

export const contestProblems = pgTable(
  "contest_problems",
  {
    contestId: uuid("contest_id")
      .notNull()
      .references(() => contests.id, { onDelete: "cascade" }),
    problemId: uuid("problem_id")
      .notNull()
      .references(() => problems.id, { onDelete: "cascade" }),
    label: text("label").notNull(),
    position: text("position").notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.contestId, table.problemId] }),
    uniqueIndex("contest_problems_label_unique").on(
      table.contestId,
      table.label,
    ),
    uniqueIndex("contest_problems_position_unique").on(
      table.contestId,
      table.position,
    ),
    index("contest_problems_problem_idx").on(table.problemId),
  ],
);

export const contestRegistrations = pgTable(
  "contest_registrations",
  {
    contestId: uuid("contest_id")
      .notNull()
      .references(() => contests.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    primaryKey({ columns: [table.contestId, table.userId] }),
    index("contest_registrations_user_idx").on(table.userId),
  ],
);

export const contestClarifications = pgTable(
  "contest_clarifications",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    contestId: uuid("contest_id")
      .notNull()
      .references(() => contests.id, { onDelete: "cascade" }),
    problemId: uuid("problem_id").references(() => problems.id, {
      onDelete: "set null",
    }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    question: text("question").notNull(),
    answer: text("answer"),
    answeredById: uuid("answered_by_id").references(() => users.id, {
      onDelete: "set null",
    }),
    answeredAt: timestamp("answered_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("contest_clarifications_contest_created_idx").on(
      table.contestId,
      table.createdAt,
    ),
    index("contest_clarifications_problem_idx").on(table.problemId),
    index("contest_clarifications_user_idx").on(table.userId),
  ],
);

export const contestRatingChanges = pgTable(
  "contest_rating_changes",
  {
    contestId: uuid("contest_id")
      .notNull()
      .references(() => contests.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    rank: integer("rank").notNull(),
    oldRating: integer("old_rating").notNull(),
    newRating: integer("new_rating").notNull(),
    delta: integer("delta").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    primaryKey({ columns: [table.contestId, table.userId] }),
    index("contest_rating_changes_user_created_idx").on(
      table.userId,
      table.createdAt,
    ),
  ],
);

export const virtualContests = pgTable(
  "virtual_contests",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    contestId: uuid("contest_id")
      .notNull()
      .references(() => contests.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    startedAt: timestamp("started_at", { withTimezone: true }).notNull(),
    endsAt: timestamp("ends_at", { withTimezone: true }).notNull(),
    finishedAt: timestamp("finished_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("virtual_contests_contest_user_unique").on(
      table.contestId,
      table.userId,
    ),
    index("virtual_contests_user_idx").on(table.userId),
  ],
);

export type Contest = typeof contests.$inferSelect;
export type VirtualContest = typeof virtualContests.$inferSelect;
export type ContestProblem = typeof contestProblems.$inferSelect;
export type ContestClarification = typeof contestClarifications.$inferSelect;
export type ContestRatingChange = typeof contestRatingChanges.$inferSelect;
