import type { ConversationSummary } from "@/lib/message-types";
import { conversationPreview, conversationRowState } from "./message-format";

export type ConversationFilter = "all" | "unread";

export function conversationFilterCounts(
  conversations: readonly ConversationSummary[],
): Record<ConversationFilter, number> {
  let unread = 0;
  for (const conversation of conversations) {
    const state = conversationRowState(
      conversation.muted,
      conversation.unreadCount,
    );
    if (state.unread > 0) unread += 1;
  }
  return { all: conversations.length, unread };
}

/** Case-insensitive match over the visible row: name, username, preview. */
export function conversationMatches(
  conversation: ConversationSummary,
  query: string,
): boolean {
  const needle = query.trim().toLowerCase().replace(/^@+/, "");
  if (!needle) return true;
  return (
    conversation.displayName.toLowerCase().includes(needle) ||
    conversation.username.toLowerCase().includes(needle) ||
    conversationPreview(conversation.lastMessage).toLowerCase().includes(needle)
  );
}

/**
 * Client-side filter over the loaded conversation page only; the server keeps
 * owning pagination and the unread total.
 */
export function filterConversations(
  conversations: readonly ConversationSummary[],
  filter: ConversationFilter,
  query: string,
): ConversationSummary[] {
  return conversations.filter((conversation) => {
    if (
      filter === "unread" &&
      conversationRowState(conversation.muted, conversation.unreadCount).unread === 0
    ) {
      return false;
    }
    return conversationMatches(conversation, query);
  });
}
