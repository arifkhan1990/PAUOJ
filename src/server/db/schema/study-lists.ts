import {
  boolean,
  index,
  integer,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { users } from "./auth";
import { problems } from "./problems";

export const studyLists = pgTable(
  "study_lists",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: text("slug").notNull(),
    title: text("title").notNull(),
    description: text("description").notNull(),
    isPublic: boolean("is_public").notNull().default(true),
    createdBy: uuid("created_by").references(() => users.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [uniqueIndex("study_lists_slug_unique").on(table.slug)],
);

export const studyListItems = pgTable(
  "study_list_items",
  {
    listId: uuid("list_id")
      .notNull()
      .references(() => studyLists.id, { onDelete: "cascade" }),
    problemId: uuid("problem_id")
      .notNull()
      .references(() => problems.id, { onDelete: "cascade" }),
    position: integer("position").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    primaryKey({ columns: [table.listId, table.problemId] }),
    uniqueIndex("study_list_items_position_unique").on(
      table.listId,
      table.position,
    ),
    index("study_list_items_problem_idx").on(table.problemId),
  ],
);

export type StudyList = typeof studyLists.$inferSelect;
export type StudyListItem = typeof studyListItems.$inferSelect;
