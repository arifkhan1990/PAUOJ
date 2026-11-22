import {
  index,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { users } from "./auth";

export const learningCheckpointAttempts = pgTable(
  "learning_checkpoint_attempts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    moduleSlug: text("module_slug").notNull(),
    startedAt: timestamp("started_at", { withTimezone: true }).notNull(),
    endsAt: timestamp("ends_at", { withTimezone: true }).notNull(),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("learning_checkpoint_attempts_user_module_unique").on(
      table.userId,
      table.moduleSlug,
    ),
    index("learning_checkpoint_attempts_user_idx").on(table.userId),
  ],
);

export type LearningCheckpointAttempt =
  typeof learningCheckpointAttempts.$inferSelect;
