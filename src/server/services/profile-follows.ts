import { and, asc, count, desc, eq, inArray, or, sql } from "drizzle-orm";
import { getDb } from "@/server/db";
import {
  notifications,
  userBlocks,
  userFollows,
  users,
} from "@/server/db/schema";
import { errors } from "@/server/api/errors";
import { enforceRateLimit } from "@/server/api/rate-limit";
import type {
  FollowConnectionPage,
  FollowConnectionType,
  FollowState,
  FollowUserItem,
  PresenceInfo,
} from "@/lib/follow-types";
import { isBlockedEitherWay } from "./user-blocks";
import { presenceForTarget } from "./presence";
import {
  FOLLOW_PAGE_SIZE,
  FOLLOW_RATE_LIMIT,
  FOLLOW_RATE_WINDOW_SECONDS,
  OFFLINE_PRESENCE,
  clampFollowPage,
  decideFollowAction,
  deriveFollowFlags,
  findFollowTarget,
  followNoticeInput,
  followRequestDedupeKey,
  listedMemberWhere,
  readBlockState,
  readFollowCounts,
  readFollowEdges,
  readFollowState,
  safeNotify,
  safePresenceMap,
  shouldNotifyFollow,
  toPresenceTarget,
  type FollowViewer,
} from "./profile-follow-shared";
import { lockUserPair } from "./social-lock";

export type { FollowViewer } from "./profile-follow-shared";

export type ProfileSocialSummary = {
  followerCount: number;
  followingCount: number;
  isFollowing: boolean;
  requested: boolean;
  incomingRequest: boolean;
  blocked: boolean;
  blockedByViewer: boolean;
  canFollow: boolean;
  canMessage: boolean;
  presence: PresenceInfo;
};

