import {
  and,
  count,
  desc,
  eq,
  inArray,
  isNull,
  ne,
  or,
  sql,
  type SQL,
} from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { getDb } from "@/server/db";
import {
  conversationMutes,
  conversations,
  messageAttachments,
  messages,
  userBlocks,
  userFollows,
  users,
} from "@/server/db/schema";
import type { PresenceVisibility } from "./presence";
import {
  attachmentFields,
  messageFields,
  toMessageRow,
  type MessageRow,
} from "./message-helpers";

const userA = alias(users, "conversation_user_a");
const userB = alias(users, "conversation_user_b");

export type ConversationUserRow = {
  id: string;
  username: string;
  displayName: string;
  lastActiveAt: Date | null;
  presenceVisibility: PresenceVisibility;
  notifyMessages: boolean;
  avatarPreset: string | null;
  avatarImageUpdatedAt: Date | null;
  /** Banned counterparts are hidden from the inbox and the thread. */
  isBanned: boolean;
};

export type ConversationPageRow = {
  id: string;
  userAId: string;
  userBId: string;
  lastMessageAt: Date | null;
  createdAt: Date;
  userA: ConversationUserRow;
  userB: ConversationUserRow;
};

export type ConversationWithParticipants = {
  id: string;
  userAId: string;
  userBId: string;
  lastMessageAt: Date | null;
  createdAt: Date;
  userA: ConversationUserRow;
  userB: ConversationUserRow;
};

export type ConversationLastMessageRow = MessageRow & {
  conversationId: string;
};

const userAParticipantFields = {
  id: userA.id,
  username: userA.username,
  displayName: userA.displayName,
  lastActiveAt: userA.lastActiveAt,
  presenceVisibility: userA.presenceVisibility,
  notifyMessages: userA.notifyMessages,
  avatarPreset: userA.avatarPreset,
  avatarImageUpdatedAt: userA.avatarImageUpdatedAt,
  isBanned: userA.isBanned,
};

const userBParticipantFields = {
  id: userB.id,
  username: userB.username,
  displayName: userB.displayName,
  lastActiveAt: userB.lastActiveAt,
  presenceVisibility: userB.presenceVisibility,
  notifyMessages: userB.notifyMessages,
  avatarPreset: userB.avatarPreset,
  avatarImageUpdatedAt: userB.avatarImageUpdatedAt,
  isBanned: userB.isBanned,
};

const viewerFilter = (viewerId: string) =>
  or(
    eq(conversations.userAId, viewerId),
    eq(conversations.userBId, viewerId),
  );

/**
 * Correlated guard for inbox queries: hides a conversation as soon as either
 * participant blocked the other, in either direction.
 */
export function notBlockedWithViewer(viewerId: string): SQL {
  return sql`not exists (select 1 from ${userBlocks} where (
    (${userBlocks.blockerId} = ${viewerId} and ${userBlocks.blockedId} in (${conversations.userAId}, ${conversations.userBId}))
    or (${userBlocks.blockedId} = ${viewerId} and ${userBlocks.blockerId} in (${conversations.userAId}, ${conversations.userBId}))
  ))`;
}

/** Muted conversations stay listed but never contribute to unread badges. */
export function notMutedForViewer(viewerId: string): SQL {
  return sql`not exists (select 1 from ${conversationMutes} where (
    ${conversationMutes.conversationId} = ${conversations.id}
    and ${conversationMutes.userId} = ${viewerId}
  ))`;
}

/**
 * Correlated guard for inbox queries: hides a conversation as soon as the other
 * participant is banned, in the same way a blocked pair is hidden.
 */
export function notBannedCounterpart(viewerId: string): SQL {
  return sql`not exists (select 1 from ${users} where (
    ${users.isBanned}
    and ${users.id} in (${conversations.userAId}, ${conversations.userBId})
    and ${users.id} <> ${viewerId}
  ))`;
}

const visibleToViewer = (viewerId: string): SQL =>
  and(
    viewerFilter(viewerId),
    notBlockedWithViewer(viewerId),
    notBannedCounterpart(viewerId),
  )!;

