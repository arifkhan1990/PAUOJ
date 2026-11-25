import type { ConversationSummary, MessageItem } from "@/lib/message-types";
import { formatDate } from "@/lib/utils";

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

export const MESSAGE_MAX_LENGTH = 2000;
export const PREVIEW_MAX_LENGTH = 120;

function toDate(value: Date | string): Date {
  return typeof value === "string" ? new Date(value) : value;
}

/** Short relative label for a conversation row or message bubble. */
export function formatMessageTime(
  value: Date | string,
  now: Date | number = Date.now(),
): string {
  const date = toDate(value);
  if (Number.isNaN(date.getTime())) return "";
  const current = typeof now === "number" ? now : now.getTime();
  const diff = Math.max(0, current - date.getTime());

  if (diff < MINUTE) return "just now";
  if (diff < HOUR) return `${Math.floor(diff / MINUTE)}m ago`;
  if (diff < DAY) return `${Math.floor(diff / HOUR)}h ago`;
  if (diff < 7 * DAY) return `${Math.floor(diff / DAY)}d ago`;
  return formatDate(date);
}

/** Collapse newlines so a message preview stays on one line, then ellipsize. */
export function truncatePreview(
  body: string,
  max = PREVIEW_MAX_LENGTH,
): string {
  const collapsed = body.replace(/\s+/g, " ").trim();
  const characters = Array.from(collapsed);
  if (characters.length <= max) return collapsed;
  const slice = characters.slice(0, Math.max(1, max - 1)).join("");
  return `${slice.trimEnd()}…`;
}

/** One-line conversation preview, including the "You:" and deleted states. */
export function conversationPreview(
  lastMessage: ConversationSummary["lastMessage"],
  max = PREVIEW_MAX_LENGTH,
): string {
  if (!lastMessage) return "No messages yet";
  if (lastMessage.deleted) return "Message deleted";
  const body = truncatePreview(lastMessage.body, max);
  return lastMessage.mine ? `You: ${body}` : body;
}

/** "1 unread message" / "4 unread messages"; null when there is nothing unread. */
export function unreadLabel(count: number): string | null {
  if (!Number.isFinite(count) || count <= 0) return null;
  const value = Math.trunc(count);
  return `${value.toLocaleString("en-US")} unread ${
    value === 1 ? "message" : "messages"
  }`;
}

/**
 * A muted conversation never shows an unread badge, even if a stale payload
 * reports a count. The server already zeroes it; this keeps the row honest.
 */
export function conversationRowState(
  muted: boolean,
  unreadCount: number,
): { muted: boolean; unread: number; showUnreadBadge: boolean } {
  const unread = muted || !Number.isFinite(unreadCount) ? 0 : Math.max(0, unreadCount);
  return { muted, unread, showUnreadBadge: unread > 0 };
}

/** The next mute request for the thread header toggle. */
export function muteToggleState(muted: boolean): {
  nextMuted: boolean;
  method: "POST" | "DELETE";
  label: string;
} {
  return muted
    ? {
        nextMuted: false,
        method: "DELETE",
        label: "Unmute conversation",
      }
    : {
        nextMuted: true,
        method: "POST",
        label: "Mute conversation",
      };
}

function compareMessages(left: MessageItem, right: MessageItem): number {
  const leftTime = Date.parse(left.createdAt);
  const rightTime = Date.parse(right.createdAt);
  if (Number.isFinite(leftTime) && Number.isFinite(rightTime)) {
    if (leftTime !== rightTime) return leftTime - rightTime;
  } else if (left.createdAt !== right.createdAt) {
    return left.createdAt < right.createdAt ? -1 : 1;
  }
  return left.id < right.id ? -1 : left.id > right.id ? 1 : 0;
}

/**
 * Union messages by id, newest server copy wins (so read receipts refresh),
 * then order oldest-first for the thread.
 */
export function mergeMessages(
  current: readonly MessageItem[],
  incoming: readonly MessageItem[],
): MessageItem[] {
  const byId = new Map<string, MessageItem>();
  for (const item of current) byId.set(item.id, item);
  for (const item of incoming) byId.set(item.id, item);
  return [...byId.values()].sort(compareMessages);
}

/** New incoming (theirs) messages from a poll that the thread has not seen. */
export function newIncomingMessages(
  known: readonly MessageItem[],
  polled: readonly MessageItem[],
): MessageItem[] {
  const ids = new Set(known.map((item) => item.id));
  return polled.filter((item) => !item.mine && !ids.has(item.id));
}

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isUuid(value: string): boolean {
  return UUID_PATTERN.test(value);
}
