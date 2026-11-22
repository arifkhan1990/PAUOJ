import { and, count, desc, eq } from "drizzle-orm";
import { errors } from "@/server/api/errors";
import { getDb } from "@/server/db";
import {
  auditLogs,
  lessonCommentReports,
  lessonComments,
  users,
} from "@/server/db/schema";
import { isUniqueViolation } from "@/lib/db-errors";
import { toOffset } from "@/server/api/validation";
import type { SafeUser } from "@/server/auth/session";
import { notifyUser } from "./notifications";
import { getLearningModule } from "@/lib/learning/modules";
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
        email: true,
      }),
    ),
  );

  return { reported: true };
}

export const LESSON_REPORT_PAGE_SIZE = 20;

export type LessonReportStatus = "OPEN" | "RESOLVED";

export type LessonReportItem = {
  id: string;
  reason: string;
  status: LessonReportStatus;
  createdAt: string;
  resolvedAt: string | null;
  comment: {
    id: string;
    excerpt: string;
    deleted: boolean;
    author: { username: string; displayName: string };
  };
  lesson: { moduleSlug: string; topicSlug: string; title: string };
};

function reportSelection() {
  return {
    id: lessonCommentReports.id,
    reason: lessonCommentReports.reason,
    status: lessonCommentReports.status,
    createdAt: lessonCommentReports.createdAt,
    resolvedAt: lessonCommentReports.resolvedAt,
    commentId: lessonComments.id,
    body: lessonComments.body,
    deletedAt: lessonComments.deletedAt,
    authorUsername: users.username,
    authorDisplayName: users.displayName,
    moduleSlug: lessonComments.moduleSlug,
    topicSlug: lessonComments.topicSlug,
  };
}

type ReportRow = {
  id: string;
  reason: string;
  status: string;
  createdAt: Date;
  resolvedAt: Date | null;
  commentId: string;
  body: string;
  deletedAt: Date | null;
  authorUsername: string;
  authorDisplayName: string;
  moduleSlug: string;
  topicSlug: string;
};

function lessonTitle(moduleSlug: string, topicSlug: string): string {
  const definition = getLearningModule(moduleSlug);
  return (
    definition?.topics.find((topic) => topic.slug === topicSlug)?.title ??
    topicSlug
  );
}

function mapReport(row: ReportRow): LessonReportItem {
  const excerpt = row.body.replace(/\s+/g, " ").trim();
  return {
    id: row.id,
    reason: row.reason,
    status: row.status === "RESOLVED" ? "RESOLVED" : "OPEN",
    createdAt: row.createdAt.toISOString(),
    resolvedAt: row.resolvedAt ? row.resolvedAt.toISOString() : null,
    comment: {
      id: row.commentId,
      excerpt: excerpt.length > 160 ? `${excerpt.slice(0, 157)}...` : excerpt,
      deleted: row.deletedAt !== null,
      author: {
        username: row.authorUsername,
        displayName: row.authorDisplayName,
      },
    },
    lesson: {
      moduleSlug: row.moduleSlug,
      topicSlug: row.topicSlug,
      title: lessonTitle(row.moduleSlug, row.topicSlug),
    },
  };
}

export async function listLessonReports({
  status = "open",
  page = 1,
}: {
  status?: "open" | "resolved" | "all";
  page?: number;
} = {}): Promise<{ items: LessonReportItem[]; total: number }> {
  const db = getDb();
  const filter =
    status === "all"
      ? undefined
      : eq(
          lessonCommentReports.status,
          status === "open" ? "OPEN" : "RESOLVED",
        );

  const [rows, totals] = await Promise.all([
    db
      .select(reportSelection())
      .from(lessonCommentReports)
      .innerJoin(
        lessonComments,
        eq(lessonComments.id, lessonCommentReports.commentId),
      )
      .innerJoin(users, eq(users.id, lessonComments.userId))
      .where(filter)
      .orderBy(
        ...(status === "all"
          ? [lessonCommentReports.status, desc(lessonCommentReports.createdAt)]
          : [desc(lessonCommentReports.createdAt)]),
      )
      .limit(LESSON_REPORT_PAGE_SIZE)
      .offset(toOffset({ page, pageSize: LESSON_REPORT_PAGE_SIZE })),
    db
      .select({ value: count() })
      .from(lessonCommentReports)
      .where(filter),
  ]);

  return {
    items: rows.map(mapReport),
    total: Number(totals[0]?.value ?? 0),
  };
}

export async function resolveLessonReport(
  reportId: string,
  admin: Pick<SafeUser, "id">,
): Promise<LessonReportItem> {
  const db = getDb();
  const [report] = await db
    .select({
      id: lessonCommentReports.id,
      status: lessonCommentReports.status,
      commentId: lessonCommentReports.commentId,
    })
    .from(lessonCommentReports)
    .where(eq(lessonCommentReports.id, reportId))
    .limit(1);

  if (!report) throw errors.notFound("Report not found.");
  if (report.status === "RESOLVED") {
    throw errors.conflict("This report is already resolved.");
  }

  const now = new Date();
  const [updated] = await db
    .update(lessonCommentReports)
    .set({ status: "RESOLVED", resolvedAt: now, resolvedBy: admin.id })
    .where(
      and(
        eq(lessonCommentReports.id, reportId),
        eq(lessonCommentReports.status, "OPEN"),
      ),
    )
    .returning({ id: lessonCommentReports.id });

  if (!updated) throw errors.conflict("This report is already resolved.");

  await db.insert(auditLogs).values({
    actorId: admin.id,
    action: "lesson_comment_report.resolve",
    entityType: "lesson_comment_report",
    entityId: reportId,
    metadata: { commentId: report.commentId },
  });

  const [row] = await db
    .select(reportSelection())
    .from(lessonCommentReports)
    .innerJoin(
      lessonComments,
      eq(lessonComments.id, lessonCommentReports.commentId),
    )
    .innerJoin(users, eq(users.id, lessonComments.userId))
    .where(eq(lessonCommentReports.id, reportId))
    .limit(1);

  if (!row) throw errors.notFound("Report not found.");
  return mapReport(row);
}
