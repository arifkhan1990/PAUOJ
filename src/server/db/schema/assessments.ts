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

export const assessments = pgTable(
  "assessments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: text("slug").notNull(),
    title: text("title").notNull(),
    description: text("description").notNull(),
    accessCode: text("access_code").notNull(),
    startAt: timestamp("start_at", { withTimezone: true }).notNull(),
    endAt: timestamp("end_at", { withTimezone: true }).notNull(),
    durationMinutes: integer("duration_minutes"),
    isPublished: boolean("is_published").notNull().default(false),
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
    uniqueIndex("assessments_slug_unique").on(table.slug),
    uniqueIndex("assessments_access_code_unique").on(table.accessCode),
    index("assessments_start_idx").on(table.startAt),
    index("assessments_end_idx").on(table.endAt),
    index("assessments_published_idx").on(table.isPublished),
  ],
);

export const assessmentProblems = pgTable(
  "assessment_problems",
  {
    assessmentId: uuid("assessment_id")
      .notNull()
      .references(() => assessments.id, { onDelete: "cascade" }),
    problemId: uuid("problem_id")
      .notNull()
      .references(() => problems.id, { onDelete: "cascade" }),
    label: text("label").notNull(),
    position: text("position").notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.assessmentId, table.problemId] }),
    uniqueIndex("assessment_problems_label_unique").on(
      table.assessmentId,
      table.label,
    ),
    uniqueIndex("assessment_problems_position_unique").on(
      table.assessmentId,
      table.position,
    ),
    index("assessment_problems_problem_idx").on(table.problemId),
  ],
);

export const assessmentParticipants = pgTable(
  "assessment_participants",
  {
    assessmentId: uuid("assessment_id")
      .notNull()
      .references(() => assessments.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    startedAt: timestamp("started_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    finishedAt: timestamp("finished_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    primaryKey({ columns: [table.assessmentId, table.userId] }),
    index("assessment_participants_user_idx").on(table.userId),
    index("assessment_participants_expires_idx").on(table.expiresAt),
  ],
);

export type Assessment = typeof assessments.$inferSelect;
export type AssessmentProblem = typeof assessmentProblems.$inferSelect;
export type AssessmentParticipant = typeof assessmentParticipants.$inferSelect;