export async function getProfileSocialSummary(
  userId: string,
  viewerId: string | null,
): Promise<ProfileSocialSummary> {
  const db = getDb();
  const [counts, edges, block, presenceRows] = await Promise.all([
    readFollowCounts(userId),
    viewerId
      ? readFollowEdges(viewerId, userId)
      : Promise.resolve({ forward: null, reverse: null }),
    viewerId
      ? readBlockState(viewerId, userId)
      : Promise.resolve({ blocked: false, blockedByViewer: false }),
    db
      .select({
        lastActiveAt: users.lastActiveAt,
        presenceVisibility: users.presenceVisibility,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1),
  ]);

  const flags = deriveFollowFlags({
    viewerId,
    targetId: userId,
    edges,
    blocked: block.blocked,
    blockedByViewer: block.blockedByViewer,
  });
  const presenceRow = presenceRows[0];
  const presence = presenceForTarget(
    {
      id: userId,
      lastActiveAt: presenceRow?.lastActiveAt ?? null,
      presenceVisibility: presenceRow?.presenceVisibility ?? "EVERYONE",
    },
    {
      viewerId,
      viewerFollowsTarget: flags.isFollowing,
      blocked: flags.blocked,
    },
  );

  return {
    followerCount: counts.followerCount,
    followingCount: counts.followingCount,
    ...flags,
    presence,
  };
}

export async function followUser(
  viewer: FollowViewer,
  username: string,
): Promise<FollowState> {
  const target = await findFollowTarget(username);
  if (target.id === viewer.id) {
    throw errors.validation("You cannot follow yourself.");
  }
  await enforceRateLimit(
    `profile-follow:${viewer.id}`,
    FOLLOW_RATE_LIMIT,
    FOLLOW_RATE_WINDOW_SECONDS,
    "You are following accounts too quickly. Please try again later.",
  );
  if (await isBlockedEitherWay(viewer.id, target.id)) {
    throw errors.forbidden("You cannot follow this user.");
  }

  const edges = await readFollowEdges(viewer.id, target.id);
  const action = decideFollowAction(edges);
  const db = getDb();

  if (action === "accept") {
    const now = new Date();
    await db.transaction(async (tx) => {
      await lockUserPair(tx, viewer.id, target.id);
      const [blocked] = await tx
        .select({ blockerId: userBlocks.blockerId })
        .from(userBlocks)
        .where(
          or(
            and(
              eq(userBlocks.blockerId, viewer.id),
              eq(userBlocks.blockedId, target.id),
            ),
            and(
              eq(userBlocks.blockerId, target.id),
              eq(userBlocks.blockedId, viewer.id),
            ),
          ),
        )
        .limit(1);
      if (blocked) throw errors.forbidden("You cannot follow this user.");
      await tx
        .insert(userFollows)
        .values({
          followerId: viewer.id,
          followingId: target.id,
          status: "ACCEPTED",
          acceptedAt: now,
        })
        .onConflictDoUpdate({
          target: [userFollows.followerId, userFollows.followingId],
          set: {
            status: "ACCEPTED",
            acceptedAt: sql`coalesce(${userFollows.acceptedAt}, now())`,
            updatedAt: now,
          },
        });
      await tx
        .update(userFollows)
        .set({ status: "ACCEPTED", acceptedAt: now, updatedAt: now })
        .where(
          and(
            eq(userFollows.followerId, target.id),
            eq(userFollows.followingId, viewer.id),
            eq(userFollows.status, "PENDING"),
          ),
        );
    });

    if (shouldNotifyFollow(target)) {
      await safeNotify(
        followNoticeInput({ target, viewer, accepted: true }),
      );
    }
  } else if (action === "request") {
    const created = await db.transaction(async (tx) => {
      await lockUserPair(tx, viewer.id, target.id);
      const [blocked] = await tx
        .select({ blockerId: userBlocks.blockerId })
        .from(userBlocks)
        .where(
          or(
            and(
              eq(userBlocks.blockerId, viewer.id),
              eq(userBlocks.blockedId, target.id),
            ),
            and(
              eq(userBlocks.blockerId, target.id),
              eq(userBlocks.blockedId, viewer.id),
            ),
          ),
        )
        .limit(1);
      if (blocked) throw errors.forbidden("You cannot follow this user.");
      const rows = await tx
        .insert(userFollows)
        .values({
          followerId: viewer.id,
          followingId: target.id,
          status: "PENDING",
        })
        .onConflictDoNothing()
        .returning({ followerId: userFollows.followerId });
      return rows[0] ?? null;
    });

    if (created && shouldNotifyFollow(target)) {
      await safeNotify(
        followNoticeInput({ target, viewer, accepted: false }),
      );
    }
  }

  return readFollowState(target.id, viewer.id);
}

export async function unfollowUser(
  viewer: FollowViewer,
  username: string,
): Promise<FollowState> {
  const target = await findFollowTarget(username);
  if (target.id === viewer.id) {
    throw errors.validation("You cannot unfollow yourself.");
  }
  await enforceRateLimit(
    `profile-unfollow:${viewer.id}`,
    FOLLOW_RATE_LIMIT,
    FOLLOW_RATE_WINDOW_SECONDS,
    "You are updating your follow list too quickly. Please try again later.",
  );

  const deleted = await getDb()
    .delete(userFollows)
    .where(
      and(
        eq(userFollows.followerId, viewer.id),
        eq(userFollows.followingId, target.id),
      ),
    )
    .returning({ status: userFollows.status });

  // Cancelling a request also clears its pending notice so a later request can
  // notify the target again despite the per-follower dedupe key.
  if (deleted.some((row) => row.status === "PENDING")) {
    await getDb()
      .delete(notifications)
      .where(
        and(
          eq(notifications.userId, target.id),
          eq(notifications.dedupeKey, followRequestDedupeKey(viewer.id)),
        ),
      );
  }

  return readFollowState(target.id, viewer.id);
}

async function readViewerFollows(
  viewerId: string,
  userIds: string[],
): Promise<Set<string>> {
  if (userIds.length === 0) return new Set();
  const rows = await getDb()
    .select({ followingId: userFollows.followingId })
    .from(userFollows)
    .where(
      and(
        eq(userFollows.followerId, viewerId),
        eq(userFollows.status, "ACCEPTED"),
        inArray(userFollows.followingId, userIds),
      ),
    );
  return new Set(rows.map((row) => row.followingId));
}

export async function listFollowConnections(
  username: string,
  type: FollowConnectionType,
  page: number,
  viewer: { id: string } | null,
): Promise<FollowConnectionPage | null> {
  const db = getDb();
  const [owner] = await db
    .select({
      id: users.id,
      username: users.username,
      displayName: users.displayName,
      isBanned: users.isBanned,
      avatarPreset: users.avatarPreset,
      avatarImageUpdatedAt: users.avatarImageUpdatedAt,
    })
    .from(users)
    .where(eq(users.username, username.trim().toLowerCase()))
    .limit(1);
  if (!owner || owner.isBanned) return null;

  const ownerColumn =
    type === "followers" ? userFollows.followingId : userFollows.followerId;
  const memberColumn =
    type === "followers" ? userFollows.followerId : userFollows.followingId;
  const where = listedMemberWhere({
    ownerId: owner.id,
    ownerColumn,
    memberColumn,
    viewerId: viewer?.id ?? null,
    status: "ACCEPTED",
  });

  const safePage = clampFollowPage(page);
  const [totalRow, rows] = await Promise.all([
    db
      .select({ value: count() })
      .from(userFollows)
      .innerJoin(users, eq(users.id, memberColumn))
      .where(where),
    db
      .select({
        id: users.id,
        username: users.username,
        displayName: users.displayName,
        institution: users.institution,
        rating: users.rating,
        lastActiveAt: users.lastActiveAt,
        presenceVisibility: users.presenceVisibility,
        avatarPreset: users.avatarPreset,
        avatarImageUpdatedAt: users.avatarImageUpdatedAt,
      })
      .from(userFollows)
      .innerJoin(users, eq(users.id, memberColumn))
      .where(where)
      .orderBy(desc(userFollows.createdAt), asc(memberColumn))
      .limit(FOLLOW_PAGE_SIZE)
      .offset((safePage - 1) * FOLLOW_PAGE_SIZE),
  ]);

  const presence = await safePresenceMap(
    rows.map((row) => toPresenceTarget(row)),
    viewer?.id ?? null,
  );
  const viewerFollows = viewer
    ? await readViewerFollows(
        viewer.id,
        rows.map((row) => row.id),
      )
    : new Set<string>();
  const total = Number(totalRow[0]?.value ?? 0);

  return {
    owner: {
      username: owner.username,
      displayName: owner.displayName,
      avatarPreset: owner.avatarPreset,
      avatarImageUpdatedAt:
        owner.avatarImageUpdatedAt?.toISOString() ?? null,
    },
    type,
    items: rows.map(
      (row): FollowUserItem => ({
        username: row.username,
        displayName: row.displayName,
        institution: row.institution,
        rating: row.rating,
        isFollowing: viewerFollows.has(row.id),
        isSelf: viewer?.id === row.id,
        presence: presence.get(row.id) ?? OFFLINE_PRESENCE,
        avatarPreset: row.avatarPreset,
        avatarImageUpdatedAt:
          row.avatarImageUpdatedAt?.toISOString() ?? null,
      }),
    ),
    total,
    page: safePage,
    pageSize: FOLLOW_PAGE_SIZE,
    totalPages: Math.max(1, Math.ceil(total / FOLLOW_PAGE_SIZE)),
  };
}

export {
  acceptFollowRequest,
  countPendingFollowRequests,
  declineFollowRequest,
  listFollowRequests,
} from "./profile-follow-requests";
