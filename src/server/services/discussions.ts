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
  problemCommentVotes,
  problemComments,
  problems,
  users,
} from "@/server/db/schema";
import type {
  CommentVote,
  ProblemComment,
  ProblemCommentSort,
} from "@/lib/types";
import type { CreateCommentInput } from "@/lib/schemas/discussion";
import type { SafeUser } from "@/server/auth/session";
import {
  assembleComments,
  type DiscussionViewer,
} from "./discussion-mapper";
import { notifyProblemCommentReply } from "./discussion-notifications";
import { assertProblemNotInLiveContext } from "./problem-access";

export const DISCUSSION_PAGE_SIZE = 10;

type Viewer = DiscussionViewer;

function scoreExpression() {
  return sql<number>`coalesce((
    select sum(${problemCommentVotes.value})
    from ${problemCommentVotes}
    where ${problemCommentVotes.commentId} = ${problemComments.id}
  ), 0)::int`;
}

function myVoteExpression(viewerId: string | null) {
  if (!viewerId) return sql<number>`0`;
  return sql<number>`coalesce((
    select ${problemCommentVotes.value}
    from ${problemCommentVotes}
    where ${problemCommentVotes.commentId} = ${problemComments.id}
      and ${problemCommentVotes.userId} = ${viewerId}
  ), 0)::int`;
}

function baseSelection(viewerId: string | null) {
  return {
    id: problemComments.id,
    parentId: problemComments.parentId,
    body: problemComments.body,
    createdAt: problemComments.createdAt,
    updatedAt: problemComments.updatedAt,
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


async function loadProblem(slug: string, viewer: Viewer) {
  const db = getDb();
  const rows = await db
    .select({ id: problems.id, isPublic: problems.isPublic })
    .from(problems)
    .where(eq(problems.slug, slug))
    .limit(1);
  const problem = rows[0];
  if (!problem) throw errors.notFound("Problem not found.");
  if (!problem.isPublic && viewer?.role !== "ADMIN") {
    throw errors.notFound("Problem not found.");
  }
  return problem;
}

async function assertDiscussionOpen(problemId: string): Promise<void> {
  await assertProblemNotInLiveContext(
    problemId,
    "DISCUSSION_LOCKED",
    "Discussion is hidden while this problem is part of a running contest or assessment.",
  );
}

export async function listCommentsForProblem(
  problemId: string,
  viewer: Viewer,
  page: number,
  sort: ProblemCommentSort,
): Promise<{ items: ProblemComment[]; total: number }> {
  const db = getDb();
  const viewerId = viewer?.id ?? null;
  const selection = baseSelection(viewerId);
  const where = and(
    eq(problemComments.problemId, problemId),
    isNull(problemComments.parentId),
    isNull(problemComments.deletedAt),
  );

  const [totalRows, rows] = await Promise.all([
    db
      .select({ value: count() })
      .from(problemComments)
      .where(where),
    db
      .select(selection)
      .from(problemComments)
      .innerJoin(users, eq(users.id, problemComments.userId))
      .where(where)
      .orderBy(
        ...(sort === "top"
          ? [desc(scoreExpression()), desc(problemComments.createdAt)]
          : [desc(problemComments.createdAt)]),
      )
      .limit(DISCUSSION_PAGE_SIZE)
      .offset(toOffset({ page, pageSize: DISCUSSION_PAGE_SIZE })),
  ]);

  const topIds = rows.map((row) => row.id);
  const replies =
    topIds.length > 0
      ? await db
          .select(selection)
          .from(problemComments)
          .innerJoin(users, eq(users.id, problemComments.userId))
          .where(
            and(
              eq(problemComments.problemId, problemId),
              inArray(problemComments.parentId, topIds),
              isNull(problemComments.deletedAt),
            ),
          )
          .orderBy(asc(problemComments.createdAt))
      : [];

  return {
    items: assembleComments(rows, replies, viewer),
    total: Number(totalRows[0]?.value ?? 0),
  };
}

export async function listProblemComments(
  slug: string,
  viewer: Viewer,
  page: number,
  sort: ProblemCommentSort,
): Promise<{ items: ProblemComment[]; total: number }> {
  const problem = await loadProblem(slug, viewer);
  await assertDiscussionOpen(problem.id);
  return listCommentsForProblem(problem.id, viewer, page, sort);
}

export async function createProblemComment(
  slug: string,
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
  const db = getDb();
  const problem = await loadProblem(slug, user);
  await assertDiscussionOpen(problem.id);

  let parentAuthorId: string | null = null;
  if (input.parentId) {
    const rows = await db
      .select({
        id: problemComments.id,
        problemId: problemComments.problemId,
        parentId: problemComments.parentId,
        userId: problemComments.userId,
        deletedAt: problemComments.deletedAt,
      })
      .from(problemComments)
      .where(eq(problemComments.id, input.parentId))
      .limit(1);
    const parent = rows[0];
    if (!parent || parent.deletedAt || parent.problemId !== problem.id) {
      throw errors.validation("The comment you are replying to is unavailable.");
    }
    if (parent.parentId) {
      throw errors.validation("Replies can only be one level deep.");
    }
    parentAuthorId = parent.userId;
  }

  const now = new Date();
  const rows = await db
    .insert(problemComments)
    .values({
      problemId: problem.id,
      userId: user.id,
      parentId: input.parentId ?? null,
      body: input.body,
      createdAt: now,
      updatedAt: now,
    })
    .returning({
      id: problemComments.id,
      body: problemComments.body,
      createdAt: problemComments.createdAt,
      updatedAt: problemComments.updatedAt,
    });
  const comment = rows[0];
  if (!comment) throw errors.unavailable("Could not save your comment.");

  if (parentAuthorId) {
    await notifyProblemCommentReply({
      authorId: user.id,
      authorName: user.displayName,
      parentAuthorId,
      problemSlug: slug,
      commentId: comment.id,
      replyBody: comment.body,
    });
  }

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

export async function deleteProblemComment(
  slug: string,
  user: Pick<SafeUser, "id" | "role">,
  commentId: string,
): Promise<void> {
  const db = getDb();
  const problem = await loadProblem(slug, user);
  const rows = await db
    .select({
      id: problemComments.id,
      problemId: problemComments.problemId,
      userId: problemComments.userId,
      parentId: problemComments.parentId,
      deletedAt: problemComments.deletedAt,
    })
    .from(problemComments)
    .where(and(eq(problemComments.id, commentId), eq(problemComments.problemId, problem.id)))
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
        .update(problemComments)
        .set({ deletedAt, updatedAt: deletedAt })
        .where(eq(problemComments.id, comment.id));
      return;
    }
    await tx
      .update(problemComments)
      .set({ deletedAt, updatedAt: deletedAt })
      .where(
        or(
          eq(problemComments.id, comment.id),
          eq(problemComments.parentId, comment.id),
        ),
      );
  });

  if (!isOwner) {
    await db.insert(auditLogs).values({
      actorId: user.id,
      action: "comment.delete",
      entityType: "problem_comment",
      entityId: comment.id,
    });
  }
}

