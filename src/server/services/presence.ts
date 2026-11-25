import { and, eq, inArray } from "drizzle-orm";
import { getDb } from "@/server/db";
import { userFollows, users } from "@/server/db/schema";
import { getRedis } from "@/server/redis";
import { logger } from "@/server/logger";
import type { PresenceInfo } from "@/lib/follow-types";

export const PRESENCE_ONLINE_WINDOW_MS = 5 * 60 * 1000;
const PRESENCE_TOUCH_THROTTLE_SECONDS = 60;
const PRESENCE_TOUCH_THROTTLE_MS = PRESENCE_TOUCH_THROTTLE_SECONDS * 1000;
const TOUCH_FALLBACK_PRUNE_SIZE = 5_000;

/** Shown when a user has never recorded activity. */
export const NO_ACTIVITY_PRESENCE: PresenceInfo = {
  state: "OFFLINE",
  label: "No recent activity",
};

export type PresenceVisibility = "EVERYONE" | "FOLLOWERS" | "NOBODY";

export type PresenceTarget = {
  id: string;
  lastActiveAt: Date | null;
  presenceVisibility: PresenceVisibility;
};

/**
 * One floor-based ladder: minutes, hours, days, weeks, months, years. Coarse
 * buckets keep every surface consistent and never leak an exact timestamp.
 */
function formatRelativeAge(elapsedMs: number): string {
  const minutes = Math.floor(elapsedMs / 60_000);
  if (minutes < 60) return `${minutes}m`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;

  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `${weeks}w`;

  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo`;

  // 360-364 days already round down to 0 years; the bucket starts at 1.
  return `${Math.max(1, Math.floor(days / 365))}y`;
}

/**
 * Turns a last-active timestamp into a coarse, server-computed label. Exact
 * timestamps are never sent to clients, which keeps the privacy boundary in
 * one place and avoids clock-skew labels.
 */
export function presenceLabel(
  lastActiveAt: Date | null,
  now: Date = new Date(),
): PresenceInfo {
  if (!lastActiveAt) return NO_ACTIVITY_PRESENCE;
  // A future timestamp (clock skew) reads as "just now" instead of a negative age.
  const elapsed = Math.max(0, now.getTime() - lastActiveAt.getTime());
  if (elapsed <= PRESENCE_ONLINE_WINDOW_MS) {
    return { state: "ONLINE", label: "Online now" };
  }
  return {
    state: "RECENT",
    label: `Last active ${formatRelativeAge(elapsed)} ago`,
  };
}

export function presenceForTarget(
  target: PresenceTarget,
  options: {
    viewerId: string | null;
    viewerFollowsTarget: boolean;
    blocked: boolean;
    now?: Date;
  },
): PresenceInfo {
  if (target.id === options.viewerId) {
    return presenceLabel(target.lastActiveAt, options.now);
  }
  if (options.blocked) return { state: "HIDDEN", label: null };
  if (target.presenceVisibility === "NOBODY") {
    return { state: "HIDDEN", label: null };
  }
  if (
    target.presenceVisibility === "FOLLOWERS" &&
    !options.viewerFollowsTarget
  ) {
    return { state: "HIDDEN", label: null };
  }
  return presenceLabel(target.lastActiveAt, options.now);
}

/**
 * Per-process throttle used only while Redis is unreachable, so an outage
 * cannot turn every request into a `users.last_active_at` write.
 */
const touchFallback = new Map<string, number>();

function fallbackTouchAllowed(userId: string, now: number): boolean {
  const last = touchFallback.get(userId);
  if (last !== undefined && now - last < PRESENCE_TOUCH_THROTTLE_MS) {
    return false;
  }
  if (touchFallback.size >= TOUCH_FALLBACK_PRUNE_SIZE) {
    for (const [id, touchedAt] of touchFallback) {
      if (now - touchedAt >= PRESENCE_TOUCH_THROTTLE_MS) {
        touchFallback.delete(id);
      }
    }
  }
  touchFallback.set(userId, now);
  return true;
}

/**
 * Records activity at most once a minute per user. Redis is best-effort: a
 * cache outage must never break authentication or page rendering.
 */
export async function touchPresence(userId: string): Promise<void> {
  try {
    const redis = getRedis();
    const throttleKey = `presence:touch:${userId}`;
    const acquired = await redis.set(
      throttleKey,
      "1",
      "EX",
      PRESENCE_TOUCH_THROTTLE_SECONDS,
      "NX",
    );
    if (!acquired) return;
  } catch (error) {
    logger.warn("Presence throttle unavailable", {
      userId,
      error: error instanceof Error ? error.message : String(error),
    });
    if (!fallbackTouchAllowed(userId, Date.now())) return;
  }

  try {
    await getDb()
      .update(users)
      .set({ lastActiveAt: new Date(), updatedAt: new Date() })
      .where(eq(users.id, userId));
  } catch (error) {
    logger.warn("Presence update failed", {
      userId,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

export function isOnline(lastActiveAt: Date | null, now: Date = new Date()) {
  return (
    lastActiveAt !== null &&
    now.getTime() - lastActiveAt.getTime() <= PRESENCE_ONLINE_WINDOW_MS
  );
}

/**
 * Resolves presence for a list of users in one follow query. Used by the
 * connections, requests, messaging and rank lists to avoid an N+1 lookup.
 */
export async function loadPresenceMap(
  targets: PresenceTarget[],
  viewerId: string | null,
  blockedIds: Set<string> = new Set(),
): Promise<Map<string, PresenceInfo>> {
  const result = new Map<string, PresenceInfo>();
  if (targets.length === 0) return result;

  const followerScoped = targets.filter(
    (target) =>
      target.presenceVisibility === "FOLLOWERS" &&
      target.id !== viewerId &&
      !blockedIds.has(target.id),
  );

  let viewerFollows = new Set<string>();
  if (viewerId && followerScoped.length > 0) {
    const rows = await getDb()
      .select({ followingId: userFollows.followingId })
      .from(userFollows)
      .where(
        and(
          eq(userFollows.followerId, viewerId),
          eq(userFollows.status, "ACCEPTED"),
          inArray(
            userFollows.followingId,
            followerScoped.map((target) => target.id),
          ),
        ),
      );
    viewerFollows = new Set(rows.map((row) => row.followingId));
  }

  for (const target of targets) {
    result.set(
      target.id,
      presenceForTarget(target, {
        viewerId,
        viewerFollowsTarget: viewerFollows.has(target.id),
        blocked: blockedIds.has(target.id),
      }),
    );
  }
  return result;
}

/**
 * Re-keys a resolved presence map by username for list rows, falling back to
 * "No recent activity" when a row has no matching presence record.
 */
export function presenceByUsername(
  rows: Array<{ id: string; username: string }>,
  presence: Map<string, PresenceInfo>,
): Map<string, PresenceInfo> {
  const byUsername = new Map<string, PresenceInfo>();
  for (const row of rows) {
    byUsername.set(row.username, presence.get(row.id) ?? NO_ACTIVITY_PRESENCE);
  }
  return byUsername;
}