export async function findMessagingTarget(
  username: string,
): Promise<{ id: string; isBanned: boolean } | null> {
  const [row] = await getDb()
    .select({ id: users.id, isBanned: users.isBanned })
    .from(users)
    .where(eq(users.username, username.trim().toLowerCase()))
    .limit(1);
  return row ?? null;
}

export async function hasAcceptedFollowEitherWay(
  left: string,
  right: string,
): Promise<boolean> {
  const [row] = await getDb()
    .select({ followerId: userFollows.followerId })
    .from(userFollows)
    .where(
      and(
        eq(userFollows.status, "ACCEPTED"),
        or(
          and(
            eq(userFollows.followerId, left),
            eq(userFollows.followingId, right),
          ),
          and(
            eq(userFollows.followerId, right),
            eq(userFollows.followingId, left),
          ),
        ),
      ),
    )
    .limit(1);
  return Boolean(row);
}

export async function conversationByPair(
  userAId: string,
  userBId: string,
): Promise<{ id: string } | null> {
  const [row] = await getDb()
    .select({ id: conversations.id })
    .from(conversations)
    .where(
      and(
        eq(conversations.userAId, userAId),
        eq(conversations.userBId, userBId),
      ),
    )
    .limit(1);
  return row ?? null;
}

export async function countViewerConversations(
  viewerId: string,
): Promise<number> {
  const [row] = await getDb()
    .select({ value: count() })
    .from(conversations)
    .where(visibleToViewer(viewerId));
  return Number(row?.value ?? 0);
}

export async function listConversationRows(
  viewerId: string,
  limit: number,
  offset: number,
): Promise<ConversationPageRow[]> {
  return getDb()
    .select({
      id: conversations.id,
      userAId: conversations.userAId,
      userBId: conversations.userBId,
      lastMessageAt: conversations.lastMessageAt,
      createdAt: conversations.createdAt,
      userA: userAParticipantFields,
      userB: userBParticipantFields,
    })
    .from(conversations)
    .innerJoin(userA, eq(userA.id, conversations.userAId))
    .innerJoin(userB, eq(userB.id, conversations.userBId))
    .where(visibleToViewer(viewerId))
    .orderBy(
      sql`${conversations.lastMessageAt} desc nulls last`,
      desc(conversations.createdAt),
      desc(conversations.id),
    )
    .limit(limit)
    .offset(offset);
}

/** Counterpart ids the viewer has blocked or been blocked by, for presence. */
export async function blockedCounterpartIds(
  viewerId: string,
  candidateIds: string[],
): Promise<Set<string>> {
  if (candidateIds.length === 0) return new Set();
  const rows = await getDb()
    .select({
      blockerId: userBlocks.blockerId,
      blockedId: userBlocks.blockedId,
    })
    .from(userBlocks)
    .where(
      and(
        or(
          eq(userBlocks.blockerId, viewerId),
          eq(userBlocks.blockedId, viewerId),
        ),
        or(
          inArray(userBlocks.blockerId, candidateIds),
          inArray(userBlocks.blockedId, candidateIds),
        ),
      ),
    );
  return new Set(
    rows.map((row) =>
      row.blockerId === viewerId ? row.blockedId : row.blockerId,
    ),
  );
}

export async function countViewerUnreadMessages(
  viewerId: string,
): Promise<number> {
  const [row] = await getDb()
    .select({ value: count() })
    .from(messages)
    .innerJoin(conversations, eq(conversations.id, messages.conversationId))
    .where(
      and(
        visibleToViewer(viewerId),
        notMutedForViewer(viewerId),
        ne(messages.senderId, viewerId),
        isNull(messages.readAt),
        isNull(messages.deletedAt),
      ),
    );
  return Number(row?.value ?? 0);
}

