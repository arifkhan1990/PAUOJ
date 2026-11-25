import { and, eq, inArray } from "drizzle-orm";
import { getDb } from "@/server/db";
import { conversationMutes } from "@/server/db/schema";
import { errors } from "@/server/api/errors";
import { enforceRateLimit } from "@/server/api/rate-limit";
import { isParticipant, isUuid } from "./message-helpers";
import { conversationForViewer } from "./message-queries";
import { invalidateUnreadCache } from "./message-unread-cache";

const MUTE_RATE_LIMIT = 60;
const MUTE_RATE_WINDOW_SECONDS = 60;

export type ConversationMuteState = { muted: boolean };

/**
 * Mute and unmute are participant-only: a malformed id and a foreign
 * conversation both look like 404 so a stranger cannot probe for existence.
 */
async function assertMutableConversation(
  viewerId: string,
  conversationId: string,
): Promise<void> {
  if (!isUuid(conversationId)) {
    throw errors.notFound("Conversation not found.");
  }
  const conversation = await conversationForViewer(conversationId, viewerId);
  if (!conversation || !isParticipant(conversation, viewerId)) {
    throw errors.notFound("Conversation not found.");
  }
}

export async function muteConversation(
  viewerId: string,
  conversationId: string,
): Promise<ConversationMuteState> {
  await assertMutableConversation(viewerId, conversationId);
  await enforceRateLimit(
    `conversation-mute:${viewerId}`,
    MUTE_RATE_LIMIT,
    MUTE_RATE_WINDOW_SECONDS,
    "You are updating conversation mutes too quickly. Please try again later.",
  );

  await getDb()
    .insert(conversationMutes)
    .values({ conversationId, userId: viewerId })
    .onConflictDoNothing();

  // Muted conversations drop out of the viewer's unread badge immediately.
  await invalidateUnreadCache(viewerId);

  return { muted: true };
}

export async function unmuteConversation(
  viewerId: string,
  conversationId: string,
): Promise<ConversationMuteState> {
  await assertMutableConversation(viewerId, conversationId);
  await enforceRateLimit(
    `conversation-mute:${viewerId}`,
    MUTE_RATE_LIMIT,
    MUTE_RATE_WINDOW_SECONDS,
    "You are updating conversation mutes too quickly. Please try again later.",
  );

  await getDb()
    .delete(conversationMutes)
    .where(
      and(
        eq(conversationMutes.conversationId, conversationId),
        eq(conversationMutes.userId, viewerId),
      ),
    );

  await invalidateUnreadCache(viewerId);

  return { muted: false };
}

export async function isMuted(
  viewerId: string,
  conversationId: string,
): Promise<boolean> {
  if (!isUuid(conversationId)) return false;
  const [row] = await getDb()
    .select({ userId: conversationMutes.userId })
    .from(conversationMutes)
    .where(
      and(
        eq(conversationMutes.conversationId, conversationId),
        eq(conversationMutes.userId, viewerId),
      ),
    )
    .limit(1);
  return Boolean(row);
}

/** Batch lookup for a page of conversations: one query, no N+1. */
export async function mutedConversationIds(
  viewerId: string,
  conversationIds: string[],
): Promise<Set<string>> {
  if (conversationIds.length === 0) return new Set();
  const rows = await getDb()
    .select({ conversationId: conversationMutes.conversationId })
    .from(conversationMutes)
    .where(
      and(
        eq(conversationMutes.userId, viewerId),
        inArray(conversationMutes.conversationId, conversationIds),
      ),
    );
  return new Set(rows.map((row) => row.conversationId));
}
