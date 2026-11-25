import type { Metadata } from "next";
import Link from "next/link";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { Pagination } from "@/components/shared/pagination";
import { buttonVariants } from "@/components/ui/button";
import { ConversationList } from "@/features/messages/conversation-list";
import { unreadLabel } from "@/features/messages/message-format";
import { RateLimitNotice } from "@/features/messages/rate-limit-notice";
import { readPage, type SearchParams } from "@/lib/pagination";
import { cn } from "@/lib/utils";
import { requireUser } from "@/server/auth/guards";
import { rateLimit } from "@/server/api/rate-limit";
import {
  listConversations,
  MESSAGES_LIST_RATE_LIMIT,
  MESSAGES_PAGE_RATE_WINDOW_SECONDS,
} from "@/server/services/messages";

export const metadata: Metadata = {
  title: "Messages",
  description: "Private conversations with coders on PAU OJ.",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function MessagesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const user = await requireUser("/dashboard/messages");
  const limit = await rateLimit(
    `messages:list:${user.id}`,
    MESSAGES_LIST_RATE_LIMIT,
    MESSAGES_PAGE_RATE_WINDOW_SECONDS,
  );
  if (!limit.allowed) {
    return (
      <div className="max-w-3xl space-y-6">
        <PageHeader
          eyebrow="Inbox"
          title="Messages"
          description="Private conversations with coders on PAU OJ."
        />
        <RateLimitNotice retryAfterSeconds={limit.retryAfterSeconds} />
      </div>
    );
  }
  const query = await searchParams;
  const page = readPage(query);
  const result = await listConversations(user.id, page);
  const unread = unreadLabel(result.unreadTotal);
  const pastEnd = result.items.length === 0 && result.total > 0;

  return (
    <div className="max-w-3xl space-y-6">
      <PageHeader
        eyebrow="Inbox"
        title="Messages"
        description={
          unread
            ? `${unread} waiting for you.`
            : "Private conversations with coders you are connected to. Messaging opens once a follow request is accepted."
        }
      />

      <div>
        {pastEnd ? (
          <EmptyState
            title="Nothing on this page"
            description="This page is past the end of your conversations."
            action={
              <Link
                href="/dashboard/messages"
                className={cn(buttonVariants({ variant: "outline" }), "min-h-11")}
              >
                Back to page 1
              </Link>
            }
          />
        ) : (
          <ConversationList conversations={result.items} />
        )}
      </div>

      <Pagination
        pathname="/dashboard/messages"
        searchParams={query}
        page={result.page}
        totalPages={result.totalPages}
      />
    </div>
  );
}
