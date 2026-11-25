import type { Metadata } from "next";
import { PageHeader } from "@/components/shared/page-header";
import { MessagesWorkspace } from "@/features/messages/messages-workspace";
import { unreadLabel } from "@/features/messages/message-format";
import { RateLimitNotice } from "@/features/messages/rate-limit-notice";
import { readPage, type SearchParams } from "@/lib/pagination";
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

  return (
    <div className="w-full">
      <h1 className="sr-only">Messages</h1>
      <p className="sr-only">
        {unread
          ? `${unread} waiting for you.`
          : "Private conversations with coders you are connected to. Messaging opens once a follow request is accepted."}
      </p>
      <MessagesWorkspace
        conversations={result.items}
        activeId={null}
        list={{
          total: result.total,
          page: result.page,
          totalPages: result.totalPages,
        }}
        thread={null}
        pathname="/dashboard/messages"
        searchParams={query}
      />
    </div>
  );
}
