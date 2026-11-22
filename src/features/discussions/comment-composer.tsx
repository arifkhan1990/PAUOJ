"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { UserAvatar } from "@/components/shared/user-avatar";
import { ApiClientError, apiPost } from "@/lib/api-client";
import { cn } from "@/lib/utils";

const MAX_LENGTH = 2000;

export function CommentComposer({
  slug,
  parentId = null,
  viewer,
  onPosted,
  onCancel,
  autoFocus = false,
  compact = false,
  commentsBase,
}: {
  slug: string;
  parentId?: string | null;
  viewer: { displayName: string; username: string };
  onPosted?: () => void;
  onCancel?: () => void;
  autoFocus?: boolean;
  compact?: boolean;
  /** Overrides the default problem comment endpoint (used by lesson discussions). */
  commentsBase?: string;
}) {
  const router = useRouter();
  const base = commentsBase ?? `/api/v1/problems/${slug}/comments`;
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    const value = body.trim();
    if (value.length < 2 || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      await apiPost(base, {
        body: value,
        parentId,
      });
      setBody("");
      onPosted?.();
      router.refresh();
    } catch (requestError) {
      setError(
        requestError instanceof ApiClientError
          ? requestError.message
          : "Could not post your comment. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex items-start gap-3">
      <UserAvatar
        name={viewer.displayName}
        username={viewer.username}
        size={compact ? "sm" : "md"}
      />
      <div className="min-w-0 flex-1">
        <Textarea
          value={body}
          onChange={(event) => setBody(event.target.value)}
          onKeyDown={(event) => {
            if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
              event.preventDefault();
              void submit();
            }
          }}
          autoFocus={autoFocus}
          maxLength={MAX_LENGTH}
          placeholder={
            parentId
              ? "Write a reply. Markdown is supported."
              : "Share an approach, ask a question or point out an edge case. Markdown is supported."
          }
          className={cn(compact ? "min-h-20" : "min-h-24")}
          aria-label={parentId ? "Reply" : "Comment"}
        />
        <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
          <p className="text-[11px] text-muted-foreground">
            <kbd className="rounded border border-border bg-muted px-1 py-0.5 font-mono text-[10px]">
              Ctrl
            </kbd>
            {" + "}
            <kbd className="rounded border border-border bg-muted px-1 py-0.5 font-mono text-[10px]">
              Enter
            </kbd>{" "}
            to post · {body.length}/{MAX_LENGTH}
          </p>
          <div className="flex items-center gap-2">
            {onCancel ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onCancel}
                disabled={submitting}
              >
                Cancel
              </Button>
            ) : null}
            <Button
              type="button"
              size="sm"
              onClick={() => void submit()}
              disabled={submitting || body.trim().length < 2}
            >
              {submitting ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Send className="size-3.5" />
              )}
              {parentId ? "Reply" : "Post comment"}
            </Button>
          </div>
        </div>
        {error ? (
          <p className="mt-2 text-xs text-destructive" role="alert">
            {error}
          </p>
        ) : null}
      </div>
    </div>
  );
}
