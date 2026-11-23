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
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import type { StudyListLevel } from "@/lib/study-list-types";
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
    level: text("level").$type<StudyListLevel>().notNull().default("BEGINNER"),
    estimatedMinutes: integer("estimated_minutes"),
    isFeatured: boolean("is_featured").notNull().default(false),
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
  (table) => [
    uniqueIndex("study_lists_slug_unique").on(table.slug),
    check(
      "study_lists_level_check",
      sql`${table.level} in ('BEGINNER', 'INTERMEDIATE', 'ADVANCED')`,
    ),
    check(
      "study_lists_estimated_minutes_check",
      sql`${table.estimatedMinutes} is null or ${table.estimatedMinutes} > 0`,
    ),
  ],
);

export const studyListSections = pgTable(
  "study_list_sections",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    listId: uuid("list_id")
      .notNull()
      .references(() => studyLists.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    description: text("description").notNull().default(""),
    position: integer("position").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("study_list_sections_position_unique").on(
      table.listId,
      table.position,
    ),
    index("study_list_sections_list_idx").on(table.listId),
  ],
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
    sectionId: uuid("section_id").references(() => studyListSections.id, {
      onDelete: "set null",
    }),
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
    index("study_list_items_section_idx").on(table.sectionId),
  ],
);

export const studyListEnrollments = pgTable(
  "study_list_enrollments",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    listId: uuid("list_id")
      .notNull()
      .references(() => studyLists.id, { onDelete: "cascade" }),
    startedAt: timestamp("started_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    primaryKey({ columns: [table.userId, table.listId] }),
    index("study_list_enrollments_list_idx").on(table.listId),
  ],
);

/** Private per-learner notes attached to one problem inside one plan. */
export const studyListItemNotes = pgTable(
  "study_list_item_notes",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    listId: uuid("list_id")
      .notNull()
      .references(() => studyLists.id, { onDelete: "cascade" }),
    problemId: uuid("problem_id")
      .notNull()
      .references(() => problems.id, { onDelete: "cascade" }),
    body: text("body").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    primaryKey({ columns: [table.userId, table.listId, table.problemId] }),
    index("study_list_item_notes_list_idx").on(table.listId),
    index("study_list_item_notes_user_idx").on(table.userId),
  ],
);

export type StudyList = typeof studyLists.$inferSelect;
export type StudyListSection = typeof studyListSections.$inferSelect;
export type StudyListItem = typeof studyListItems.$inferSelect;
export type StudyListEnrollment = typeof studyListEnrollments.$inferSelect;
export type StudyListItemNote = typeof studyListItemNotes.$inferSelect;
