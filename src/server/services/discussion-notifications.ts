import { logger } from "@/server/logger";
import { notifyUser } from "./notifications";

/** Reply bodies are shortened for the notification list and email preview. */
export const DISCUSSION_SNIPPET_MAX = 120;

/**
 * Collapses whitespace and shortens a reply to fit a notification body. The
 * ellipsis is included in the limit, so the result is never longer than `max`.
 */
export function discussionSnippet(
  body: string,
  max = DISCUSSION_SNIPPET_MAX,
): string {
  const normalized = body.replace(/\s+/g, " ").trim();
  if (normalized.length <= max) return normalized;
  return `${normalized.slice(0, Math.max(1, max - 1)).trimEnd()}…`;
}

type ReplyNotification = {
  authorId: string;
  recipientId: string;
  title: string;
  href: string;
  dedupeKey: string;
  replyBody: string;
};

async function sendReplyNotification(input: ReplyNotification): Promise<void> {
  if (input.recipientId === input.authorId) return;
  try {
    await notifyUser({
      userId: input.recipientId,
      type: "DISCUSSION",
      title: input.title,
      body: discussionSnippet(input.replyBody),
      href: input.href,
      dedupeKey: input.dedupeKey,
    });
  } catch (error) {
    logger.warn("Discussion reply notification failed", {
      userId: input.recipientId,
      dedupeKey: input.dedupeKey,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

export type ProblemReplyInput = {
  authorId: string;
  authorName: string;
  parentAuthorId: string;
  problemSlug: string;
  commentId: string;
  replyBody: string;
};

/** Best-effort "someone replied to your problem comment" notice. */
export async function notifyProblemCommentReply(
  input: ProblemReplyInput,
): Promise<void> {
  await sendReplyNotification({
    authorId: input.authorId,
    recipientId: input.parentAuthorId,
    title: `${input.authorName} replied to your comment`,
    href: `/problems/${input.problemSlug}?tab=discussion`,
    dedupeKey: `discussion-reply:${input.commentId}`,
    replyBody: input.replyBody,
  });
}

export type LessonReplyInput = {
  authorId: string;
  authorName: string;
  parentAuthorId: string;
  moduleSlug: string;
  topicSlug: string;
  commentId: string;
  replyBody: string;
};

/** Best-effort "someone replied to your lesson comment" notice. */
export async function notifyLessonCommentReply(
  input: LessonReplyInput,
): Promise<void> {
  await sendReplyNotification({
    authorId: input.authorId,
    recipientId: input.parentAuthorId,
    title: `${input.authorName} replied to your lesson comment`,
    href: `/learn/${input.moduleSlug}/${input.topicSlug}#discussion`,
    dedupeKey: `lesson-reply:${input.commentId}`,
    replyBody: input.replyBody,
  });
}
