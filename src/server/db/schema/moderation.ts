import { sql } from "drizzle-orm";
import {
  index,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { users } from "./auth";
import { conversations, messages } from "./messaging";

export const socialReportKindEnum = pgEnum("social_report_kind", [
  "MESSAGE",
  "CONVERSATION",
  "FOLLOW_REQUEST",
  "PROFILE",
]);

export const socialReportReasonEnum = pgEnum("social_report_reason", [
  "SPAM",
  "HARASSMENT",
  "HATE",
  "SCAM",
  "IMPERSONATION",
  "OTHER",
]);

export const socialReportStatusEnum = pgEnum("social_report_status", [
  "OPEN",
  "RESOLVED",
  "DISMISSED",
]);

export const socialReports = pgTable(
  "social_reports",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    reporterId: uuid("reporter_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    targetUserId: uuid("target_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    kind: socialReportKindEnum("kind").notNull(),
    reason: socialReportReasonEnum("reason").notNull(),
    details: text("details"),
    excerpt: text("excerpt"),
    conversationId: uuid("conversation_id").references(
      () => conversations.id,
      { onDelete: "set null" },
    ),
    messageId: uuid("message_id").references(() => messages.id, {
      onDelete: "set null",
    }),
    status: socialReportStatusEnum("status").notNull().default("OPEN"),
    resolvedById: uuid("resolved_by_id").references(() => users.id, {
      onDelete: "set null",
    }),
    resolvedAt: timestamp("resolved_at", { withTimezone: true }),
    resolutionNote: text("resolution_note"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("social_reports_status_created_idx").on(
      table.status,
      table.createdAt,
    ),
    index("social_reports_target_idx").on(table.targetUserId, table.createdAt),
    index("social_reports_reporter_idx").on(
      table.reporterId,
      table.createdAt,
    ),
    index("social_reports_open_kind_idx")
      .on(table.kind, table.createdAt)
      .where(sql`${table.status} = 'OPEN'`),
  ],
);

export type SocialReport = typeof socialReports.$inferSelect;
