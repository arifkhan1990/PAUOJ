import { errors } from "@/server/api/errors";
import { messageAttachments, messages } from "@/server/db/schema";
import type { MessageImageMime, MessageItem } from "@/lib/message-types";
import { messageReferencePreview } from "@/lib/message-references";

export const CONVERSATION_BODY_MAX_LENGTH = 2000;
export const NOTIFICATION_PREVIEW_LENGTH = 120;
export const MAX_MESSAGE_PAGE = 10_000;
export const PHOTO_NOTIFICATION_BODY = "Sent a photo";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type ConversationPair = { userAId: string; userBId: string };

export type MessageAttachmentRow = {
  id: string;
  mime: MessageImageMime;
  width: number;
  height: number;
};

export type MessageRow = {
  id: string;
  body: string;
  senderId: string;
  createdAt: Date;
  readAt: Date | null;
  deletedAt: Date | null;
  attachment: MessageAttachmentRow | null;
};

export type LastMessagePreview = {
  body: string;
  mine: boolean;
  createdAt: string;
  deleted: boolean;
  hasAttachment: boolean;
};

/** Selected message columns shared by thread and last-message queries. */
export const messageFields = {
  id: messages.id,
  body: messages.body,
  senderId: messages.senderId,
  createdAt: messages.createdAt,
  readAt: messages.readAt,
  deletedAt: messages.deletedAt,
};

/** Selected attachment columns for the LEFT JOIN, kept flat for mapping. */
export const attachmentFields = {
  attachmentId: messageAttachments.id,
  attachmentMime: messageAttachments.mime,
  attachmentWidth: messageAttachments.width,
  attachmentHeight: messageAttachments.height,
};

export type MessageFlatRow = {
  id: string;
  body: string;
  senderId: string;
  createdAt: Date;
  readAt: Date | null;
  deletedAt: Date | null;
  attachmentId: string | null;
  attachmentMime: string | null;
  attachmentWidth: number | null;
  attachmentHeight: number | null;
};

/** Flat attachment columns from the LEFT JOIN become the nested row shape. */
export function toMessageRow(row: MessageFlatRow): MessageRow {
  const attachment =
    row.attachmentId !== null &&
    row.attachmentMime !== null &&
    row.attachmentWidth !== null &&
    row.attachmentHeight !== null
      ? {
          id: row.attachmentId,
          mime: row.attachmentMime as MessageImageMime,
          width: row.attachmentWidth,
          height: row.attachmentHeight,
        }
      : null;
  return {
    id: row.id,
    body: row.body,
    senderId: row.senderId,
    createdAt: row.createdAt,
    readAt: row.readAt,
    deletedAt: row.deletedAt,
    attachment,
  };
}

export function isUuid(value: string): boolean {
  return UUID_PATTERN.test(value);
}

/** Keeps a caller-supplied page inside the same bounds as the query schema. */
export function clampPage(page: number, maxPage = MAX_MESSAGE_PAGE): number {
  if (!Number.isFinite(page)) return 1;
  return Math.min(maxPage, Math.max(1, Math.trunc(page)));
}

/**
 * The schema enforces `user_a_id < user_b_id`, so the pair must be sorted
 * before it is written. UUID strings compare lexicographically in Postgres.
 */
export function normalizePair(left: string, right: string): ConversationPair {
  return left <= right
    ? { userAId: left, userBId: right }
    : { userAId: right, userBId: left };
}

export function isParticipant(
  conversation: ConversationPair,
  viewerId: string,
): boolean {
  return (
    conversation.userAId === viewerId || conversation.userBId === viewerId
  );
}

export function otherParticipantId(
  conversation: ConversationPair,
  viewerId: string,
): string | null {
  if (conversation.userAId === viewerId) return conversation.userBId;
  if (conversation.userBId === viewerId) return conversation.userAId;
  return null;
}

