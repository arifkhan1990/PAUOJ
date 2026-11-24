import { and, asc, count, desc, eq, inArray } from "drizzle-orm";
import { getDb } from "@/server/db";
import { userFollows, users } from "@/server/db/schema";
import { errors } from "@/server/api/errors";
import { enforceRateLimit } from "@/server/api/rate-limit";
import type {
  FollowConnectionPage,
  FollowConnectionType,
  FollowState,
  FollowUserItem,
} from "@/lib/follow-types";
import { logger } from "@/server/logger";
import { notifyUser } from "./notifications";

const CONNECTIONS_PAGE_SIZE = 20;
const MAX_CONNECTIONS_PAGE = 10_000;
const FOLLOW_RATE_LIMIT = 40;
const FOLLOW_RATE_WINDOW_SECONDS = 60 * 60;

export type FollowViewer = {
  id: string;
  username: string;
  displayName: string;
};

type FollowTarget = { id: string };

async function findFollowTarget(username: string): Promise<FollowTarget> {
  const [target] = await getDb()
    .select({ id: users.id, isBanned: users.isBanned })
    .from(users)
    .where(eq(users.username, username.trim().toLowerCase()))
    .limit(1);
  if (!target || target.isBanned) throw errors.notFound("User not found.");
  return target;
}

async function readFollowCounts(
  userId: string,
): Promise<{ followerCount: number; followingCount: number }> {
  const db = getDb();
  const [followerRow, followingRow] = await Promise.all([
    db
      .select({ value: count() })
      .from(userFollows)
      .innerJoin(users, eq(users.id, userFollows.followerId))
      .where(
        and(eq(userFollows.followingId, userId), eq(users.isBanned, false)),
      ),
    db
      .select({ value: count() })
      .from(userFollows)
      .innerJoin(users, eq(users.id, userFollows.followingId))
      .where(
        and(eq(userFollows.followerId, userId), eq(users.isBanned, false)),
      ),
  ]);

  return {
    followerCount: Number(followerRow[0]?.value ?? 0),
    followingCount: Number(followingRow[0]?.value ?? 0),
  };
}

async function readFollowState(
  userId: string,
  viewerId: string,
): Promise<FollowState> {
  const [counts, edge] = await Promise.all([
    readFollowCounts(userId),
    getDb()
      .select({ followerId: userFollows.followerId })
      .from(userFollows)
      .where(
        and(
          eq(userFollows.followerId, viewerId),
          eq(userFollows.followingId, userId),
        ),
      )
      .limit(1),
  ]);

  return {
    following: edge.length > 0,
    followerCount: counts.followerCount,
    followingCount: counts.followingCount,
  };
}

export async function getProfileSocialSummary(
  userId: string,
  viewerId: string | null,
): Promise<{
  followerCount: number;
  followingCount: number;
  isFollowing: boolean;
  canFollow: boolean;
}> {
  const [counts, edge] = await Promise.all([
    readFollowCounts(userId),
    viewerId
      ? getDb()
          .select({ followerId: userFollows.followerId })
          .from(userFollows)
          .where(
            and(
              eq(userFollows.followerId, viewerId),
              eq(userFollows.followingId, userId),
            ),
          )
          .limit(1)
      : Promise.resolve([]),
  ]);

  return {
    followerCount: counts.followerCount,
    followingCount: counts.followingCount,
    isFollowing: edge.length > 0,
    canFollow: viewerId !== null && viewerId !== userId,
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

  const [created] = await getDb()
    .insert(userFollows)
    .values({ followerId: viewer.id, followingId: target.id })
    .onConflictDoNothing()
    .returning({ followerId: userFollows.followerId });

  if (created) {
    try {
      await notifyUser({
        userId: target.id,
        type: "FOLLOW",
        title: "New follower",
        body: `${viewer.displayName} (@${viewer.username}) started following you.`,
        href: `/users/${viewer.username}`,
        dedupeKey: `follow:${viewer.id}`,
      });
    } catch (error) {
      logger.warn("Follow notification failed", {
        userId: target.id,
        error: error instanceof Error ? error.message : String(error),
      });
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
    throw errors.validation("You cannot follow yourself.");
  }
  await enforceRateLimit(
    `profile-unfollow:${viewer.id}`,
    FOLLOW_RATE_LIMIT,
    FOLLOW_RATE_WINDOW_SECONDS,
    "You are updating your follow list too quickly. Please try again later.",
  );

  await getDb()
    .delete(userFollows)
    .where(
      and(
        eq(userFollows.followerId, viewer.id),
        eq(userFollows.followingId, target.id),
      ),
    );

  return readFollowState(target.id, viewer.id);
}

async function readConnectionRows(
  ownerId: string,
  type: FollowConnectionType,
  page: number,
): Promise<{ items: (FollowUserItem & { id: string })[]; total: number }> {
  const db = getDb();
  const ownerColumn =
    type === "followers" ? userFollows.followingId : userFollows.followerId;
  const memberColumn =
    type === "followers" ? userFollows.followerId : userFollows.followingId;
  const where = and(eq(ownerColumn, ownerId), eq(users.isBanned, false));

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
      })
      .from(userFollows)
      .innerJoin(users, eq(users.id, memberColumn))
      .where(where)
      .orderBy(desc(userFollows.createdAt), asc(memberColumn))
      .limit(CONNECTIONS_PAGE_SIZE)
      .offset((page - 1) * CONNECTIONS_PAGE_SIZE),
  ]);

  return {
    total: Number(totalRow[0]?.value ?? 0),
    items: rows.map((row) => ({
      id: row.id,
      username: row.username,
      displayName: row.displayName,
      institution: row.institution,
      rating: row.rating,
      isFollowing: false,
      isSelf: false,
    })),
  };
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
    })
    .from(users)
    .where(eq(users.username, username.trim().toLowerCase()))
    .limit(1);
  if (!owner || owner.isBanned) return null;

  const safePage = Math.min(
    MAX_CONNECTIONS_PAGE,
    Math.max(1, Math.trunc(page) || 1),
  );
  const { items, total } = await readConnectionRows(owner.id, type, safePage);
  const viewerFollows = viewer
    ? await readViewerFollows(
        viewer.id,
        items.map((item) => item.id),
      )
    : new Set<string>();

  return {
    owner: { username: owner.username, displayName: owner.displayName },
    type,
    items: items.map(({ id, ...item }) => ({
      ...item,
      isFollowing: viewerFollows.has(id),
      isSelf: viewer?.id === id,
    })),
    total,
    page: safePage,
    pageSize: CONNECTIONS_PAGE_SIZE,
    totalPages: Math.max(1, Math.ceil(total / CONNECTIONS_PAGE_SIZE)),
  };
}
