import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { isUuid } from "@/features/messages/message-format";
import { MessagesWorkspace } from "@/features/messages/messages-workspace";
import { RateLimitNotice } from "@/features/messages/rate-limit-notice";
import { readPage, type SearchParams } from "@/lib/pagination";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { requireUser } from "@/server/auth/guards";
import { rateLimit } from "@/server/api/rate-limit";
import {
  getConversationThread,
  listConversations,
  MESSAGES_PAGE_RATE_WINDOW_SECONDS,
  MESSAGES_THREAD_RATE_LIMIT,
} from "@/server/services/messages";

export const metadata: Metadata = {
  title: "Conversation",
  description: "Private conversation on PAU OJ.",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function ConversationPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<SearchParams>;
}) {
  const { id } = await params;
  if (!isUuid(id)) notFound();

  const user = await requireUser(`/dashboard/messages/${id}`);
  const limit = await rateLimit(
    `messages:thread:${user.id}`,
    MESSAGES_THREAD_RATE_LIMIT,
    MESSAGES_PAGE_RATE_WINDOW_SECONDS,
  );
  if (!limit.allowed) {
    return (
      <div className="max-w-3xl space-y-6">
        <h1 className="sr-only">Conversation</h1>
        <RateLimitNotice
          retryAfterSeconds={limit.retryAfterSeconds}
          action={
            <Link
              href="/dashboard/messages"
              className={cn(buttonVariants({ variant: "outline" }), "min-h-11")}
            >
              Back to messages
            </Link>
          }
        />
      </div>
    );
  }
  const query = await searchParams;
  const page = readPage(query);
  // The rail keeps the newest conversations; the thread is paginated separately.
  const [thread, list] = await Promise.all([
    getConversationThread(user.id, id, page),
    listConversations(user.id, 1),
  ]);
  if (!thread) notFound();

  return (
    <div className="w-full">
      <h1 className="sr-only">Conversation with {thread.participant.displayName}</h1>
      <MessagesWorkspace
        conversations={list.items}
        activeId={thread.id}
        list={{
          total: list.total,
          page: list.page,
          totalPages: list.totalPages,
        }}
        thread={thread}
        pathname={`/dashboard/messages/${thread.id}`}
        searchParams={query}
      />
    </div>
  );
}
