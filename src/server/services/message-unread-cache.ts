import { logger } from "@/server/logger";
import { getRedis } from "@/server/redis";

/**
 * The header badge may lag real activity by at most this window. Every write
 * path that changes what a user should see invalidates the entry eagerly, so
 * the TTL only covers writes made by another process.
 */
export const UNREAD_CACHE_TTL_SECONDS = 15;

const UNREAD_CACHE_PREFIX = "messages:unread";

export function unreadCacheKey(userId: string): string {
  return `${UNREAD_CACHE_PREFIX}:${userId}`;
}

/** Cached values are unsigned integers; anything else is a cache miss. */
export function parseCachedUnreadCount(raw: string | null): number | null {
  if (raw === null || raw.trim() === "") return null;
  const value = Number(raw);
  if (!Number.isFinite(value) || value < 0) return null;
  return Math.trunc(value);
}

async function readCachedUnreadCount(userId: string): Promise<number | null> {
  try {
    return parseCachedUnreadCount(await getRedis().get(unreadCacheKey(userId)));
  } catch (error) {
    logger.warn("Unread message cache read failed", {
      userId,
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}

async function writeCachedUnreadCount(
  userId: string,
  count: number,
): Promise<void> {
  try {
    await getRedis().set(
      unreadCacheKey(userId),
      String(count),
      "EX",
      UNREAD_CACHE_TTL_SECONDS,
    );
  } catch (error) {
    logger.warn("Unread message cache write failed", {
      userId,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

/** Best-effort: a Redis outage must never fail the mutation that caused it. */
export async function invalidateUnreadCache(userId: string): Promise<void> {
  try {
    await getRedis().del(unreadCacheKey(userId));
  } catch (error) {
    logger.warn("Unread message cache invalidation failed", {
      userId,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

export async function invalidateUnreadCacheFor(
  userIds: readonly string[],
): Promise<void> {
  const unique = [...new Set(userIds)];
  if (unique.length === 0) return;
  try {
    await getRedis().del(...unique.map(unreadCacheKey));
  } catch (error) {
    logger.warn("Unread message cache invalidation failed", {
      users: unique.length,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

/**
 * Read-through cache around the authoritative DB count. A Redis failure falls
 * back to the loader, so the badge degrades to one query instead of breaking.
 */
export async function cachedUnreadMessageCount(
  viewerId: string,
  load: () => Promise<number>,
): Promise<number> {
  const cached = await readCachedUnreadCount(viewerId);
  if (cached !== null) return cached;
  const count = await load();
  await writeCachedUnreadCount(viewerId, count);
  return count;
}
