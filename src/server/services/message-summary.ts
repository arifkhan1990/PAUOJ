import type { PresenceInfo } from "@/lib/follow-types";
import type { ConversationSummary } from "@/lib/message-types";
import {
  isParticipant,
  isUuid,
  toLastMessagePreview,
  type MessageRow,
} from "./message-helpers";
import {
  conversationForViewer,
  lastMessageRows,
  unreadCountsForConversations,
  type ConversationUserRow,
} from "./message-queries";
import { loadPresenceMap } from "./presence";
import { isBlockedEitherWay } from "./user-blocks";
import { mutedConversationIds } from "./conversation-mutes";

const HIDDEN_PRESENCE: PresenceInfo = { state: "HIDDEN", label: null };

export type ConversationSummarySource = {
  id: string;
  participant: ConversationUserRow;
  lastMessageAt: Date | null;
  createdAt: Date;
  lastMessage: MessageRow | null;
  unreadCount: number;
  presence: PresenceInfo;
  muted: boolean;
};

/**
 * One mapping for both the inbox page and the pinned conversation summary, so
 * unread (mute-aware), presence, avatar and attachment fields cannot drift.
 */
export function toConversationSummary(
  source: ConversationSummarySource,
  viewerId: string,
): ConversationSummary {
  return {
    id: source.id,
    username: source.participant.username,
    displayName: source.participant.displayName,
    unreadCount: source.muted ? 0 : source.unreadCount,
    lastMessage: toLastMessagePreview(source.lastMessage, viewerId),
    lastMessageAt: (source.lastMessageAt ?? source.createdAt).toISOString(),
    presence: source.presence,
    muted: source.muted,
    avatarPreset: source.participant.avatarPreset,
    avatarImageUpdatedAt:
      source.participant.avatarImageUpdatedAt?.toISOString() ?? null,
  };
}

/**
 * The same summary shape as one inbox row, for pinning an older active thread
 * in the rail. Visibility mirrors the thread: malformed ids, non-participants,
 * a banned counterpart and either-side blocks all return null.
 */
export async function getConversationSummary(
  viewerId: string,
  conversationId: string,
): Promise<ConversationSummary | null> {
  if (!isUuid(conversationId)) return null;
  const row = await conversationForViewer(conversationId, viewerId);
  if (!row || !isParticipant(row, viewerId)) return null;

  const participant = row.userAId === viewerId ? row.userB : row.userA;
  if (participant.isBanned) return null;
  if (await isBlockedEitherWay(viewerId, participant.id)) return null;

  const [lastMessages, unreadCounts, mutedIds] = await Promise.all([
    lastMessageRows([conversationId]),
    unreadCountsForConversations([conversationId], viewerId),
    mutedConversationIds(viewerId, [conversationId]),
  ]);
  const presence = await loadPresenceMap(
    [
      {
        id: participant.id,
        lastActiveAt: participant.lastActiveAt,
        presenceVisibility: participant.presenceVisibility,
      },
    ],
    viewerId,
    new Set<string>(),
  );

  return toConversationSummary(
    {
      id: row.id,
      participant,
      lastMessageAt: row.lastMessageAt,
      createdAt: row.createdAt,
      lastMessage: lastMessages.get(conversationId) ?? null,
      unreadCount: unreadCounts.get(conversationId) ?? 0,
      presence: presence.get(participant.id) ?? HIDDEN_PRESENCE,
      muted: mutedIds.has(conversationId),
    },
    viewerId,
  );
}
