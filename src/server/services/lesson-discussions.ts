import {
  and,
  asc,
  count,
  desc,
  eq,
  inArray,
  isNull,
  or,
  sql,
} from "drizzle-orm";
import { errors } from "@/server/api/errors";
import { toOffset } from "@/server/api/validation";
import { getDb } from "@/server/db";
import {
  auditLogs,
  lessonCommentVotes,
  lessonComments,
  lessonReactions,
  users,
} from "@/server/db/schema";
import type { CommentVote, ProblemComment } from "@/lib/types";
import type { CreateCommentInput } from "@/lib/schemas/discussion";
import { getLearningModule } from "@/lib/learning/modules";
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

function assertTopic(moduleSlug: string, topicSlug: string) {
  const definition = getLearningModule(moduleSlug);
  if (
    !definition ||
    !definition.topics.some((topic) => topic.slug === topicSlug)
  ) {
    throw errors.notFound("Lesson not found.");
  }
  return definition;
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
    score: scoreExpression(),
    myVote: myVoteExpression(viewerId),
  };
}

export async function getLessonReactionSummary(
  moduleSlug: string,
  topicSlug: string,
  viewer: { id: string } | null,
): Promise<LessonReactionSummary> {
  assertTopic(moduleSlug, topicSlug);
  const db = getDb();
  const where = and(
    eq(lessonReactions.moduleSlug, moduleSlug),
    eq(lessonReactions.topicSlug, topicSlug),
  );

  const [grouped, mine] = await Promise.all([
    db
      .select({ value: lessonReactions.value, total: count() })
      .from(lessonReactions)
      .where(where)
      .groupBy(lessonReactions.value),
    viewer
      ? db
          .select({ value: lessonReactions.value })
          .from(lessonReactions)
          .where(and(where, eq(lessonReactions.userId, viewer.id)))
          .limit(1)
      : Promise.resolve([]),
  ]);

  const totalFor = (value: number) =>
    Number(grouped.find((row) => row.value === value)?.total ?? 0);
  const viewerValue = Number(mine[0]?.value ?? 0);

  return {
    likes: totalFor(1),
    dislikes: totalFor(-1),
    viewer: (viewerValue === 1 || viewerValue === -1 ? viewerValue : 0) as CommentVote,
  };
}

export async function setLessonReaction(
  moduleSlug: string,
  topicSlug: string,
  user: Pick<SafeUser, "id">,
  value: CommentVote,
): Promise<LessonReactionSummary> {
  assertTopic(moduleSlug, topicSlug);
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

  return getLessonReactionSummary(moduleSlug, topicSlug, user);
}

export async function listLessonComments(
  moduleSlug: string,
  topicSlug: string,
  viewer: Viewer,
  page: number,
): Promise<LessonCommentPage> {
  assertTopic(moduleSlug, topicSlug);
  const db = getDb();
  const selection = baseSelection(viewer?.id ?? null);
  const where = and(
    eq(lessonComments.moduleSlug, moduleSlug),
    eq(lessonComments.topicSlug, topicSlug),
    isNull(lessonComments.parentId),
    isNull(lessonComments.deletedAt),
  );

  const [totalRows, rows] = await Promise.all([
    db.select({ value: count() }).from(lessonComments).where(where),
    db
      .select(selection)
      .from(lessonComments)
      .innerJoin(users, eq(users.id, lessonComments.userId))
      .where(where)
      .orderBy(desc(lessonComments.createdAt))
      .limit(LESSON_DISCUSSION_PAGE_SIZE)
      .offset(toOffset({ page, pageSize: LESSON_DISCUSSION_PAGE_SIZE })),
  ]);

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
    total: Number(totalRows[0]?.value ?? 0),
  };
}

export async function getLessonSocial(
  moduleSlug: string,
  topicSlug: string,
  viewer: Viewer,
): Promise<LessonSocialData> {
  const [reactions, comments] = await Promise.all([
    getLessonReactionSummary(moduleSlug, topicSlug, viewer),
    listLessonComments(moduleSlug, topicSlug, viewer, 1),
  ]);
  return { reactions, comments };
}