export async function voteProblemComment(
  slug: string,
  user: Pick<SafeUser, "id" | "role">,
  commentId: string,
  value: CommentVote,
): Promise<{ score: number; myVote: CommentVote }> {
  const db = getDb();
  const problem = await loadProblem(slug, user);
  await assertDiscussionOpen(problem.id);

  const rows = await db
    .select({
      id: problemComments.id,
      problemId: problemComments.problemId,
      userId: problemComments.userId,
      deletedAt: problemComments.deletedAt,
    })
    .from(problemComments)
    .where(eq(problemComments.id, commentId))
    .limit(1);
  const comment = rows[0];
  if (!comment || comment.deletedAt || comment.problemId !== problem.id) {
    throw errors.notFound("Comment not found.");
  }
  if (comment.userId === user.id) {
    throw errors.validation("You cannot vote on your own comment.");
  }

  if (value === 0) {
    await db
      .delete(problemCommentVotes)
      .where(
        and(
          eq(problemCommentVotes.commentId, comment.id),
          eq(problemCommentVotes.userId, user.id),
        ),
      );
  } else {
    await db
      .insert(problemCommentVotes)
      .values({
        commentId: comment.id,
        userId: user.id,
        value,
      })
      .onConflictDoUpdate({
        target: [problemCommentVotes.commentId, problemCommentVotes.userId],
        set: { value, updatedAt: new Date() },
      });
  }

  const [scoreRow] = await db
    .select({
      value: sql<number>`coalesce(sum(${problemCommentVotes.value}), 0)::int`,
    })
    .from(problemCommentVotes)
    .where(eq(problemCommentVotes.commentId, comment.id));

  return { score: Number(scoreRow?.value ?? 0), myVote: value };
}
