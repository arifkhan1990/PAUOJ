import { errors } from "@/server/api/errors";
import type { MessageItem } from "@/lib/message-types";

export const CONVERSATION_BODY_MAX_LENGTH = 2000;
export const NOTIFICATION_PREVIEW_LENGTH = 120;
export const MAX_MESSAGE_PAGE = 10_000;

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type ConversationPair = { userAId: string; userBId: string };

export type MessageRow = {
  id: string;
  body: string;
  senderId: string;
  createdAt: Date;
  readAt: Date | null;
  deletedAt: Date | null;
};

export type LastMessagePreview = {
  body: string;
  mine: boolean;
  createdAt: string;
  deleted: boolean;
};

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

export function truncatePreview(
  body: string,
  max = NOTIFICATION_PREVIEW_LENGTH,
): string {
  return body.length <= max ? body : body.slice(0, max);
}

export function messageDedupeKey(messageId: string): string {
  return `message:${messageId}`;
}

export function conversationHref(conversationId: string): string {
  return `/dashboard/messages/${conversationId}`;
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
  return {
    id: row.id,
    body: masked.body,
    mine: row.senderId === viewerId,
    createdAt: row.createdAt.toISOString(),
    readAt: row.readAt?.toISOString() ?? null,
    deleted: masked.deleted,
  };
}

export function toLastMessagePreview(
  row: MessageRow | null,
  viewerId: string,
): LastMessagePreview | null {
  if (!row) return null;
  const masked = maskDeletedBody(row);
  return {
    body: masked.body,
    mine: row.senderId === viewerId,
    createdAt: row.createdAt.toISOString(),
    deleted: masked.deleted,
  };
}