export async function createLessonComment(
  moduleSlug: string,
  topicSlug: string,
  user: Pick<SafeUser, "id" | "username" | "displayName" | "role">,
  input: CreateCommentInput,
): Promise<ProblemComment> {
  assertTopic(moduleSlug, topicSlug);
  const db = getDb();

  if (input.parentId) {
    const rows = await db
      .select({
        id: lessonComments.id,
        moduleSlug: lessonComments.moduleSlug,
        topicSlug: lessonComments.topicSlug,
        parentId: lessonComments.parentId,
        deletedAt: lessonComments.deletedAt,
      })
      .from(lessonComments)
      .where(eq(lessonComments.id, input.parentId))
      .limit(1);
    const parent = rows[0];
    if (
      !parent ||
      parent.deletedAt ||
      parent.moduleSlug !== moduleSlug ||
      parent.topicSlug !== topicSlug
    ) {
      throw errors.validation("The comment you are replying to is unavailable.");
    }
    if (parent.parentId) {
      throw errors.validation("Replies can only be one level deep.");
    }
  }

  const now = new Date();
  const rows = await db
    .insert(lessonComments)
    .values({
      moduleSlug,
      topicSlug,
      userId: user.id,
      parentId: input.parentId ?? null,
      body: input.body,
      createdAt: now,
      updatedAt: now,
    })
    .returning({
      id: lessonComments.id,
      body: lessonComments.body,
      createdAt: lessonComments.createdAt,
      updatedAt: lessonComments.updatedAt,
    });
  const comment = rows[0];
  if (!comment) throw errors.unavailable("Could not save your comment.");

  return {
    id: comment.id,
    body: comment.body,
    createdAt: comment.createdAt.toISOString(),
    updatedAt: comment.updatedAt.toISOString(),
    score: 0,
    myVote: 0,
    canDelete: true,
    author: {
      id: user.id,
      username: user.username,
      displayName: user.displayName,
      role: user.role,
    },
    replies: [],
  };
}

export async function deleteLessonComment(
  moduleSlug: string,
  topicSlug: string,
  user: Pick<SafeUser, "id" | "role">,
  commentId: string,
): Promise<void> {
  assertTopic(moduleSlug, topicSlug);
  const db = getDb();
  const rows = await db
    .select({
      id: lessonComments.id,
      userId: lessonComments.userId,
      parentId: lessonComments.parentId,
      deletedAt: lessonComments.deletedAt,
    })
    .from(lessonComments)
    .where(
      and(
        eq(lessonComments.id, commentId),
        eq(lessonComments.moduleSlug, moduleSlug),
        eq(lessonComments.topicSlug, topicSlug),
      ),
    )
    .limit(1);
  const comment = rows[0];
  if (!comment || comment.deletedAt) {
    throw errors.notFound("Comment not found.");
  }

  const isOwner = comment.userId === user.id;
  if (!isOwner && user.role !== "ADMIN") {
    throw errors.forbidden("You can only delete your own comments.");
  }

  const deletedAt = new Date();
  await db.transaction(async (tx) => {
    if (comment.parentId) {
      await tx
        .update(lessonComments)
        .set({ deletedAt, updatedAt: deletedAt })
        .where(eq(lessonComments.id, comment.id));
      return;
    }
    await tx
      .update(lessonComments)
      .set({ deletedAt, updatedAt: deletedAt })
      .where(
        or(
          eq(lessonComments.id, comment.id),
          eq(lessonComments.parentId, comment.id),
        ),
      );
  });

  if (!isOwner) {
    await db.insert(auditLogs).values({
      actorId: user.id,
      action: "lesson_comment.delete",
      entityType: "lesson_comment",
      entityId: comment.id,
    });
  }
}

export async function voteLessonComment(
  moduleSlug: string,
  topicSlug: string,
  user: Pick<SafeUser, "id" | "role">,
  commentId: string,
  value: CommentVote,
): Promise<{ score: number; myVote: CommentVote }> {
  assertTopic(moduleSlug, topicSlug);
  const db = getDb();

  const rows = await db
    .select({
      id: lessonComments.id,
      userId: lessonComments.userId,
      deletedAt: lessonComments.deletedAt,
      moduleSlug: lessonComments.moduleSlug,
      topicSlug: lessonComments.topicSlug,
    })
    .from(lessonComments)
    .where(eq(lessonComments.id, commentId))
    .limit(1);
  const comment = rows[0];
  if (
    !comment ||
    comment.deletedAt ||
    comment.moduleSlug !== moduleSlug ||
    comment.topicSlug !== topicSlug
  ) {
    throw errors.notFound("Comment not found.");
  }
  if (comment.userId === user.id) {
    throw errors.validation("You cannot vote on your own comment.");
  }

  if (value === 0) {
    await db
      .delete(lessonCommentVotes)
      .where(
        and(
          eq(lessonCommentVotes.commentId, comment.id),
          eq(lessonCommentVotes.userId, user.id),
        ),
      );
  } else {
    await db
      .insert(lessonCommentVotes)
      .values({ commentId: comment.id, userId: user.id, value })
      .onConflictDoUpdate({
        target: [lessonCommentVotes.commentId, lessonCommentVotes.userId],
        set: { value, updatedAt: new Date() },
      });
  }

  const [scoreRow] = await db
    .select({
      value: sql<number>`coalesce(sum(${lessonCommentVotes.value}), 0)::int`,
    })
    .from(lessonCommentVotes)
    .where(eq(lessonCommentVotes.commentId, comment.id));

  return { score: Number(scoreRow?.value ?? 0), myVote: value };
}
