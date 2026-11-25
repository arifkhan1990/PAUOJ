import {
  and,
  asc,
  count,
  desc,
  eq,
  inArray,
  isNull,
  sql,
} from "drizzle-orm";
import { errors } from "@/server/api/errors";
import { toOffset } from "@/server/api/validation";
import { getDb } from "@/server/db";
import {
  lessonCommentVotes,
  lessonComments,
  lessonReactions,
  users,
} from "@/server/db/schema";
import type { CommentVote } from "@/lib/types";
import { getLearningModule } from "@/lib/learning/modules";
import { isMissingMigrationError } from "@/lib/db-errors";
import { logger } from "@/server/logger";
import { getRedis } from "@/server/redis";
import type { SafeUser } from "@/server/auth/session";
import {
  assembleComments,
  type DiscussionViewer,
} from "./discussion-mapper";
import {
  LESSON_DISCUSSION_PAGE_SIZE,
  type LessonCommentPage,
  type LessonReactionSummary,
  type LessonSocialData,
} from "@/lib/learning/social";

type Viewer = DiscussionViewer;

export function assertLessonTopic(moduleSlug: string, topicSlug: string) {
  const definition = getLearningModule(moduleSlug);
  if (
    !definition ||
    !definition.topics.some((topic) => topic.slug === topicSlug)
  ) {
    throw errors.notFound("Lesson not found.");
  }
  return definition;
}

const REACTION_CACHE_TTL_SECONDS = 30;

function reactionCountsKey(moduleSlug: string, topicSlug: string): string {
  return `lesson:reactions:${moduleSlug}:${topicSlug}`;
}

type ReactionCounts = { likes: number; dislikes: number };

async function readCachedReactionCounts(
  moduleSlug: string,
  topicSlug: string,
): Promise<ReactionCounts | null> {
  try {
    const raw = await getRedis().get(reactionCountsKey(moduleSlug, topicSlug));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<ReactionCounts>;
    return {
      likes: Number(parsed.likes ?? 0),
      dislikes: Number(parsed.dislikes ?? 0),
    };
  } catch {
    return null;
  }
}

async function cacheReactionCounts(
  moduleSlug: string,
  topicSlug: string,
  counts: ReactionCounts,
): Promise<void> {
  try {
    await getRedis().set(
      reactionCountsKey(moduleSlug, topicSlug),
      JSON.stringify(counts),
      "EX",
      REACTION_CACHE_TTL_SECONDS,
    );
  } catch {
    // Cache is best-effort; the aggregate query is always available.
  }
}

async function clearReactionCounts(
  moduleSlug: string,
  topicSlug: string,
): Promise<void> {
  try {
    await getRedis().del(reactionCountsKey(moduleSlug, topicSlug));
  } catch {
    // Invalidation is best-effort; the 30s TTL bounds staleness.
  }
}

function scoreExpression() {
  return sql<number>`coalesce((
    select sum(${lessonCommentVotes.value})
    from ${lessonCommentVotes}
    where ${lessonCommentVotes.commentId} = ${lessonComments.id}
  ), 0)::int`;
}

function myVoteExpression(viewerId: string | null) {
  if (!viewerId) return sql<number>`0`;
  return sql<number>`coalesce((
    select ${lessonCommentVotes.value}
    from ${lessonCommentVotes}
    where ${lessonCommentVotes.commentId} = ${lessonComments.id}
      and ${lessonCommentVotes.userId} = ${viewerId}
  ), 0)::int`;
}

function baseSelection(viewerId: string | null) {
  return {
    id: lessonComments.id,
    parentId: lessonComments.parentId,
    body: lessonComments.body,
    createdAt: lessonComments.createdAt,
    updatedAt: lessonComments.updatedAt,
    authorId: users.id,
    username: users.username,
    displayName: users.displayName,
    role: users.role,
    avatarPreset: users.avatarPreset,
    avatarImageUpdatedAt: users.avatarImageUpdatedAt,
    score: scoreExpression(),
    myVote: myVoteExpression(viewerId),
  };
}

