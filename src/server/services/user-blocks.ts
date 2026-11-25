import {
  and,
  count,
  desc,
  eq,
  inArray,
  isNull,
  or,
} from "drizzle-orm";
import { getDb } from "@/server/db";
import {
  conversations,
  notifications,
  userBlocks,
  userFollows,
  users,
} from "@/server/db/schema";
import { errors } from "@/server/api/errors";
import { enforceRateLimit } from "@/server/api/rate-limit";
import type { BlockedUserItem } from "@/lib/follow-types";
import { conversationHrefVariants } from "./message-helpers";
import { followRequestDedupeKey } from "./profile-follow-shared";
import { lockUserPair } from "./social-lock";
import { invalidateUnreadCacheFor } from "./message-unread-cache";

const BLOCK_RATE_LIMIT = 20;
const BLOCK_RATE_WINDOW_SECONDS = 60 * 60;

export async function isBlockedEitherWay(
  left: string,
  right: string,
): Promise<boolean> {
  const rows = await getDb()
    .select({ blockerId: userBlocks.blockerId })
    .from(userBlocks)
    .where(
      or(
        and(
          eq(userBlocks.blockerId, left),
          eq(userBlocks.blockedId, right),
        ),
        and(
          eq(userBlocks.blockerId, right),
          eq(userBlocks.blockedId, left),
        ),
      ),
    )
    .limit(1);
  return rows.length > 0;
}

async function findTarget(username: string) {
  const [target] = await getDb()
    .select({ id: users.id, isBanned: users.isBanned })
    .from(users)
    .where(eq(users.username, username.trim().toLowerCase()))
    .limit(1);
  if (!target || target.isBanned) throw errors.notFound("User not found.");
  return target;
}

/**
 * Blocking marks the pair's pending notices read instead of deleting them, so
 * the blocker's badge clears immediately while report and audit history stay
 * intact. The follow request the target sent is cleared, and so is every
 * message notice that links into a conversation between the pair.
 */
async function markPairNoticesRead(
  viewerId: string,
  targetId: string,
): Promise<void> {
  const db = getDb();
  const pairConversations = await db
    .select({ id: conversations.id })
    .from(conversations)
    .where(
      or(
        and(
          eq(conversations.userAId, viewerId),
          eq(conversations.userBId, targetId),
        ),
        and(
          eq(conversations.userAId, targetId),
          eq(conversations.userBId, viewerId),
        ),
      ),
    );
  const hrefs = pairConversations.flatMap((row) =>
    conversationHrefVariants(row.id),
  );
  const now = new Date();

  await db
    .update(notifications)
    .set({ readAt: now, updatedAt: now })
    .where(
      and(
        eq(notifications.userId, viewerId),
        isNull(notifications.readAt),
        or(
          eq(notifications.dedupeKey, followRequestDedupeKey(targetId)),
          hrefs.length > 0
            ? and(
                eq(notifications.type, "MESSAGE"),
                inArray(notifications.href, hrefs),
              )
            : undefined,
        ),
      ),
    );
}

export async function blockUser(
  viewer: { id: string },
  username: string,
): Promise<{ blocked: true }> {
  const target = await findTarget(username);
  if (target.id === viewer.id) {
    throw errors.validation("You cannot block yourself.");
  }
  await enforceRateLimit(
    `user-block:${viewer.id}`,
    BLOCK_RATE_LIMIT,
    BLOCK_RATE_WINDOW_SECONDS,
    "You are blocking accounts too quickly. Please try again later.",
  );

  const db = getDb();
  await db.transaction(async (tx) => {
    await lockUserPair(tx, viewer.id, target.id);
    await tx
      .insert(userBlocks)
      .values({ blockerId: viewer.id, blockedId: target.id })
      .onConflictDoNothing();
    // Blocking always severs the follow graph in both directions.
    await tx
      .delete(userFollows)
      .where(
        or(
          and(
            eq(userFollows.followerId, viewer.id),
            eq(userFollows.followingId, target.id),
          ),
          and(
            eq(userFollows.followerId, target.id),
            eq(userFollows.followingId, viewer.id),
          ),
        ),
      );
  });

  await markPairNoticesRead(viewer.id, target.id);
  // Blocking hides the pair's conversations from both inboxes and badges.
  await invalidateUnreadCacheFor([viewer.id, target.id]);

  return { blocked: true };
}

export async function unblockUser(
  viewer: { id: string },
  username: string,
): Promise<{ blocked: false }> {
  const target = await findTarget(username);
  await getDb()
    .delete(userBlocks)
    .where(
      and(
        eq(userBlocks.blockerId, viewer.id),
        eq(userBlocks.blockedId, target.id),
      ),
    );
  // Unblocking restores the pair's conversations and badge counts.
  await invalidateUnreadCacheFor([viewer.id, target.id]);
  return { blocked: false };
}

export async function listBlockedUsers(
  viewerId: string,
): Promise<BlockedUserItem[]> {
  const rows = await getDb()
    .select({
      username: users.username,
      displayName: users.displayName,
      blockedAt: userBlocks.createdAt,
    })
    .from(userBlocks)
    .innerJoin(users, eq(users.id, userBlocks.blockedId))
    .where(eq(userBlocks.blockerId, viewerId))
    .orderBy(desc(userBlocks.createdAt))
    .limit(200);

  return rows.map((row) => ({
    username: row.username,
    displayName: row.displayName,
    blockedAt: row.blockedAt.toISOString(),
  }));
}

export async function countBlockedUsers(viewerId: string): Promise<number> {
  const [row] = await getDb()
    .select({ value: count() })
    .from(userBlocks)
    .where(eq(userBlocks.blockerId, viewerId));
  return Number(row?.value ?? 0);
}
