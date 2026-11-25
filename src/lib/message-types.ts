import type { PresenceInfo } from "./follow-types";

export type MessageImageMime = "image/png" | "image/jpeg" | "image/webp";

/** One image attached to a message; bytes stay behind an auth-checked route. */
export type MessageAttachment = {
  id: string;
  mime: MessageImageMime;
  width: number;
  height: number;
  /** Same-origin, participant-only URL that streams the image. */
  url: string;
};

export type MessageItem = {
  id: string;
  body: string;
  mine: boolean;
  createdAt: string;
  readAt: string | null;
  deleted: boolean;
  attachment: MessageAttachment | null;
};

export type ConversationSummary = {
  id: string;
  username: string;
  displayName: string;
  unreadCount: number;
  lastMessage: {
    body: string;
    mine: boolean;
    createdAt: string;
    deleted: boolean;
    hasAttachment: boolean;
  } | null;
  lastMessageAt: string;
  presence: PresenceInfo;
  muted: boolean;
  avatarPreset: string | null;
  avatarImageUpdatedAt: string | null;
};

export type ConversationListPage = {
  items: ConversationSummary[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  unreadTotal: number;
};

export type ConversationThread = {
  id: string;
  participant: {
    username: string;
    displayName: string;
    presence: PresenceInfo;
    avatarPreset: string | null;
    avatarImageUpdatedAt: string | null;
  };
  items: MessageItem[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  /** True when either side blocked the other, so sending is disabled. */
  blocked: boolean;
  muted: boolean;
};

export type MessageSuggestionKind = "contest" | "problem" | "learn";

/**
 * One row in the composer's entity drawer. `href` is always an internal path
 * and becomes the reference token when selected.
 */
export type MessageSuggestion = {
  kind: MessageSuggestionKind;
  id: string;
  label: string;
  meta: string | null;
  href: string;
};

export type MessageSuggestionResponse = {
  items: MessageSuggestion[];
};
