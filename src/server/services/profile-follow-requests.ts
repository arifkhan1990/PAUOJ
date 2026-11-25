import { and, asc, count, desc, eq, isNull } from "drizzle-orm";
import { getDb } from "@/server/db";
import { notifications, userFollows, users } from "@/server/db/schema";
import { errors } from "@/server/api/errors";
import { enforceRateLimit } from "@/server/api/rate-limit";
import type { FollowRequestPage, FollowState } from "@/lib/follow-types";
import {
  FOLLOW_PAGE_SIZE,
  FOLLOW_RATE_WINDOW_SECONDS,
  FOLLOW_REQUEST_RATE_LIMIT,
  OFFLINE_PRESENCE,
  clampFollowPage,
  findFollowTarget,
  followNoticeInput,
  followRequestDedupeKey,
  listedMemberWhere,
  readFollowState,
  safeNotify,
  safePresenceMap,
  shouldNotifyFollow,
  toPresenceTarget,
  type FollowViewer,
} from "./profile-follow-shared";

/** The pending edge a target sent to the viewer, or 404 when none exists. */
function incomingRequestMissing(): never {
  throw errors.notFound("No pending follow request from this user.");
}

export async function acceptFollowRequest(
  viewer: FollowViewer,
  username: string,
): Promise<FollowState> {
  const target = await findFollowTarget(username);
  await enforceRateLimit(
    `profile-follow-response:${viewer.id}`,
    FOLLOW_REQUEST_RATE_LIMIT,
    FOLLOW_RATE_WINDOW_SECONDS,
    "You are responding to follow requests too quickly. Please try again later.",
  );

  const now = new Date();
  const [accepted] = await getDb()
    .update(userFollows)
    .set({ status: "ACCEPTED", acceptedAt: now, updatedAt: now })
    .where(
      and(
        eq(userFollows.followerId, target.id),
        eq(userFollows.followingId, viewer.id),
        eq(userFollows.status, "PENDING"),
      ),
    )
    .returning({ followerId: userFollows.followerId });
  if (!accepted) incomingRequestMissing();

  await getDb()
    .update(notifications)
    .set({ readAt: now, updatedAt: now })
    .where(
      and(
        eq(notifications.userId, viewer.id),
        eq(notifications.dedupeKey, followRequestDedupeKey(target.id)),
        isNull(notifications.readAt),
      ),
    );

  if (shouldNotifyFollow(target)) {
    await safeNotify(followNoticeInput({ target, viewer, accepted: true }));
  }

  return readFollowState(target.id, viewer.id);
}

export async function declineFollowRequest(
  viewer: FollowViewer,
  username: string,
): Promise<FollowState> {
  const target = await findFollowTarget(username);
  await enforceRateLimit(
    `profile-follow-response:${viewer.id}`,
    FOLLOW_REQUEST_RATE_LIMIT,
    FOLLOW_RATE_WINDOW_SECONDS,
    "You are responding to follow requests too quickly. Please try again later.",
  );

  const [declined] = await getDb()
    .delete(userFollows)
    .where(
      and(
        eq(userFollows.followerId, target.id),
        eq(userFollows.followingId, viewer.id),
        eq(userFollows.status, "PENDING"),
      ),
    )
    .returning({ followerId: userFollows.followerId });
  if (!declined) incomingRequestMissing();

  // Declining clears the notice so a fresh request can notify again later.
  await getDb()
    .delete(notifications)
    .where(
      and(
        eq(notifications.userId, viewer.id),
        eq(notifications.dedupeKey, followRequestDedupeKey(target.id)),
      ),
    );

  return readFollowState(target.id, viewer.id);
}

export async function countPendingFollowRequests(
  viewerId: string,
): Promise<number> {
  const [row] = await getDb()
    .select({ value: count() })
    .from(userFollows)
    .innerJoin(users, eq(users.id, userFollows.followerId))
    .where(
      listedMemberWhere({
        ownerId: viewerId,
        ownerColumn: userFollows.followingId,
        memberColumn: userFollows.followerId,
        viewerId: null,
        status: "PENDING",
      }),
    );
  return Number(row?.value ?? 0);
}

export async function listFollowRequests(
  viewerId: string,
  page: number,
): Promise<FollowRequestPage> {
  const db = getDb();
  const safePage = clampFollowPage(page);
  const where = listedMemberWhere({
    ownerId: viewerId,
    ownerColumn: userFollows.followingId,
    memberColumn: userFollows.followerId,
    viewerId: null,
    status: "PENDING",
  });

  const [totalRow, rows] = await Promise.all([
    db
      .select({ value: count() })
      .from(userFollows)
      .innerJoin(users, eq(users.id, userFollows.followerId))
      .where(where),
    db
      .select({
        id: users.id,
        username: users.username,
        displayName: users.displayName,
        institution: users.institution,
        rating: users.rating,
        requestedAt: userFollows.createdAt,
        lastActiveAt: users.lastActiveAt,
        presenceVisibility: users.presenceVisibility,
        avatarPreset: users.avatarPreset,
        avatarImageUpdatedAt: users.avatarImageUpdatedAt,
      })
      .from(userFollows)
      .innerJoin(users, eq(users.id, userFollows.followerId))
      .where(where)
      .orderBy(desc(userFollows.createdAt), asc(userFollows.followerId))
      .limit(FOLLOW_PAGE_SIZE)
      .offset((safePage - 1) * FOLLOW_PAGE_SIZE),
  ]);

  const presence = await safePresenceMap(
    rows.map((row) => toPresenceTarget(row)),
    viewerId,
  );
  const total = Number(totalRow[0]?.value ?? 0);

  return {
    items: rows.map((row) => ({
      username: row.username,
      displayName: row.displayName,
      institution: row.institution,
      rating: row.rating,
      requestedAt: row.requestedAt.toISOString(),
      presence: presence.get(row.id) ?? OFFLINE_PRESENCE,
      avatarPreset: row.avatarPreset,
      avatarImageUpdatedAt:
        row.avatarImageUpdatedAt?.toISOString() ?? null,
    })),
    total,
    page: safePage,
    pageSize: FOLLOW_PAGE_SIZE,
    totalPages: Math.max(1, Math.ceil(total / FOLLOW_PAGE_SIZE)),
  };
}
