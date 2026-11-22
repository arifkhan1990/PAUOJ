"use client";

import { useState } from "react";
import Link from "next/link";
import { Loader2, MessageSquare, ThumbsDown, ThumbsUp } from "lucide-react";
import { CommentComposer } from "@/features/discussions/comment-composer";
import { CommentThread } from "@/features/discussions/comment-thread";
import { Button, buttonVariants } from "@/components/ui/button";
import { ApiClientError, apiGetPage, apiPut } from "@/lib/api-client";
import type { CommentVote, ProblemComment } from "@/lib/types";
import {
  nextReactionValue,
  type LessonCommentPage,
  type LessonReactionSummary,
} from "@/lib/learning/social";
import { cn } from "@/lib/utils";

type Viewer = {
  id: string;
  username: string;
  displayName: string;
  role: "USER" | "TEACHER" | "ADMIN";
} | null;

function ReactionButton({
  active,
  count,
  label,
  tone,
  disabled,
  onClick,
  icon: Icon,
}: {
  active: boolean;
  count: number;
  label: string;
  tone: "like" | "dislike";
  disabled: boolean;
  onClick: () => void;
  icon: typeof ThumbsUp;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      aria-label={label}
      disabled={disabled}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:opacity-60",
        active
          ? tone === "like"
            ? "border-primary/40 bg-primary/10 text-primary"
            : "border-destructive/40 bg-destructive/10 text-destructive"
          : "border-border bg-card text-muted-foreground hover:border-primary/30 hover:text-foreground",
      )}
    >
      <Icon className="size-3.5" aria-hidden="true" />
      <span className="tabular-nums">{count}</span>
      <span className="sr-only">{label}</span>
    </button>
  );
}

export function LessonSocial({
  moduleSlug,
  topicSlug,
  viewer,
  reactions: initialReactions,
  comments: initialComments,
}: {
  moduleSlug: string;
  topicSlug: string;
  viewer: Viewer;
  reactions: LessonReactionSummary;
  comments: LessonCommentPage;
}) {
  const base = `/api/v1/learning/topics/${moduleSlug}/${topicSlug}`;
  const loginHref = `/login?next=${encodeURIComponent(
    `/learn/${moduleSlug}/${topicSlug}#discussion`,
  )}`;

  const [reactions, setReactions] = useState(initialReactions);
  const [reacting, setReacting] = useState(false);
  const [reactionError, setReactionError] = useState<string | null>(null);

  const [comments, setComments] = useState<ProblemComment[]>(
    initialComments.items,
  );
  const [total, setTotal] = useState(initialComments.total);
  const [page, setPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const [listError, setListError] = useState<string | null>(null);

  const react = async (value: Exclude<CommentVote, 0>) => {
    if (!viewer || reacting) return;
    const next = nextReactionValue(reactions.viewer, value);
    setReacting(true);
    setReactionError(null);
    try {
      const summary = await apiPut<LessonReactionSummary>(
        `${base}/reaction`,
        { value: next },
      );
      setReactions(summary);
    } catch (error) {
      setReactionError(
        error instanceof ApiClientError
          ? error.message
          : "Could not save your reaction.",
      );
    } finally {
      setReacting(false);
    }
  };

  const reloadComments = async () => {
    try {
      const result = await apiGetPage<ProblemComment>(`${base}/comments?page=1`);
      setComments(result.items);
      setTotal(result.meta.total);
      setPage(1);
      setListError(null);
    } catch {
      setListError("Could not refresh the discussion. Reload the page.");
    }
  };

  const loadMore = async () => {
    if (loadingMore) return;
    setLoadingMore(true);
    setListError(null);
    try {
      const next = page + 1;
      const result = await apiGetPage<ProblemComment>(
        `${base}/comments?page=${next}`,
      );
      setComments((current) => [...current, ...result.items]);
      setTotal(result.meta.total);
      setPage(next);
    } catch (error) {
      setListError(
        error instanceof ApiClientError
          ? error.message
          : "Could not load more comments.",
      );
    } finally {
      setLoadingMore(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="rounded-xl border border-border bg-card p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="text-sm font-semibold">Was this lesson helpful?</p>
            <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
              Your reaction helps other learners judge these notes.
            </p>
          </div>
          {viewer ? (
            <div className="flex items-center gap-2">
              <ReactionButton
                active={reactions.viewer === 1}
                count={reactions.likes}
                label="Like this lesson"
                tone="like"
                disabled={reacting}
                onClick={() => void react(1)}
                icon={ThumbsUp}
              />
              <ReactionButton
                active={reactions.viewer === -1}
                count={reactions.dislikes}
                label="Dislike this lesson"
                tone="dislike"
                disabled={reacting}
                onClick={() => void react(-1)}
                icon={ThumbsDown}
              />
              {reacting ? (
                <Loader2
                  className="size-3.5 animate-spin text-muted-foreground"
                  aria-hidden="true"
                />
              ) : null}
            </div>
          ) : (
            <Link
              href={loginHref}
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              Sign in to react
            </Link>
          )}
        </div>
        {reactionError ? (
          <p className="mt-2 text-xs text-destructive" role="alert">
            {reactionError}
          </p>
        ) : null}
      </div>

      <div>
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h3 className="text-base font-semibold">Discussion</h3>
          <p className="font-mono text-[11px] tabular-nums text-muted-foreground">
            {total} {total === 1 ? "comment" : "comments"}
          </p>
        </div>

        {viewer ? (
          <div className="mt-4 rounded-xl border border-border bg-card p-4">
            <CommentComposer
              slug={`${moduleSlug}/${topicSlug}`}
              commentsBase={`${base}/comments`}
              viewer={viewer}
              onPosted={() => void reloadComments()}
            />
          </div>
        ) : (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-dashed border-border bg-muted/20 px-4 py-3">
            <p className="text-xs text-muted-foreground">
              Sign in to ask a question or share an approach.
            </p>
            <Link
              href={loginHref}
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              Sign in to comment
            </Link>
          </div>
        )}

        {comments.length === 0 ? (
          <div className="mt-6 flex items-start gap-3 rounded-xl border border-dashed border-border bg-muted/20 p-5">
            <MessageSquare
              className="mt-0.5 size-4 shrink-0 text-muted-foreground"
              aria-hidden="true"
            />
            <div>
              <p className="text-sm font-medium">No comments yet</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Be the first to ask a question or leave a study tip.
              </p>
            </div>
          </div>
        ) : (
          <div className="mt-6 space-y-5">
            {comments.map((comment) => (
              <CommentThread
                key={comment.id}
                slug={`${moduleSlug}/${topicSlug}`}
                commentsBase={`${base}/comments`}
                comment={comment}
                viewer={viewer}
                onChanged={() => void reloadComments()}
              />
            ))}
          </div>
        )}

        {comments.length < total ? (
          <div className="mt-5">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => void loadMore()}
              disabled={loadingMore}
            >
              {loadingMore ? <Loader2 className="size-3.5 animate-spin" /> : null}
              Load more comments
            </Button>
          </div>
        ) : null}

        {listError ? (
          <p className="mt-3 text-xs text-destructive" role="alert">
            {listError}
          </p>
        ) : null}
      </div>
    </div>
  );
}
