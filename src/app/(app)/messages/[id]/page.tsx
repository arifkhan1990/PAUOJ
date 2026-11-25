import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Pagination } from "@/components/shared/pagination";
import { UserAvatar } from "@/components/shared/user-avatar";
import { Card } from "@/components/ui/card";
import { isUuid } from "@/features/messages/message-format";
import { MessageThread } from "@/features/messages/message-thread";
import { ConversationMuteButton } from "@/features/messages/conversation-mute-button";
import { PresenceLabel } from "@/features/messages/presence-dot";
import { RateLimitNotice } from "@/features/messages/rate-limit-notice";
import { ReportButton } from "@/features/moderation/report-dialog";
import { readPage, type SearchParams } from "@/lib/pagination";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { requireUser } from "@/server/auth/guards";
import { rateLimit } from "@/server/api/rate-limit";
import {
  getConversationThread,
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

  const user = await requireUser(`/messages/${id}`);
  const limit = await rateLimit(
    `messages:thread:${user.id}`,
    MESSAGES_THREAD_RATE_LIMIT,
    MESSAGES_PAGE_RATE_WINDOW_SECONDS,
  );
  if (!limit.allowed) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        <h1 className="sr-only">Conversation</h1>
        <RateLimitNotice
          retryAfterSeconds={limit.retryAfterSeconds}
          action={
            <Link
              href="/messages"
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
  const thread = await getConversationThread(user.id, id, page);
  if (!thread) notFound();

  const { participant } = thread;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
      <h1 className="sr-only">Conversation with {participant.displayName}</h1>
      <div className="flex flex-wrap items-center gap-3">
        <Link
          href="/messages"
          aria-label="Back to messages"
          className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
        </Link>
        <UserAvatar
          name={participant.displayName}
          username={participant.username}
          size="lg"
          avatarPreset={participant.avatarPreset}
          avatarImageAt={participant.avatarImageUpdatedAt}
        />
        <div className="min-w-0 flex-1">
          <Link
            href={`/users/${participant.username}`}
            className="block truncate text-base font-semibold transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            {participant.displayName}
          </Link>
          <p className="truncate font-mono text-xs text-muted-foreground">
            @{participant.username}
          </p>
        </div>
        <div className="flex w-full flex-wrap items-center justify-between gap-2 sm:w-auto sm:justify-end">
          <PresenceLabel presence={participant.presence} />
          <div className="flex items-center gap-1">
            <ConversationMuteButton
              conversationId={thread.id}
              muted={thread.muted}
            />
            <ReportButton
              kind="CONVERSATION"
              username={participant.username}
              conversationId={thread.id}
              label="Report"
              ariaLabel="Report conversation"
            />
          </div>
        </div>
      </div>

      <Card className="mt-5 overflow-hidden p-0">
        <MessageThread
          key={`${thread.id}:${thread.page}`}
          conversationId={thread.id}
          initialItems={thread.items}
          page={thread.page}
          participant={{
            username: participant.username,
            displayName: participant.displayName,
          }}
          blocked={thread.blocked}
        />
      </Card>

      <div className="mt-4">
        {thread.totalPages > 1 ? (
          <p className="text-center text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
            {thread.page === 1
              ? "Older messages"
              : `Page ${thread.page} of ${thread.totalPages}`}
          </p>
        ) : null}
        <Pagination
          pathname={`/messages/${thread.id}`}
          searchParams={query}
          page={thread.page}
          totalPages={thread.totalPages}
        />
      </div>
    </div>
  );
}
