import { and, eq, or, sql, type SQL } from "drizzle-orm";
import type { PgColumn } from "drizzle-orm/pg-core";
import { getDb } from "@/server/db";
import { userBlocks, userFollows, users } from "@/server/db/schema";
import { errors } from "@/server/api/errors";
import type { FollowState, PresenceInfo } from "@/lib/follow-types";
import { logger } from "@/server/logger";
import { notifyUser } from "./notifications";
import {
  loadPresenceMap,
  type PresenceTarget,
  type PresenceVisibility,
} from "./presence";

export const OFFLINE_PRESENCE: PresenceInfo = {
  state: "OFFLINE",
  label: null,
};

export const FOLLOW_PAGE_SIZE = 20;
export const MAX_FOLLOW_PAGE = 10_000;
export const FOLLOW_RATE_LIMIT = 40;
export const FOLLOW_RATE_WINDOW_SECONDS = 60 * 60;
export const FOLLOW_REQUEST_RATE_LIMIT = 60;

export type FollowViewer = {
  id: string;
  username: string;
  displayName: string;
};

export type FollowTarget = {
  id: string;
  lastActiveAt: Date | null;
  presenceVisibility: PresenceVisibility;
  notifyFollows: boolean;
};

export type FollowEdgeStatus = "PENDING" | "ACCEPTED" | null;

export type FollowEdges = {
  forward: FollowEdgeStatus;
  reverse: FollowEdgeStatus;
};

export type FollowAction = "noop" | "accept" | "request";

export type FollowFlags = {
  isFollowing: boolean;
  requested: boolean;
  incomingRequest: boolean;
  blocked: boolean;
  blockedByViewer: boolean;
  canFollow: boolean;
  canMessage: boolean;
};

export async function findFollowTarget(
  username: string,
): Promise<FollowTarget> {
  const [target] = await getDb()
    .select({
      id: users.id,
      lastActiveAt: users.lastActiveAt,
      presenceVisibility: users.presenceVisibility,
      notifyFollows: users.notifyFollows,
      isBanned: users.isBanned,
    })
    .from(users)
    .where(eq(users.username, username.trim().toLowerCase()))
    .limit(1);
  if (!target || target.isBanned) throw errors.notFound("User not found.");
  return {
    id: target.id,
    lastActiveAt: target.lastActiveAt,
    presenceVisibility: target.presenceVisibility,
    notifyFollows: target.notifyFollows,
  };
}

/**
 * Follow notices are in-app only, and a target who turned them off still gets
 * the edge: the notice is simply skipped. Used by follow, mutual accept, and
 * request acceptance.
 */
export function shouldNotifyFollow(target: {
  notifyFollows: boolean;
}): boolean {
  return target.notifyFollows;
}

export function clampFollowPage(page: number): number {
  return Math.min(MAX_FOLLOW_PAGE, Math.max(1, Math.trunc(page) || 1));
}

export function followRequestDedupeKey(viewerId: string): string {
  return `follow-request:${viewerId}`;
}

export function followAcceptedDedupeKey(viewerId: string): string {
  return `follow-accepted:${viewerId}`;
}

/**
 * A mutual request is auto-accepted: if the target already asked to follow the
 * viewer, the viewer's follow completes both edges instead of queueing a second
 * request. An existing accepted forward edge is idempotent.
 */
export function decideFollowAction(edges: FollowEdges): FollowAction {
  if (edges.forward === "ACCEPTED") return "noop";
  if (edges.reverse === "PENDING") return "accept";
  return "request";
}

export function deriveFollowFlags(input: {
  viewerId: string | null;
  targetId: string;
  edges: FollowEdges;
  blocked: boolean;
  blockedByViewer: boolean;
}): FollowFlags {
  const isSelf = input.viewerId !== null && input.viewerId === input.targetId;
  return {
    isFollowing: input.edges.forward === "ACCEPTED",
    requested: input.edges.forward === "PENDING",
    incomingRequest: input.edges.reverse === "PENDING",
    blocked: input.blocked,
    blockedByViewer: input.blockedByViewer,
    canFollow: input.viewerId !== null && !isSelf && !input.blocked,
    canMessage:
      !input.blocked &&
      (input.edges.forward === "ACCEPTED" ||
        input.edges.reverse === "ACCEPTED"),
  };
}

/**
 * Correlated `not exists` guard used by connection and request lists so a block
 * in either direction hides the member from the list owner and viewer.
 */
export function notBlockedWith(userId: string, memberId: PgColumn): SQL {
  return sql`not exists (select 1 from ${userBlocks} where (
    (${userBlocks.blockerId} = ${userId} and ${userBlocks.blockedId} = ${memberId})
    or (${userBlocks.blockerId} = ${memberId} and ${userBlocks.blockedId} = ${userId})
  ))`;
}

/**
 * Shared row filter for follow connections and incoming requests: only live
 * edges, never banned accounts, and never a member blocked by the list owner
 * or the viewer.
 */
