import { sql } from "drizzle-orm";
import {
  check,
  index,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { users } from "./auth";

/**
 * Two-person direct messages. `userAId` is always the lexicographically
 * smaller UUID so a pair can only ever have one conversation row.
 */
export const conversations = pgTable(
  "conversations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userAId: uuid("user_a_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    userBId: uuid("user_b_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    lastMessageAt: timestamp("last_message_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("conversations_pair_unique").on(table.userAId, table.userBId),
    check("conversations_pair_order_check", sql`${table.userAId} < ${table.userBId}`),
    index("conversations_user_a_last_idx").on(
      table.userAId,
      table.lastMessageAt,
    ),
    index("conversations_user_b_last_idx").on(
      table.userBId,
      table.lastMessageAt,
    ),
  ],
);

export type Conversation = typeof conversations.$inferSelect;

export const messages = pgTable(
  "messages",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    conversationId: uuid("conversation_id")
      .notNull()
      .references(() => conversations.id, { onDelete: "cascade" }),
    senderId: uuid("sender_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    body: text("body").notNull(),
    readAt: timestamp("read_at", { withTimezone: true }),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    check(
      "messages_body_check",
      sql`char_length(${table.body}) between 1 and 2000`,
    ),
    index("messages_conversation_created_idx").on(
      table.conversationId,
      table.createdAt,
    ),
    index("messages_conversation_unread_idx")
      .on(table.conversationId, table.createdAt)
      .where(sql`${table.readAt} is null`),
    index("messages_sender_created_idx").on(table.senderId, table.createdAt),
    index("messages_created_idx").on(table.createdAt),
  ],
);

export type Message = typeof messages.$inferSelect;

/** Per-user mute: suppresses unread badges and new-message notices. */
export const conversationMutes = pgTable(
  "conversation_mutes",
  {
    conversationId: uuid("conversation_id")
      .notNull()
      .references(() => conversations.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    primaryKey({ columns: [table.conversationId, table.userId] }),
    index("conversation_mutes_user_idx").on(table.userId, table.createdAt),
  ],
);

export type ConversationMute = typeof conversationMutes.$inferSelect;
