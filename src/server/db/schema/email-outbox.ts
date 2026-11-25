import { sql } from "drizzle-orm";
import {
  check,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { users } from "./auth";

/**
 * Durable notification-email queue. `notifyUser` writes one row per email and
 * the worker retries it with backoff, so a transient SMTP failure no longer
 * loses the mail. `dedupeKey` makes enqueue idempotent per notification or
 * per email-only broadcast recipient.
 */
export const emailOutbox = pgTable(
  "email_outbox",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    toEmail: text("to_email").notNull(),
    displayName: text("display_name").notNull(),
    subject: text("subject").notNull(),
    body: text("body").notNull(),
    href: text("href"),
    unsubscribeUrl: text("unsubscribe_url").notNull(),
    dedupeKey: text("dedupe_key").notNull(),
    status: text("status").notNull().default("PENDING"),
    attempts: integer("attempts").notNull().default(0),
    lastError: text("last_error"),
    nextAttemptAt: timestamp("next_attempt_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    sentAt: timestamp("sent_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("email_outbox_dedupe_unique").on(table.dedupeKey),
    index("email_outbox_pending_idx").on(table.status, table.nextAttemptAt),
    index("email_outbox_user_idx").on(table.userId, table.createdAt),
    check(
      "email_outbox_status_check",
      sql`${table.status} in ('PENDING', 'SENDING', 'SENT', 'FAILED')`,
    ),
    check(
      "email_outbox_attempts_check",
      sql`${table.attempts} >= 0 and ${table.attempts} <= 10`,
    ),
  ],
);

export type EmailOutboxRow = typeof emailOutbox.$inferSelect;
