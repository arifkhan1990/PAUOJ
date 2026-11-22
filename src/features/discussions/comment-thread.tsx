"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowBigDown,
  ArrowBigUp,
  CornerDownRight,
  Flag,
  Loader2,
  Trash2,
} from "lucide-react";
import { CommentComposer } from "@/features/discussions/comment-composer";
import { Markdown } from "@/components/shared/markdown";
import { UserAvatar } from "@/components/shared/user-avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ApiClientError, apiDelete, apiPost } from "@/lib/api-client";
import type { CommentVote, ProblemComment } from "@/lib/types";
import { cn, formatDateTime, formatRelative } from "@/lib/utils";

type ViewerView = {
  id: string;
  username: string;
  displayName: string;
  role: "USER" | "TEACHER" | "ADMIN";
} | null;

export function CommentThread({
  slug,
  comment,
  viewer,
  depth = 0,
  commentsBase,
  onChanged,
  reportBase,
}: {
  slug: string;
  comment: ProblemComment;
  viewer: ViewerView;
  depth?: number;
  /** Overrides the default problem comment endpoint (used by lesson discussions). */
  commentsBase?: string;
  /** Runs after this thread changes the server state (used to refresh custom lists). */
  onChanged?: () => void;
  /** Enables reporting when set to the comment collection endpoint. */
  reportBase?: string;
}) {
  const router = useRouter();
  const base = commentsBase ?? `/api/v1/problems/${slug}/comments`;
  const [score, setScore] = useState(comment.score);
  const [myVote, setMyVote] = useState<CommentVote>(comment.myVote);
  const [voting, setVoting] = useState(false);
  const [replying, setReplying] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [reporting, setReporting] = useState(false);
  const [reported, setReported] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const vote = async (value: Exclude<CommentVote, 0>) => {
    if (!viewer || voting) return;
    const next: CommentVote = myVote === value ? 0 : value;
    setVoting(true);
    setError(null);
    try {
      const result = await apiPost<{ score: number; myVote: CommentVote }>(
        `${base}/${comment.id}/vote`,
        { value: next },
      );
      setScore(result.score);
      setMyVote(result.myVote);
    } catch (requestError) {
      setError(
        requestError instanceof ApiClientError
          ? requestError.message
          : "Could not save your vote.",
      );
    } finally {
      setVoting(false);
    }
  };

  const remove = async () => {
    if (deleting) return;
    const message =
      depth === 0
        ? "Delete this comment and its replies? This cannot be undone."
        : "Delete this reply? This cannot be undone.";
    if (!window.confirm(message)) return;
    setDeleting(true);
    setError(null);
    try {
      await apiDelete(`${base}/${comment.id}`);
      onChanged?.();
      router.refresh();
    } catch (requestError) {
      setError(
        requestError instanceof ApiClientError
          ? requestError.message
          : "Could not delete this comment.",
      );
      setDeleting(false);
    }
  };

  const report = async () => {
    if (!reportBase || reporting) return;
    const reason = window.prompt(
      "Why are you reporting this comment? (5-300 characters)",
    );
    if (!reason) return;
    if (reason.trim().length < 5) {
      setError("Add a short reason (at least 5 characters).");
      return;
    }
    setReporting(true);
    setError(null);
    try {
      await apiPost(`${reportBase}/${comment.id}/report`, {
        reason: reason.trim(),
      });
      setReported(true);
    } catch (requestError) {
      setError(
        requestError instanceof ApiClientError
          ? requestError.message
          : "Could not report this comment.",
      );
    } finally {
      setReporting(false);
    }
  };

  return (
    <article className={cn(depth > 0 && "border-l-2 border-border pl-4 sm:pl-5")}>
      <div className="flex gap-3">
        <div className="flex w-8 shrink-0 flex-col items-center gap-1 pt-0.5">
          {viewer && viewer.id !== comment.author.id ? (
            <>
              <button
                type="button"
                onClick={() => void vote(1)}
                disabled={voting}
                aria-label="Upvote"
                aria-pressed={myVote === 1}
                className={cn(
                  "grid size-7 place-items-center rounded-md transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  myVote === 1 ? "text-primary" : "text-muted-foreground",
                )}
              >
                <ArrowBigUp className="size-5" />
              </button>
              <span className="font-mono text-xs font-medium tabular-nums">
                {score}
              </span>
              <button
                type="button"
                onClick={() => void vote(-1)}
                disabled={voting}
                aria-label="Downvote"
                aria-pressed={myVote === -1}
                className={cn(
                  "grid size-7 place-items-center rounded-md transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  myVote === -1
                    ? "text-destructive"
                    : "text-muted-foreground",
                )}
              >
                <ArrowBigDown className="size-5" />
              </button>
            </>
          ) : (
            <span className="py-1 font-mono text-xs text-muted-foreground">
              {score}
            </span>
          )}
        </div>

        <div className="min-w-0 flex-1 pb-6">
          <header className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
            <UserAvatar
              name={comment.author.displayName}
              username={comment.author.username}
              size="sm"
            />
            <Link
              href={`/users/${comment.author.username}`}
              className="font-medium text-foreground hover:text-primary"
            >
              {comment.author.displayName}
            </Link>
            <span className="text-muted-foreground">
              @{comment.author.username}
            </span>
            {comment.author.role === "ADMIN" ||
            comment.author.role === "TEACHER" ? (
              <Badge variant="outline" className="h-5 px-1.5 text-[10px]">
                {comment.author.role === "ADMIN" ? "Admin" : "Teacher"}
              </Badge>
            ) : null}
            {viewer?.id === comment.author.id ? (
              <Badge variant="muted" className="h-5 px-1.5 text-[10px]">
                You
              </Badge>
            ) : null}
            <time
              dateTime={comment.createdAt}
              title={formatDateTime(comment.createdAt)}
              className="text-muted-foreground"
            >
              {formatRelative(comment.createdAt)}
            </time>
          </header>

          <div className="mt-2 text-sm leading-relaxed">
            <Markdown>{comment.body}</Markdown>
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-1">
            {viewer && depth === 0 ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs text-muted-foreground"
                onClick={() => setReplying((value) => !value)}
              >
                <CornerDownRight className="size-3.5" />
                Reply
              </Button>
            ) : null}
            {viewer && reportBase && viewer.id !== comment.author.id ? (
              reported ? (
                <span className="px-2 text-xs text-muted-foreground">
                  Reported
                </span>
              ) : (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-xs text-muted-foreground hover:text-amber-700 dark:hover:text-amber-300"
                  onClick={() => void report()}
                  disabled={reporting}
                >
                  {reporting ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <Flag className="size-3.5" />
                  )}
                  Report
                </Button>
              )
            ) : null}
            {viewer && comment.canDelete ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs text-muted-foreground hover:text-destructive"
                onClick={() => void remove()}
                disabled={deleting}
              >
                {deleting ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <Trash2 className="size-3.5" />
                )}
                Delete
              </Button>
            ) : null}
          </div>
          {error ? (
            <p className="mt-1 text-xs text-destructive" role="alert">
              {error}
            </p>
          ) : null}

          {replying && viewer ? (
            <div className="mt-3 rounded-lg border border-border bg-muted/20 p-3">
              <CommentComposer
                slug={slug}
                commentsBase={base}
                parentId={comment.id}
                viewer={viewer}
                compact
                autoFocus
                onCancel={() => setReplying(false)}
                onPosted={() => setReplying(false)}
              />
            </div>
          ) : null}

          {comment.replies.length > 0 ? (
            <div className="mt-4 space-y-4">
              {comment.replies.map((reply) => (
                <CommentThread
                  key={reply.id}
                  slug={slug}
                  commentsBase={base}
                  comment={reply}
                  viewer={viewer}
                  depth={depth + 1}
                  onChanged={onChanged}
                  reportBase={reportBase}
                />
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </article>
  );
}
