import type { ConversationSummary } from "@/lib/message-types";

/**
 * The thread page only loads the first page of conversations, so an older
 * active conversation can be missing from the rail. Pin it on top without
 * duplicating a row that is already in the page.
 */
export function withPinnedConversation(
  conversations: readonly ConversationSummary[],
  pinned: ConversationSummary | null,
): ConversationSummary[] {
  if (!pinned) return [...conversations];
  if (conversations.some((conversation) => conversation.id === pinned.id)) {
    return [...conversations];
  }
  return [pinned, ...conversations];
}

/**
 * Rail visibility inside the workspace shell.
 * - Inbox: the rail is the page.
 * - Thread: hidden on phones, shown from md.
 * - Thread with info open: hidden until xl so the thread and the in-flow info
 *   column keep usable width (the drawer below md is unaffected).
 */
export function railClassName(hasThread: boolean, infoOpen: boolean): string {
  if (!hasThread) return "flex";
  return infoOpen ? "hidden xl:flex" : "hidden md:flex";
}
