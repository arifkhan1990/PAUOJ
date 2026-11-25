import { sql } from "drizzle-orm";
import {
  boolean,
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

/**
 * One row per outbound broadcast. `sourceKey` makes contest/module marketing
 * and manual announcements idempotent, `completedAt` records that the fan-out
 * finished, and the stored title/body give the admin page a real history.
 */
export const broadcasts = pgTable(
  "broadcasts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    kind: text("kind").notNull(),
    sourceKey: text("source_key").notNull(),
    title: text("title").notNull(),
    body: text("body").notNull(),
    href: text("href"),
    createdBy: uuid("created_by").references(() => users.id, {
      onDelete: "set null",
    }),
    /** Migration-seeded history marker, not a real delivery. */
    baseline: boolean("baseline").notNull().default(false),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("broadcasts_source_key_unique").on(table.sourceKey),
    index("broadcasts_created_idx").on(table.createdAt),
    index("broadcasts_pending_idx")
      .on(table.createdAt)
      .where(sql`${table.completedAt} is null`),
  ],
);

export type Notification = typeof notifications.$inferSelect;
export type Broadcast = typeof broadcasts.$inferSelect;