export function listedMemberWhere(input: {
  ownerId: string;
  ownerColumn: PgColumn;
  memberColumn: PgColumn;
  viewerId: string | null;
  status: "ACCEPTED" | "PENDING";
}): SQL {
  const viewerFilter =
    input.viewerId && input.viewerId !== input.ownerId
      ? notBlockedWith(input.viewerId, input.memberColumn)
      : undefined;
  return and(
    eq(input.ownerColumn, input.ownerId),
    eq(userFollows.status, input.status),
    eq(users.isBanned, false),
    notBlockedWith(input.ownerId, input.memberColumn),
    viewerFilter,
  )!;
}

export async function readFollowCounts(
  userId: string,
): Promise<{ followerCount: number; followingCount: number }> {
  const db = getDb();
  const [followerRow, followingRow] = await Promise.all([
    db
      .select({ value: sql<number>`count(*)::int` })
      .from(userFollows)
      .innerJoin(users, eq(users.id, userFollows.followerId))
      .where(
        and(
          eq(userFollows.followingId, userId),
          eq(userFollows.status, "ACCEPTED"),
          eq(users.isBanned, false),
        ),
      ),
    db
      .select({ value: sql<number>`count(*)::int` })
      .from(userFollows)
      .innerJoin(users, eq(users.id, userFollows.followingId))
      .where(
        and(
          eq(userFollows.followerId, userId),
          eq(userFollows.status, "ACCEPTED"),
          eq(users.isBanned, false),
        ),
      ),
  ]);

  return {
    followerCount: Number(followerRow[0]?.value ?? 0),
    followingCount: Number(followingRow[0]?.value ?? 0),
  };
}

export async function readFollowEdges(
  viewerId: string,
  targetId: string,
): Promise<FollowEdges> {
  const rows = await getDb()
    .select({
      followerId: userFollows.followerId,
      followingId: userFollows.followingId,
      status: userFollows.status,
    })
    .from(userFollows)
    .where(
      or(
        and(
          eq(userFollows.followerId, viewerId),
          eq(userFollows.followingId, targetId),
        ),
        and(
          eq(userFollows.followerId, targetId),
          eq(userFollows.followingId, viewerId),
        ),
      ),
    );

  let forward: FollowEdgeStatus = null;
  let reverse: FollowEdgeStatus = null;
  for (const row of rows) {
    if (row.followerId === viewerId) forward = row.status;
    if (row.followerId === targetId) reverse = row.status;
  }
  return { forward, reverse };
}

export async function readBlockState(
  viewerId: string,
  targetId: string,
): Promise<{ blocked: boolean; blockedByViewer: boolean }> {
  const rows = await getDb()
    .select({
      blockerId: userBlocks.blockerId,
      blockedId: userBlocks.blockedId,
    })
    .from(userBlocks)
    .where(
      or(
        and(
          eq(userBlocks.blockerId, viewerId),
          eq(userBlocks.blockedId, targetId),
        ),
        and(
          eq(userBlocks.blockerId, targetId),
          eq(userBlocks.blockedId, viewerId),
        ),
      ),
    );

  return {
    blocked: rows.length > 0,
    blockedByViewer: rows.some(
      (row) => row.blockerId === viewerId && row.blockedId === targetId,
    ),
  };
}

export async function readFollowState(
  userId: string,
  viewerId: string,
): Promise<FollowState> {
  const [counts, edges, block] = await Promise.all([
    readFollowCounts(userId),
    readFollowEdges(viewerId, userId),
    readBlockState(viewerId, userId),
  ]);
  const flags = deriveFollowFlags({
    viewerId,
    targetId: userId,
    edges,
    blocked: block.blocked,
    blockedByViewer: block.blockedByViewer,
  });

  return {
    following: flags.isFollowing,
    requested: flags.requested,
    incomingRequest: flags.incomingRequest,
    followerCount: counts.followerCount,
    followingCount: counts.followingCount,
    blocked: flags.blocked,
    canMessage: flags.canMessage,
  };
}

export function toPresenceTarget(input: {
  id: string;
  lastActiveAt: Date | null;
  presenceVisibility: PresenceVisibility;
}): PresenceTarget {
  return {
    id: input.id,
    lastActiveAt: input.lastActiveAt,
    presenceVisibility: input.presenceVisibility,
  };
}

/** Presence is best-effort: an outage downgrades to offline, it never fails. */
export async function safePresenceMap(
  targets: PresenceTarget[],
  viewerId: string | null,
): Promise<Map<string, PresenceInfo>> {
  try {
    return await loadPresenceMap(targets, viewerId);
  } catch (error) {
    logger.warn("Presence lookup failed", {
      viewerId,
      error: error instanceof Error ? error.message : String(error),
    });
    return new Map();
  }
}

/** Notifications are best-effort too; a mail/insert failure never fails a follow. */
export async function safeNotify(
  input: Parameters<typeof notifyUser>[0],
): Promise<void> {
  try {
    await notifyUser(input);
  } catch (error) {
    logger.warn("Follow notification failed", {
      userId: input.userId,
      type: input.type,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}
