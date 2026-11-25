import { and, eq, or, sql } from "drizzle-orm";
import { errors } from "@/server/api/errors";
import { getDb } from "@/server/db";
import {
  auditLogs,
  lessonCommentVotes,
  lessonComments,
} from "@/server/db/schema";
import type { CommentVote, ProblemComment } from "@/lib/types";
import type { CreateCommentInput } from "@/lib/schemas/discussion";
import type { SafeUser } from "@/server/auth/session";
import { assertLessonTopic } from "./lesson-discussions";

export async function createLessonComment(
  moduleSlug: string,
  topicSlug: string,
  user: Pick<
    SafeUser,
    | "id"
    | "username"
    | "displayName"
    | "role"
    | "avatarPreset"
    | "avatarImageUpdatedAt"
  >,
  input: CreateCommentInput,
): Promise<ProblemComment> {
  assertLessonTopic(moduleSlug, topicSlug);
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
      avatarPreset: user.avatarPreset,
      avatarImageUpdatedAt:
        user.avatarImageUpdatedAt?.toISOString() ?? null,
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
  assertLessonTopic(moduleSlug, topicSlug);
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
  assertLessonTopic(moduleSlug, topicSlug);
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