/** Trims, then enforces the 1..2000 character body contract. */
export function normalizeMessageBody(body: string): string {
  const trimmed = body.trim();
  if (trimmed.length === 0) {
    throw errors.validation("Write a message before sending it.");
  }
  if (trimmed.length > CONVERSATION_BODY_MAX_LENGTH) {
    throw errors.validation(
      `Messages can be at most ${CONVERSATION_BODY_MAX_LENGTH} characters.`,
    );
  }
  return trimmed;
}

/**
 * An image message may have an empty caption, so unlike text the lower bound
 * is 0; it still shares the same upper bound.
 */
export function normalizeMessageCaption(caption: string): string {
  const trimmed = caption.trim();
  if (trimmed.length > CONVERSATION_BODY_MAX_LENGTH) {
    throw errors.validation(
      `Captions can be at most ${CONVERSATION_BODY_MAX_LENGTH} characters.`,
    );
  }
  return trimmed;
}

export function truncatePreview(
  body: string,
  max = NOTIFICATION_PREVIEW_LENGTH,
): string {
  return body.length <= max ? body : body.slice(0, max);
}

/**
 * Reference tokens are stored as `@[Label](/path)`; previews show them as
 * `@Label` and then respect the notification length cap.
 */
export function messagePreview(body: string): string {
  return truncatePreview(messageReferencePreview(body));
}

/**
 * Notification body for a freshly sent message. An image without a caption
 * has no text preview, so the notice says what was sent instead.
 */
export function messageNotificationBody(input: {
  body: string;
  hasAttachment: boolean;
}): string {
  const preview = messagePreview(input.body.trim());
  if (preview.length > 0) return preview;
  return input.hasAttachment ? PHOTO_NOTIFICATION_BODY : preview;
}

export function messageAttachmentUrl(attachmentId: string): string {
  return `/api/v1/messages/attachments/${attachmentId}`;
}

export function messageDedupeKey(messageId: string): string {
  return `message:${messageId}`;
}

export function conversationHref(conversationId: string): string {
  return `/dashboard/messages/${conversationId}`;
}

/**
 * Notifications written before the dashboard move still point at the old
 * inbox path, so reads and deletes must match both shapes. New notices always
 * use `conversationHref`.
 */
export function legacyConversationHref(conversationId: string): string {
  return `/messages/${conversationId}`;
}

export function conversationHrefVariants(conversationId: string): string[] {
  return [
    conversationHref(conversationId),
    legacyConversationHref(conversationId),
  ];
}

export function messageNotificationTitle(displayName: string): string {
  return `New message from ${displayName}`;
}

/**
 * One notice per unread burst. A muted conversation and a recipient who turned
 * message notices off both suppress it, while the message itself still lands.
 */
export function shouldNotifyMessage(input: {
  recipientNotifyMessages: boolean;
  recipientMuted: boolean;
  hasUnreadFromSender: boolean;
}): boolean {
  if (!input.recipientNotifyMessages || input.recipientMuted) return false;
  return !input.hasUnreadFromSender;
}

/** Deleted messages keep their row but never leak the original body. */
export function maskDeletedBody(row: {
  body: string;
  deletedAt: Date | null;
}): { body: string; deleted: boolean } {
  return row.deletedAt
    ? { body: "", deleted: true }
    : { body: row.body, deleted: false };
}

export function toMessageItem(row: MessageRow, viewerId: string): MessageItem {
  const masked = maskDeletedBody(row);
  const attachment =
    masked.deleted || !row.attachment
      ? null
      : {
          ...row.attachment,
          url: messageAttachmentUrl(row.attachment.id),
        };
  return {
    id: row.id,
    body: masked.body,
    mine: row.senderId === viewerId,
    createdAt: row.createdAt.toISOString(),
    readAt: row.readAt?.toISOString() ?? null,
    deleted: masked.deleted,
    attachment,
  };
}

export function toLastMessagePreview(
  row: MessageRow | null,
  viewerId: string,
): LastMessagePreview | null {
  if (!row) return null;
  const masked = maskDeletedBody(row);
  return {
    body: messagePreview(masked.body),
    mine: row.senderId === viewerId,
    createdAt: row.createdAt.toISOString(),
    deleted: masked.deleted,
    hasAttachment: !masked.deleted && Boolean(row.attachment),
  };
}
