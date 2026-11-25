import { and, eq, inArray, isNull, ne } from "drizzle-orm";
import { getDb } from "@/server/db";
import {
  messageAttachments,
  messages,
  notifications,
} from "@/server/db/schema";
import { errors } from "@/server/api/errors";
import { enforceRateLimit } from "@/server/api/rate-limit";
import type { PresenceInfo } from "@/lib/follow-types";
import type {
  ConversationListPage,
  ConversationSummary,
  ConversationThread,
  MessageItem,
} from "@/lib/message-types";
import {
  clampPage,
  conversationHrefVariants,
  isParticipant,
  isUuid,
  messageDedupeKey,
  normalizeMessageBody,
  otherParticipantId,
  toLastMessagePreview,
  toMessageItem,
} from "./message-helpers";
import {
  blockedCounterpartIds,
  conversationForViewer,
  countConversationMessages,
  countViewerConversations,
  countViewerUnreadMessages,
  findMessageForSender,
  lastMessageRows,
  listConversationRows,
  threadMessageRows,
  unreadCountsForConversations,
  type ConversationPageRow,
  type ConversationUserRow,
  type ConversationWithParticipants,
} from "./message-queries";
import { loadPresenceMap } from "./presence";
import { toParticipantProfile } from "./message-shared";
import { isBlockedEitherWay } from "./user-blocks";
import { isMuted, mutedConversationIds } from "./conversation-mutes";
import {
  cachedUnreadMessageCount,
  invalidateUnreadCache,
} from "./message-unread-cache";
import {
  deliverMessage,
  loadMessageSendTarget,
  type MessageViewer,
} from "./message-send";

export type { MessageViewer } from "./message-send";

export const CONVERSATIONS_PAGE_SIZE = 20;
export const THREAD_PAGE_SIZE = 30;

/** SSR burst limits: a person can refresh their inbox without tripping these. */
export const MESSAGES_LIST_RATE_LIMIT = 120;
export const MESSAGES_THREAD_RATE_LIMIT = 240;
export const MESSAGES_PAGE_RATE_WINDOW_SECONDS = 60;

const SEND_RATE_LIMIT = 30;
const SEND_RATE_WINDOW_SECONDS = 60;
const READ_RATE_LIMIT = 120;
const READ_RATE_WINDOW_SECONDS = 60;
const DELETE_RATE_LIMIT = 60;
const DELETE_RATE_WINDOW_SECONDS = 60;

const HIDDEN_PRESENCE: PresenceInfo = { state: "HIDDEN", label: null };

function otherUser(
  row: ConversationPageRow | ConversationWithParticipants,
  viewerId: string,
): ConversationUserRow {
  return row.userAId === viewerId ? row.userB : row.userA;
}

function presenceOf(
  map: Map<string, PresenceInfo>,
  userId: string,
): PresenceInfo {
  return map.get(userId) ?? HIDDEN_PRESENCE;
}

export async function listConversations(
  viewerId: string,
  page: number,
): Promise<ConversationListPage> {
  const safePage = clampPage(page);
  const [total, unreadTotal, rows] = await Promise.all([
    countViewerConversations(viewerId),
    countViewerUnreadMessages(viewerId),
    listConversationRows(
      viewerId,
      CONVERSATIONS_PAGE_SIZE,
      (safePage - 1) * CONVERSATIONS_PAGE_SIZE,
    ),
  ]);

  const conversationIds = rows.map((row) => row.id);
  const [lastMessages, unreadCounts, blockedIds, mutedIds] = await Promise.all([
    lastMessageRows(conversationIds),
    unreadCountsForConversations(conversationIds, viewerId),
    blockedCounterpartIds(
      viewerId,
      rows.map((row) => otherUser(row, viewerId).id),
    ),
    mutedConversationIds(viewerId, conversationIds),
  ]);
  const participants = rows.map((row) => otherUser(row, viewerId));
  const presence = await loadPresenceMap(
    participants.map((participant) => ({
      id: participant.id,
      lastActiveAt: participant.lastActiveAt,
      presenceVisibility: participant.presenceVisibility,
    })),
    viewerId,
    blockedIds,
  );

  const items: ConversationSummary[] = rows.map((row) => {
    const participant = otherUser(row, viewerId);
    const muted = mutedIds.has(row.id);
    return {
      id: row.id,
      username: participant.username,
      displayName: participant.displayName,
      unreadCount: muted ? 0 : unreadCounts.get(row.id) ?? 0,
      lastMessage: toLastMessagePreview(lastMessages.get(row.id) ?? null, viewerId),
      lastMessageAt: (row.lastMessageAt ?? row.createdAt).toISOString(),
      presence: presenceOf(presence, participant.id),
      muted,
      avatarPreset: participant.avatarPreset,
      avatarImageUpdatedAt:
        participant.avatarImageUpdatedAt?.toISOString() ?? null,
    };
  });

  return {
    items,
    total,
    page: safePage,
    pageSize: CONVERSATIONS_PAGE_SIZE,
    totalPages: Math.max(1, Math.ceil(total / CONVERSATIONS_PAGE_SIZE)),
    unreadTotal,
  };
}

