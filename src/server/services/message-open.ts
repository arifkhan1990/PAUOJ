import { and, eq, or } from "drizzle-orm";
import { getDb } from "@/server/db";
import {
  conversations,
  userBlocks,
  userFollows,
} from "@/server/db/schema";
import { errors } from "@/server/api/errors";
import { enforceRateLimit } from "@/server/api/rate-limit";
import { isBlockedEitherWay } from "./user-blocks";
import { lockUserPair } from "./social-lock";
import { normalizePair } from "./message-helpers";
import {
  findMessagingTarget,
  hasAcceptedFollowEitherWay,
} from "./message-queries";
import type { MessageViewer } from "./messages";

const OPEN_RATE_LIMIT = 20;
const OPEN_RATE_WINDOW_SECONDS = 60 * 60;

export async function openConversation(
  viewer: MessageViewer,
  username: string,
): Promise<{ id: string }> {
  const target = await findMessagingTarget(username);
  if (!target || target.isBanned) throw errors.notFound("User not found.");
  if (target.id === viewer.id) {
    throw errors.validation("You cannot start a conversation with yourself.");
  }
  if (await isBlockedEitherWay(viewer.id, target.id)) {
    throw errors.forbidden("You cannot message this person.");
  }
  if (!(await hasAcceptedFollowEitherWay(viewer.id, target.id))) {
    throw errors.forbidden(
      "The follow request between you must be accepted before you can message this person.",
    );
  }
  await enforceRateLimit(
    `message-open:${viewer.id}`,
    OPEN_RATE_LIMIT,
    OPEN_RATE_WINDOW_SECONDS,
    "You are opening conversations too quickly. Please try again later.",
  );

  const pair = normalizePair(viewer.id, target.id);
  // Re-check both gates inside the transaction so a concurrent block or
  // unfollow cannot slip a conversation in after the pre-flight check.
  const conversation = await getDb().transaction(async (tx) => {
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
    if (blocked) throw errors.forbidden("You cannot message this person.");

    const [follow] = await tx
      .select({ followerId: userFollows.followerId })
      .from(userFollows)
      .where(
        and(
          eq(userFollows.status, "ACCEPTED"),
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
        ),
      )
      .limit(1);
    if (!follow) {
      throw errors.forbidden(
        "The follow request between you must be accepted before you can message this person.",
      );
    }

    await tx
      .insert(conversations)
      .values({ userAId: pair.userAId, userBId: pair.userBId })
      .onConflictDoNothing();
    const [row] = await tx
      .select({ id: conversations.id })
      .from(conversations)
      .where(
        and(
          eq(conversations.userAId, pair.userAId),
          eq(conversations.userBId, pair.userBId),
        ),
      )
      .limit(1);
    return row ?? null;
  });
  if (!conversation) {
    throw errors.unavailable("Could not open the conversation. Please retry.");
  }
  return { id: conversation.id };
}