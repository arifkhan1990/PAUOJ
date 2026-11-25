import type { PresenceInfo } from "./follow-types";

export type MessageItem = {
  id: string;
  body: string;
  mine: boolean;
  createdAt: string;
  readAt: string | null;
  deleted: boolean;
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