export async function getLessonReactionSummary(
  moduleSlug: string,
  topicSlug: string,
  viewer: { id: string } | null,
): Promise<LessonReactionSummary> {
  assertLessonTopic(moduleSlug, topicSlug);
  const db = getDb();
  const where = and(
    eq(lessonReactions.moduleSlug, moduleSlug),
    eq(lessonReactions.topicSlug, topicSlug),
  );
  const viewerId = viewer?.id ?? null;
  const viewerRows = viewerId
    ? await db
        .select({ value: lessonReactions.value })
        .from(lessonReactions)
        .where(
          and(
            eq(lessonReactions.moduleSlug, moduleSlug),
            eq(lessonReactions.topicSlug, topicSlug),
            eq(lessonReactions.userId, viewerId),
          ),
        )
        .limit(1)
    : [];
  const viewerValue = Number(viewerRows[0]?.value ?? 0);
  const viewerReaction = (viewerValue === 1 || viewerValue === -1
    ? viewerValue
    : 0) as CommentVote;

  const cached = await readCachedReactionCounts(moduleSlug, topicSlug);
  if (cached) return { ...cached, viewer: viewerReaction };

  const [row] = await db
    .select({
      likes: sql<number>`count(*) filter (where ${lessonReactions.value} = 1)::int`,
      dislikes: sql<number>`count(*) filter (where ${lessonReactions.value} = -1)::int`,
    })
    .from(lessonReactions)
    .where(where);

  const counts = {
    likes: Number(row?.likes ?? 0),
    dislikes: Number(row?.dislikes ?? 0),
  };
  await cacheReactionCounts(moduleSlug, topicSlug, counts);

  return { ...counts, viewer: viewerReaction };
}

export async function setLessonReaction(
  moduleSlug: string,
  topicSlug: string,
  user: Pick<SafeUser, "id">,
  value: CommentVote,
): Promise<LessonReactionSummary> {
  assertLessonTopic(moduleSlug, topicSlug);
  const db = getDb();

  if (value === 0) {
    await db
      .delete(lessonReactions)
      .where(
        and(
          eq(lessonReactions.moduleSlug, moduleSlug),
          eq(lessonReactions.topicSlug, topicSlug),
          eq(lessonReactions.userId, user.id),
        ),
      );
  } else {
    await db
      .insert(lessonReactions)
      .values({ moduleSlug, topicSlug, userId: user.id, value })
      .onConflictDoUpdate({
        target: [
          lessonReactions.moduleSlug,
          lessonReactions.topicSlug,
          lessonReactions.userId,
        ],
        set: { value, updatedAt: new Date() },
      });
  }

  await clearReactionCounts(moduleSlug, topicSlug);
  return getLessonReactionSummary(moduleSlug, topicSlug, user);
}

export async function listLessonComments(
  moduleSlug: string,
  topicSlug: string,
  viewer: Viewer,
  page: number,
): Promise<LessonCommentPage> {
  assertLessonTopic(moduleSlug, topicSlug);
  const db = getDb();
  const selection = baseSelection(viewer?.id ?? null);
  const where = and(
    eq(lessonComments.moduleSlug, moduleSlug),
    eq(lessonComments.topicSlug, topicSlug),
    isNull(lessonComments.parentId),
    isNull(lessonComments.deletedAt),
  );

  const rows = await db
    .select({ ...selection, total: sql<number>`count(*) over()::int` })
    .from(lessonComments)
    .innerJoin(users, eq(users.id, lessonComments.userId))
    .where(where)
    .orderBy(desc(lessonComments.createdAt))
    .limit(LESSON_DISCUSSION_PAGE_SIZE)
    .offset(toOffset({ page, pageSize: LESSON_DISCUSSION_PAGE_SIZE }));

  // Window count is empty for out-of-range pages, so fall back to a count there.
  let total = Number(rows[0]?.total ?? 0);
  if (rows.length === 0 && page > 1) {
    const [totalRows] = await db
      .select({ value: count() })
      .from(lessonComments)
      .where(where);
    total = Number(totalRows?.value ?? 0);
  }

  const topIds = rows.map((row) => row.id);
  const replies =
    topIds.length > 0
      ? await db
          .select(selection)
          .from(lessonComments)
          .innerJoin(users, eq(users.id, lessonComments.userId))
          .where(
            and(
              eq(lessonComments.moduleSlug, moduleSlug),
              eq(lessonComments.topicSlug, topicSlug),
              inArray(lessonComments.parentId, topIds),
              isNull(lessonComments.deletedAt),
            ),
          )
          .orderBy(asc(lessonComments.createdAt))
      : [];

  return {
    items: assembleComments(rows, replies, viewer),
    total,
  };
}

export async function getLessonSocial(
  moduleSlug: string,
  topicSlug: string,
  viewer: Viewer,
): Promise<LessonSocialData | null> {
  try {
    const [reactions, comments] = await Promise.all([
      getLessonReactionSummary(moduleSlug, topicSlug, viewer),
      listLessonComments(moduleSlug, topicSlug, viewer, 1),
    ]);
    return { reactions, comments };
  } catch (error) {
    if (isMissingMigrationError(error)) {
      logger.warn(
        "Lesson reactions/discussion is unavailable; apply the latest migration.",
        { moduleSlug, topicSlug },
      );
      return null;
    }
    throw error;
  }
}
