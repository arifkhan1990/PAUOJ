import { messageReferencePreview } from "@/lib/message-references";
import type {
  ConversationSummary,
  MessageImageMime,
  MessageItem,
} from "@/lib/message-types";
import { formatDate } from "@/lib/utils";

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

export const MESSAGE_MAX_LENGTH = 2000;
export const PREVIEW_MAX_LENGTH = 120;

/** Hard limits mirrored by the upload route. */
export const MESSAGE_IMAGE_MAX_BYTES = 5 * 1024 * 1024;
export const MESSAGE_IMAGE_MIME_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
] as const;

/** Normalised allow-listed image MIME, or null when the file is not an image we accept. */
export function messageImageMime(type: string): MessageImageMime | null {
  const normalized = type.trim().toLowerCase();
  return MESSAGE_IMAGE_MIME_TYPES.find((mime) => mime === normalized) ?? null;
}

/**
 * Client-side counterpart of the upload route's validation. Returns a
 * user-facing error message, or null when the file is acceptable.
 */
export function validateMessageImage(file: {
  type: string;
  size: number;
}): string | null {
  if (!messageImageMime(file.type)) {
    return "Choose a PNG, JPEG, or WebP image.";
  }
  if (!Number.isFinite(file.size) || file.size <= 0) {
    return "That image looks empty. Choose another file.";
  }
  if (file.size > MESSAGE_IMAGE_MAX_BYTES) {
    return "Images must be 5 MB or smaller.";
  }
  return null;
}

/** "820 KB" / "4.2 MB" for the composer preview. */
export function formatFileSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 KB";
  if (bytes >= 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

function toDate(value: Date | string | number): Date {
  if (typeof value === "number") return new Date(value);
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

/** Local calendar day ("2026-11-25") shared by the thread's date dividers. */
export function messageDayKey(value: Date | string | number): string {
  const date = toDate(value);
  if (Number.isNaN(date.getTime())) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Divider label for a message day: "Today", "Yesterday" or the absolute UTC
 * date that `formatMessageTime` uses once a message is older than a week. The
 * day boundary follows the viewer's local calendar so a 01:00 Dhaka message is
 * not filed under yesterday just because it is still the previous UTC day.
 */
export function messageDayLabel(
  value: Date | string | number,
  now: Date | number = Date.now(),
): string {
  const date = toDate(value);
  if (Number.isNaN(date.getTime())) return "";
  const current = toDate(now);
  const key = messageDayKey(date);
  if (key === messageDayKey(current)) return "Today";
  const yesterday = new Date(current);
  yesterday.setDate(yesterday.getDate() - 1);
  if (key === messageDayKey(yesterday)) return "Yesterday";
  return formatDate(date);
}

export type MessageDayGroup = {
  key: string;
  label: string;
  items: MessageItem[];
};

/** Split an oldest-first thread into consecutive calendar days for dividers. */
export function groupMessagesByDay(
  items: readonly MessageItem[],
  now: Date | number = Date.now(),
): MessageDayGroup[] {
  const groups: MessageDayGroup[] = [];
  for (const item of items) {
    const key = messageDayKey(item.createdAt) || "unknown";
    const last = groups[groups.length - 1];
    if (last && last.key === key) {
      last.items.push(item);
      continue;
    }
    groups.push({
      key,
      label: key === "unknown" ? "" : messageDayLabel(item.createdAt, now),
      items: [item],
    });
  }
  return groups;
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
  // Reference tokens expand to "@Label" before truncating so the inbox stays readable.
  const body = truncatePreview(messageReferencePreview(lastMessage.body), max);
  const preview = body || (lastMessage.hasAttachment ? "📷 Photo" : "Message");
  return lastMessage.mine ? `You: ${preview}` : preview;
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
