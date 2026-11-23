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

export const lessonReactions = pgTable(
  "lesson_reactions",
  {
    moduleSlug: text("module_slug").notNull(),
    topicSlug: text("topic_slug").notNull(),
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
    primaryKey({ columns: [table.moduleSlug, table.topicSlug, table.userId] }),
    check(
      "lesson_reactions_value_check",
      sql`${table.value} in (-1, 1)`,
    ),
    index("lesson_reactions_topic_idx").on(table.moduleSlug, table.topicSlug),
  ],
);

export const lessonComments = pgTable(
  "lesson_comments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    moduleSlug: text("module_slug").notNull(),
    topicSlug: text("topic_slug").notNull(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    parentId: uuid("parent_id").references((): AnyPgColumn => lessonComments.id, {
      onDelete: "cascade",
    }),
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
    index("lesson_comments_topic_created_idx").on(
      table.moduleSlug,
      table.topicSlug,
      table.createdAt,
    ),
    index("lesson_comments_topic_parent_created_idx").on(
      table.moduleSlug,
      table.topicSlug,
      table.parentId,
      table.createdAt,
    ),
    index("lesson_comments_parent_idx").on(table.parentId),
    index("lesson_comments_user_idx").on(table.userId),
  ],
);

export const lessonCommentVotes = pgTable(
  "lesson_comment_votes",
  {
    commentId: uuid("comment_id")
      .notNull()
      .references(() => lessonComments.id, { onDelete: "cascade" }),
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
    index("lesson_comment_votes_user_idx").on(table.userId),
    check(
      "lesson_comment_votes_value_check",
      sql`${table.value} in (-1, 1)`,
    ),
  ],
);

export const lessonCommentReports = pgTable(
  "lesson_comment_reports",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    commentId: uuid("comment_id")
      .notNull()
      .references(() => lessonComments.id, { onDelete: "cascade" }),
    reporterId: uuid("reporter_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    reason: text("reason").notNull(),
    status: text("status").notNull().default("OPEN"),
    resolvedAt: timestamp("resolved_at", { withTimezone: true }),
    resolvedBy: uuid("resolved_by").references(() => users.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("lesson_comment_reports_comment_reporter_unique").on(
      table.commentId,
      table.reporterId,
    ),
    index("lesson_comment_reports_comment_idx").on(table.commentId),
    index("lesson_comment_reports_reporter_idx").on(table.reporterId),
    index("lesson_comment_reports_status_created_idx").on(
      table.status,
      table.createdAt,
    ),
    check(
      "lesson_comment_reports_status_check",
      sql`${table.status} in ('OPEN', 'RESOLVED')`,
    ),
  ],
);

export const paymentOrders = pgTable(
  "payment_orders",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    kind: text("kind").notNull().default("PURCHASE"),
    product: text("product").notNull(),
    moduleSlug: text("module_slug"),
    amountBdt: integer("amount_bdt").notNull(),
    trxId: text("trx_id"),
    senderNumber: text("sender_number"),
    userNote: text("user_note"),
    status: text("status").notNull().default("PENDING"),
    adminNote: text("admin_note"),
    reviewedBy: uuid("reviewed_by").references(() => users.id, {
      onDelete: "set null",
    }),
    reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("payment_orders_trx_id_unique").on(table.trxId),
    index("payment_orders_status_created_idx").on(table.status, table.createdAt),
    index("payment_orders_user_idx").on(table.userId, table.createdAt),
    check(
      "payment_orders_kind_check",
      sql`${table.kind} in ('PURCHASE', 'FREE_REQUEST')`,
    ),
    check(
      "payment_orders_product_check",
      sql`${table.product} in ('MODULE', 'BUNDLE')`,
    ),
    check(
      "payment_orders_status_check",
      sql`${table.status} in ('PENDING', 'APPROVED', 'REJECTED', 'REVOKED')`,
    ),
    check(
      "payment_orders_amount_check",
      sql`${table.amountBdt} >= 0`,
    ),
  ],
);

export const lessonEntitlements = pgTable(
  "lesson_entitlements",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    moduleSlug: text("module_slug").notNull(),
    source: text("source").notNull(),
    orderId: uuid("order_id").references(() => paymentOrders.id, {
      onDelete: "set null",
    }),
    grantedBy: uuid("granted_by").references(() => users.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("lesson_entitlements_user_module_unique").on(
      table.userId,
      table.moduleSlug,
    ),
    index("lesson_entitlements_user_idx").on(table.userId),
    check(
      "lesson_entitlements_source_check",
      sql`${table.source} in ('PURCHASE', 'SCHOLARSHIP')`,
    ),
  ],
);

export type LearningCheckpointAttempt =
  typeof learningCheckpointAttempts.$inferSelect;
export type LessonReaction = typeof lessonReactions.$inferSelect;
export type LessonComment = typeof lessonComments.$inferSelect;
export type LessonCommentVote = typeof lessonCommentVotes.$inferSelect;
export type LessonCommentReport = typeof lessonCommentReports.$inferSelect;
export type PaymentOrder = typeof paymentOrders.$inferSelect;
export type LessonEntitlement = typeof lessonEntitlements.$inferSelect;