export async function getConversationThread(
  viewerId: string,
  conversationId: string,
  page: number,
): Promise<ConversationThread | null> {
  if (!isUuid(conversationId)) return null;
  const conversation = await conversationForViewer(conversationId, viewerId);
  if (!conversation || !isParticipant(conversation, viewerId)) return null;

  const participant = otherUser(conversation, viewerId);
  // A banned counterpart hides the thread exactly like a blocked one: links to
  // it behave as missing and no content is exposed.
  if (participant.isBanned) return null;
  const safePage = clampPage(page);
  const [blocked, total, rows, muted] = await Promise.all([
    isBlockedEitherWay(viewerId, participant.id),
    countConversationMessages(conversationId),
    threadMessageRows(
      conversationId,
      THREAD_PAGE_SIZE,
      (safePage - 1) * THREAD_PAGE_SIZE,
    ),
    isMuted(viewerId, conversationId),
  ]);
  // A block hides the thread from the inbox and from direct links until the
  // block is lifted, so the thread behaves exactly like a missing resource.
  if (blocked) return null;

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

  return {
    id: conversationId,
    participant: {
      username: participant.username,
      displayName: participant.displayName,
      presence: presenceOf(presence, participant.id),
      avatarPreset: participant.avatarPreset,
      avatarImageUpdatedAt:
        participant.avatarImageUpdatedAt?.toISOString() ?? null,
      profile: toParticipantProfile(participant),
    },
    // The query walks from newest to oldest; the UI reads oldest to newest.
    items: [...rows].reverse().map((row) => toMessageItem(row, viewerId)),
    page: safePage,
    pageSize: THREAD_PAGE_SIZE,
    total,
    totalPages: Math.max(1, Math.ceil(total / THREAD_PAGE_SIZE)),
    blocked: false,
    muted,
  };
}

export async function sendMessage(
  viewer: MessageViewer,
  conversationId: string,
  body: string,
): Promise<MessageItem> {
  const normalizedBody = normalizeMessageBody(body);
  const target = await loadMessageSendTarget(viewer.id, conversationId);
  await enforceRateLimit(
    `message-send:${viewer.id}`,
    SEND_RATE_LIMIT,
    SEND_RATE_WINDOW_SECONDS,
    "You are sending messages too quickly. Please slow down.",
  );
  return deliverMessage({ viewer, target, body: normalizedBody });
}

export async function markConversationRead(
  viewerId: string,
  conversationId: string,
): Promise<{ marked: number }> {
  if (!isUuid(conversationId)) {
    throw errors.notFound("Conversation not found.");
  }
  const conversation = await conversationForViewer(conversationId, viewerId);
  if (!conversation || !isParticipant(conversation, viewerId)) {
    throw errors.notFound("Conversation not found.");
  }
  await enforceRateLimit(
    `message-read:${viewerId}`,
    READ_RATE_LIMIT,
    READ_RATE_WINDOW_SECONDS,
  );

  const now = new Date();
  const db = getDb();
  const marked = await db
    .update(messages)
    .set({ readAt: now })
    .where(
      and(
        eq(messages.conversationId, conversationId),
        ne(messages.senderId, viewerId),
        isNull(messages.readAt),
      ),
    )
    .returning({ id: messages.id });
  await db
    .update(notifications)
    .set({ readAt: now, updatedAt: now })
    .where(
      and(
        eq(notifications.userId, viewerId),
        inArray(notifications.href, conversationHrefVariants(conversationId)),
        isNull(notifications.readAt),
      ),
    );
  await invalidateUnreadCache(viewerId);
  return { marked: marked.length };
}

export async function deleteMessage(
  viewerId: string,
  messageId: string,
): Promise<{ deleted: true }> {
  if (!isUuid(messageId)) throw errors.notFound("Message not found.");
  await enforceRateLimit(
    `message-delete:${viewerId}`,
    DELETE_RATE_LIMIT,
    DELETE_RATE_WINDOW_SECONDS,
  );

  const message = await findMessageForSender(messageId, viewerId);
  if (!message) throw errors.notFound("Message not found.");
  const conversation = await conversationForViewer(
    message.conversationId,
    viewerId,
  );
  const recipientId = conversation
    ? otherParticipantId(conversation, viewerId)
    : null;
  const now = new Date();
  const db = getDb();
  await db.transaction(async (tx) => {
    await tx
      .update(messages)
      .set({ deletedAt: now })
      .where(
        and(
          eq(messages.id, messageId),
          eq(messages.senderId, viewerId),
          isNull(messages.deletedAt),
        ),
      );
    // Attachment bytes live in Postgres, so the delete must free them too. The
    // ownership subquery keeps a second gate even though the lookup above only
    // returns the sender's own message. This also clears rows left behind by
    // messages that were soft-deleted before the purge existed.
    await tx
      .delete(messageAttachments)
      .where(
        inArray(
          messageAttachments.messageId,
          tx
            .select({ id: messages.id })
            .from(messages)
            .where(
              and(
                eq(messages.id, messageId),
                eq(messages.senderId, viewerId),
              ),
            ),
        ),
      );
  });
  // A delivered notification must not outlive the message it previews.
  await db
    .update(notifications)
    .set({ body: "This message was deleted.", updatedAt: now })
    .where(
      and(
        inArray(
          notifications.href,
          conversationHrefVariants(message.conversationId),
        ),
        eq(notifications.dedupeKey, messageDedupeKey(messageId)),
      ),
    );
  // Deleting an unread received message lowers the other side's badge.
  if (recipientId) await invalidateUnreadCache(recipientId);
  return { deleted: true };
}

export async function getUnreadMessageCount(
  viewerId: string,
): Promise<number> {
  return cachedUnreadMessageCount(viewerId, () =>
    countViewerUnreadMessages(viewerId),
  );
}

export { openConversation } from "./message-open";