export async function unreadCountsForConversations(
  conversationIds: string[],
  viewerId: string,
): Promise<Map<string, number>> {
  if (conversationIds.length === 0) return new Map();
  const rows = await getDb()
    .select({
      conversationId: messages.conversationId,
      value: count(),
    })
    .from(messages)
    .innerJoin(conversations, eq(conversations.id, messages.conversationId))
    .where(
      and(
        visibleToViewer(viewerId),
        inArray(messages.conversationId, conversationIds),
        ne(messages.senderId, viewerId),
        isNull(messages.readAt),
        isNull(messages.deletedAt),
      ),
    )
    .groupBy(messages.conversationId);
  return new Map(
    rows.map((row) => [row.conversationId, Number(row.value)]),
  );
}

/** Newest message per conversation, including deleted rows. */
export async function lastMessageRows(
  conversationIds: string[],
): Promise<Map<string, ConversationLastMessageRow>> {
  if (conversationIds.length === 0) return new Map();
  const rows = await getDb()
    .selectDistinctOn([messages.conversationId], {
      conversationId: messages.conversationId,
      ...messageFields,
      ...attachmentFields,
    })
    .from(messages)
    .leftJoin(
      messageAttachments,
      eq(messageAttachments.messageId, messages.id),
    )
    .where(inArray(messages.conversationId, conversationIds))
    .orderBy(
      messages.conversationId,
      desc(messages.createdAt),
      desc(messages.id),
    );
  return new Map(
    rows.map((row) => [
      row.conversationId,
      { ...toMessageRow(row), conversationId: row.conversationId },
    ]),
  );
}

export async function conversationForViewer(
  conversationId: string,
  viewerId: string,
): Promise<ConversationWithParticipants | null> {
  const [row] = await getDb()
    .select({
      id: conversations.id,
      userAId: conversations.userAId,
      userBId: conversations.userBId,
      lastMessageAt: conversations.lastMessageAt,
      createdAt: conversations.createdAt,
      userA: userAParticipantFields,
      userB: userBParticipantFields,
    })
    .from(conversations)
    .innerJoin(userA, eq(userA.id, conversations.userAId))
    .innerJoin(userB, eq(userB.id, conversations.userBId))
    .where(
      and(eq(conversations.id, conversationId), viewerFilter(viewerId)),
    )
    .limit(1);
  return row ?? null;
}

export async function countConversationMessages(
  conversationId: string,
): Promise<number> {
  const [row] = await getDb()
    .select({ value: count() })
    .from(messages)
    .where(eq(messages.conversationId, conversationId));
  return Number(row?.value ?? 0);
}

export async function threadMessageRows(
  conversationId: string,
  limit: number,
  offset: number,
): Promise<MessageRow[]> {
  const rows = await getDb()
    .select({ ...messageFields, ...attachmentFields })
    .from(messages)
    .leftJoin(
      messageAttachments,
      eq(messageAttachments.messageId, messages.id),
    )
    .where(eq(messages.conversationId, conversationId))
    .orderBy(desc(messages.createdAt), desc(messages.id))
    .limit(limit)
    .offset(offset);
  return rows.map(toMessageRow);
}

export async function hasUnreadFromSender(
  conversationId: string,
  senderId: string,
): Promise<boolean> {
  const [row] = await getDb()
    .select({ id: messages.id })
    .from(messages)
    .where(
      and(
        eq(messages.conversationId, conversationId),
        eq(messages.senderId, senderId),
        isNull(messages.readAt),
      ),
    )
    .limit(1);
  return Boolean(row);
}

export async function findMessageForSender(
  messageId: string,
  senderId: string,
): Promise<(MessageRow & { conversationId: string }) | null> {
  const [row] = await getDb()
    .select({
      ...messageFields,
      conversationId: messages.conversationId,
      ...attachmentFields,
    })
    .from(messages)
    .leftJoin(
      messageAttachments,
      eq(messageAttachments.messageId, messages.id),
    )
    .where(and(eq(messages.id, messageId), eq(messages.senderId, senderId)))
    .limit(1);
  return row
    ? { ...toMessageRow(row), conversationId: row.conversationId }
    : null;
}
