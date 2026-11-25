import Link from "next/link";
import { MessageSquare, MessagesSquare } from "lucide-react";
import { CommentComposer } from "@/features/discussions/comment-composer";
import { CommentThread } from "@/features/discussions/comment-thread";
import { EmptyState } from "@/components/shared/empty-state";
import { Pagination } from "@/components/shared/pagination";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { ProblemComment, ProblemCommentSort } from "@/lib/types";
import {
  buildQueryString,
  type SearchParams,
} from "@/lib/pagination";
import { cn } from "@/lib/utils";

type ViewerView = {
  id: string;
  username: string;
  displayName: string;
  role: "USER" | "TEACHER" | "ADMIN";
  avatarPreset: string | null;
  avatarImageUpdatedAt: Date | string | null;
} | null;

export function ProblemDiscussion({
  slug,
  items,
  total,
  page,
  totalPages,
  sort,
  viewer,
  searchParams,
}: {
  slug: string;
  items: ProblemComment[];
  total: number;
  page: number;
  totalPages: number;
  sort: ProblemCommentSort;
  viewer: ViewerView;
  searchParams: SearchParams;
}) {
  const sortHref = (value: ProblemCommentSort) => {
    const query = buildQueryString(searchParams, {
      tab: "discussion",
      sort: value,
      page: undefined,
    });
    return query ? `/problems/${slug}?${query}` : `/problems/${slug}`;
  };
  const loginHref = `/login?next=${encodeURIComponent(
    `/problems/${slug}?tab=discussion`,
  )}`;

  return (
    <section>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
        <div className="flex items-center gap-3">
          <span className="grid size-9 place-items-center rounded-lg bg-primary/10 text-primary">
            <MessageSquare className="size-4" />
          </span>
          <div>
            <h2 className="text-lg font-semibold">Discussion</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {total === 0
                ? "No threads yet. Start the conversation."
                : `${total} ${total === 1 ? "thread" : "threads"} from the community.`}
            </p>
          </div>
        </div>
        <div
          className="flex items-center gap-1 rounded-md border border-border p-0.5"
          role="group"
          aria-label="Sort comments"
        >
          {(["top", "new"] as const).map((value) => (
            <Link
              key={value}
              href={sortHref(value)}
              aria-current={sort === value ? "true" : undefined}
              className={cn(
                "rounded px-2.5 py-1 text-xs font-medium transition-colors",
                sort === value
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              {value === "top" ? "Top" : "Newest"}
            </Link>
          ))}
        </div>
      </div>

      <Card className="mt-4 p-4 sm:p-5">
        {viewer ? (
          <CommentComposer slug={slug} viewer={viewer} />
        ) : (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <span className="grid size-9 shrink-0 place-items-center rounded-full bg-muted text-muted-foreground">
                <MessageSquare className="size-4" />
              </span>
              <div>
                <p className="text-sm font-medium">Join the discussion</p>
                <p className="text-xs text-muted-foreground">
                  Sign in to ask questions, share approaches and vote on
                  answers.
                </p>
              </div>
            </div>
            <Link href={loginHref} className={buttonVariants({ size: "sm" })}>
              Sign in to comment
            </Link>
          </div>
        )}
      </Card>

      {items.length === 0 ? (
        <EmptyState
          className="mt-4"
          title="No comments yet"
          description="Be the first to explain an approach, ask about a constraint or share a corner case."
          icon={MessagesSquare}
        />
      ) : (
        <Card className="mt-4 px-4 py-5 sm:px-5">
          <div className="divide-y divide-border">
            {items.map((comment) => (
              <div key={comment.id} className="pt-5 first:pt-0 last:pb-0">
                <CommentThread slug={slug} comment={comment} viewer={viewer} />
              </div>
            ))}
          </div>
        </Card>
      )}

      <Pagination
        pathname={`/problems/${slug}`}
        searchParams={searchParams}
        page={page}
        totalPages={totalPages}
      />
    </section>
  );
}
