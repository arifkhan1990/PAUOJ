import { sql } from "drizzle-orm";
import {
  index,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { users } from "./auth";

export const notifications = pgTable(
  "notifications",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    title: text("title").notNull(),
    body: text("body").notNull(),
    href: text("href"),
    dedupeKey: text("dedupe_key"),
    readAt: timestamp("read_at", { withTimezone: true }),
    emailedAt: timestamp("emailed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("notifications_user_dedupe_unique").on(
      table.userId,
      table.dedupeKey,
    ),
    index("notifications_user_created_idx").on(
      table.userId,
      table.createdAt,
    ),
    index("notifications_user_read_idx").on(table.userId, table.readAt),
    index("notifications_review_digest_idx")
      .on(table.createdAt)
      .where(
        sql`${table.emailedAt} is null and ${table.type} in ('CONTRIBUTION', 'CONTEST_APPROVAL')`,
      ),
  ],
);

export type Notification = typeof notifications.$inferSelect;
