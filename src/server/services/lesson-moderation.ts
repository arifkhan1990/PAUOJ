import { and, eq } from "drizzle-orm";
import { errors } from "@/server/api/errors";
import { getDb } from "@/server/db";
import {
  auditLogs,
  lessonCommentReports,
  lessonComments,
  users,
} from "@/server/db/schema";
import { isUniqueViolation } from "@/lib/db-errors";
import type { SafeUser } from "@/server/auth/session";
import { notifyUser } from "./notifications";
import { assertLessonTopic } from "./lesson-discussions";


export async function reportLessonComment(
  moduleSlug: string,
  topicSlug: string,
  user: Pick<SafeUser, "id">,
  commentId: string,
  reason: string,
): Promise<{ reported: true }> {
  assertLessonTopic(moduleSlug, topicSlug);
  const db = getDb();

  const [comment] = await db
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

  if (
    !comment ||
    comment.deletedAt ||
    comment.moduleSlug !== moduleSlug ||
    comment.topicSlug !== topicSlug
  ) {
    throw errors.notFound("Comment not found.");
  }
  if (comment.userId === user.id) {
    throw errors.validation("You cannot report your own comment.");
  }

  try {
    await db.insert(lessonCommentReports).values({
      commentId,
      reporterId: user.id,
      reason,
    });
  } catch (error) {
    if (isUniqueViolation(error)) {
      throw errors.conflict("You already reported this comment.");
    }
    throw error;
  }

  await db.insert(auditLogs).values({
    actorId: user.id,
    action: "lesson_comment.report",
    entityType: "lesson_comment",
    entityId: commentId,
  });

  const admins = await db
    .select({ id: users.id })
    .from(users)
    .where(and(eq(users.role, "ADMIN"), eq(users.isBanned, false)));

  await Promise.all(
    admins.map((admin) =>
      notifyUser({
        userId: admin.id,
        type: "SYSTEM",
        title: "Lesson comment reported",
        body: `A comment on ${moduleSlug}/${topicSlug} was reported: ${reason.slice(0, 180)}`,
        href: `/learn/${moduleSlug}/${topicSlug}#discussion`,
        dedupeKey: `lesson-comment-report:${commentId}`,
      }),
    ),
  );

  return { reported: true };
}
