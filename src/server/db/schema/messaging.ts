import { sql } from "drizzle-orm";
import {
  check,
  customType,
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

/** Same bytea mapping as the avatar table, kept local to this module. */
const bytea = customType<{ data: Buffer; driverData: Buffer }>({
  dataType() {
    return "bytea";
  },
});

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
      sql`char_length(${table.body}) between 0 and 2000`,
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

export const MESSAGE_ATTACHMENT_KINDS = ["IMAGE", "DOCUMENT"] as const;
export type MessageAttachmentKind = (typeof MESSAGE_ATTACHMENT_KINDS)[number];

/**
 * At most one attachment per message, either an image or a document. Bytes
 * stay in Postgres behind an auth-checked route; the row is removed with its
 * message. Images keep pixel dimensions, documents keep their sanitized name
 * and byte size so previews never need to load the payload.
 */
export const messageAttachments = pgTable(
  "message_attachments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    messageId: uuid("message_id")
      .notNull()
      .unique()
      .references(() => messages.id, { onDelete: "cascade" }),
    kind: text("kind")
      .$type<MessageAttachmentKind>()
      .notNull()
      .default("IMAGE"),
    mime: text("mime").notNull(),
    width: integer("width"),
    height: integer("height"),
    fileName: text("file_name"),
    sizeBytes: integer("size_bytes").notNull().default(0),
    bytes: bytea("bytes").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    check(
      "message_attachments_kind_check",
      sql`${table.kind} in ('IMAGE', 'DOCUMENT')`,
    ),
    check(
      "message_attachments_image_check",
      sql`${table.kind} <> 'IMAGE' or (
        ${table.mime} in ('image/png', 'image/jpeg', 'image/webp')
        and ${table.width} is not null
        and ${table.width} between 1 and 4096
        and ${table.height} is not null
        and ${table.height} between 1 and 4096
        and ${table.fileName} is null
        and ${table.sizeBytes} = 0
      )`,
    ),
    check(
      "message_attachments_document_check",
      sql`${table.kind} <> 'DOCUMENT' or (
        ${table.mime} in (
          'application/pdf',
          'text/plain',
          'text/csv',
          'application/zip',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'application/vnd.openxmlformats-officedocument.presentationml.presentation'
        )
        and ${table.width} is null
        and ${table.height} is null
        and ${table.fileName} is not null
        and char_length(${table.fileName}) between 1 and 120
        and ${table.sizeBytes} between 1 and 5242880
      )`,
    ),
    check(
      "message_attachments_size_check",
      sql`octet_length(${table.bytes}) between 1 and 5242880`,
    ),
  ],
);

export type MessageAttachmentRecord =
  typeof messageAttachments.$inferSelect;

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
