import type { CommentVote, ProblemComment } from "@/lib/types";

export const LESSON_DISCUSSION_PAGE_SIZE = 10;

export type LessonReactionSummary = {
  likes: number;
  dislikes: number;
  /** The viewer's own reaction: 1 = like, -1 = dislike, 0 = none. */
  viewer: CommentVote;
};

export type LessonCommentPage = {
  items: ProblemComment[];
  total: number;
};

export type LessonSocialData = {
  reactions: LessonReactionSummary;
  comments: LessonCommentPage;
};

/** Toggles a like/dislike: clicking the active reaction clears it. */
export function nextReactionValue(
  current: CommentVote,
  clicked: Exclude<CommentVote, 0>,
): CommentVote {
  return current === clicked ? 0 : clicked;
}
