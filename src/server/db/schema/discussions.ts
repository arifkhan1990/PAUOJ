import { sql } from "drizzle-orm";
import {
  check,
  index,
  integer,
  pgTable,
  primaryKey,
  text,
  timestamp,
  type AnyPgColumn,
  uuid,
} from "drizzle-orm/pg-core";
import { users } from "./auth";
import { problems } from "./problems";

export const problemComments = pgTable(
  "problem_comments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    problemId: uuid("problem_id")
      .notNull()
      .references(() => problems.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    parentId: uuid("parent_id").references(
      (): AnyPgColumn => problemComments.id,
      { onDelete: "cascade" },
    ),
    body: text("body").notNull(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("problem_comments_problem_created_idx").on(
      table.problemId,
      table.createdAt,
    ),
    index("problem_comments_parent_idx").on(table.parentId),
    index("problem_comments_user_idx").on(table.userId),
  ],
);

export const problemCommentVotes = pgTable(
  "problem_comment_votes",
  {
    commentId: uuid("comment_id")
      .notNull()
      .references(() => problemComments.id, { onDelete: "cascade" }),
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
    primaryKey({ columns: [table.commentId, table.userId] }),
    index("problem_comment_votes_user_idx").on(table.userId),
    check(
      "problem_comment_votes_value_check",
      sql`${table.value} in (-1, 1)`,
    ),
  ],
);

export type ProblemComment = typeof problemComments.$inferSelect;
export type ProblemCommentVote = typeof problemCommentVotes.$inferSelect;
