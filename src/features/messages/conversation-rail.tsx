"use client";

import { useId, useMemo, useState } from "react";
import Link from "next/link";
import {
  BellOff,
  ChevronLeft,
  ChevronRight,
  MessageSquare,
  Search,
  SearchX,
} from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";
import { UserAvatar } from "@/components/shared/user-avatar";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TabBar, tabId } from "@/components/ui/tab-bar";
import type { ConversationSummary } from "@/lib/message-types";
import { pageHref, type SearchParams } from "@/lib/pagination";
import { cn } from "@/lib/utils";
import {
  conversationFilterCounts,
  filterConversations,
  type ConversationFilter,
} from "./conversation-filter";
import {
  conversationPreview,
  conversationRowState,
  formatMessageTime,
  unreadLabel,
} from "./message-format";
import { PresenceDot } from "./presence-dot";

function ConversationRow({
  conversation,
  active,
}: {
  conversation: ConversationSummary;
  active: boolean;
}) {
  const { muted, unread, showUnreadBadge } = conversationRowState(
    conversation.muted,
    conversation.unreadCount,
  );
  return (
    <li>
      <Link
        href={`/dashboard/messages/${conversation.id}`}
        aria-current={active ? "page" : undefined}
        className={cn(
          "relative flex min-h-14 items-center gap-3 px-3 py-3 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring sm:px-4",
          active ? "bg-primary/10" : "hover:bg-muted/60",
        )}
      >
        {active ? (
          <span
            className="absolute inset-y-2 left-0 w-0.5 rounded-r-full bg-primary"
            aria-hidden="true"
          />
        ) : null}
        <span className="relative shrink-0">
          <UserAvatar
            name={conversation.displayName}
            username={conversation.username}
            size="md"
            avatarPreset={conversation.avatarPreset}
            avatarImageAt={conversation.avatarImageUpdatedAt}
          />
          <span className="absolute -bottom-0.5 -right-0.5 grid place-items-center">
            <PresenceDot presence={conversation.presence} />
          </span>
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex items-baseline justify-between gap-3">
            <span className="flex min-w-0 items-center gap-1.5">
              <span
                className={cn(
                  "min-w-0 truncate text-sm",
                  showUnreadBadge ? "font-semibold" : "font-medium",
                )}
              >
                {conversation.displayName}{" "}
                <span className="font-normal text-muted-foreground">
                  @{conversation.username}
                </span>
              </span>
              {muted ? (
                <span
                  className="inline-flex shrink-0 text-muted-foreground"
                  title="Muted"
                >
                  <BellOff className="size-3.5" aria-hidden="true" />
                  <span className="sr-only">Muted</span>
                </span>
              ) : null}
            </span>
            <span
              className="shrink-0 whitespace-nowrap text-[11px] tabular-nums text-muted-foreground"
              suppressHydrationWarning
            >
              {formatMessageTime(conversation.lastMessageAt)}
            </span>
          </span>
          <span className="mt-0.5 flex items-center justify-between gap-3">
            <span
              className={cn(
                "min-w-0 truncate text-xs",
                showUnreadBadge
                  ? "font-medium text-foreground"
                  : "text-muted-foreground",
              )}
            >
              {conversationPreview(conversation.lastMessage)}
            </span>
            {showUnreadBadge ? (
              <Badge
                className="h-5 min-w-5 shrink-0 justify-center rounded-full px-1.5 text-[10px] tabular-nums"
                aria-label={unreadLabel(unread) ?? undefined}
              >
                {unread > 99 ? "99+" : unread}
              </Badge>
            ) : null}
          </span>
        </span>
      </Link>
    </li>
  );
}

/** Compact prev/next so the rail footer never eats thread height. */
function RailPagination({
  pathname,
  searchParams,
  page,
  totalPages,
}: {
  pathname: string;
  searchParams: SearchParams;
  page: number;
  totalPages: number;
}) {
  return (
    <>
      <Link
        href={pageHref(pathname, searchParams, Math.max(1, page - 1))}
        aria-disabled={page <= 1}
        aria-label="Previous page of chats"
        className={cn(
          buttonVariants({ variant: "ghost", size: "icon" }),
          "min-h-11 min-w-11 text-muted-foreground",
          page <= 1 && "pointer-events-none opacity-40",
        )}
      >
        <ChevronLeft className="size-4" aria-hidden="true" />
      </Link>
      <p className="text-[11px] font-medium tabular-nums text-muted-foreground">
        Page {page} of {totalPages}
      </p>
      <Link
        href={pageHref(pathname, searchParams, Math.min(totalPages, page + 1))}
        aria-disabled={page >= totalPages}
        aria-label="Next page of chats"
        className={cn(
          buttonVariants({ variant: "ghost", size: "icon" }),
          "min-h-11 min-w-11 text-muted-foreground",
          page >= totalPages && "pointer-events-none opacity-40",
        )}
      >
        <ChevronRight className="size-4" aria-hidden="true" />
      </Link>
    </>
  );
}

export function ConversationRail({
  conversations,
  activeId,
  total,
  page,
  totalPages,
  pathname,
  searchParams,
  showViewAll = false,
  className,
}: {
  conversations: ConversationSummary[];
  activeId: string | null;
  total: number;
  page: number;
  totalPages: number;
  pathname: string;
  searchParams: SearchParams;
  /** Thread pages link back to the full inbox instead of paging the rail. */
  showViewAll?: boolean;
  className?: string;
}) {
  const idPrefix = useId();
  const panelId = `${idPrefix}-list`;
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<ConversationFilter>("all");
  const counts = useMemo(
    () => conversationFilterCounts(conversations),
    [conversations],
  );
  const visible = useMemo(
    () => filterConversations(conversations, filter, query),
    [conversations, filter, query],
  );

  const empty = conversations.length === 0;
  const pastEnd = empty && total > 0;
  const filteredOut =
    !empty && visible.length === 0 && (query.trim() !== "" || filter === "unread");

  return (
    <aside
      aria-label="Conversations"
      className={cn(
        "min-h-0 w-full shrink-0 flex-col border-border bg-card md:w-80 md:border-r lg:w-[21rem]",
        className,
      )}
    >
      <div className="shrink-0 border-b border-border px-3 pb-3 pt-4 sm:px-4">
        <div className="flex items-baseline justify-between gap-2">
          <h2 className="text-base font-semibold tracking-tight">Chats</h2>
          <p className="text-[11px] text-muted-foreground">
            {total} {total === 1 ? "conversation" : "conversations"}
          </p>
        </div>
        <div className="relative mt-3">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search name, @username or message"
            aria-label="Search conversations"
            className="h-11 pl-9"
          />
        </div>
        <TabBar
          idPrefix={idPrefix}
          ariaLabel="Filter conversations"
          panelId={panelId}
          value={filter}
          onChange={(value) => setFilter(value as ConversationFilter)}
          items={[
            { value: "all", label: "All", count: counts.all },
            { value: "unread", label: "Unread", count: counts.unread },
          ]}
          className="mt-3 border-0 bg-muted/50 p-0.5"
        />
      </div>

      <div
        id={panelId}
        role="tabpanel"
        aria-labelledby={tabId(idPrefix, filter)}
        className="reference-scroll min-h-0 flex-1 overflow-y-auto overscroll-contain"
      >
        <p className="sr-only" aria-live="polite">
          {visible.length} {visible.length === 1 ? "conversation" : "conversations"} shown
        </p>
        {empty ? (
          <div className="p-3">
            {pastEnd ? (
              <EmptyState
                title="Nothing on this page"
                description="This page is past the end of your conversations."
                action={
                  <Link
                    href="/dashboard/messages"
                    className={cn(
                      buttonVariants({ variant: "outline" }),
                      "min-h-11",
                    )}
                  >
                    Back to page 1
                  </Link>
                }
              />
            ) : (
              <EmptyState
                icon={MessageSquare}
                title="No conversations yet"
                description="You can message someone who accepted your follow request. Follow a coder, get accepted, then open their profile to say hello."
                action={
                  <Link
                    href="/rank"
                    className={cn(buttonVariants(), "min-h-11")}
                  >
                    Find coders to follow
                  </Link>
                }
              />
            )}
          </div>
        ) : filteredOut ? (
          <div className="flex flex-col items-center px-6 py-12 text-center">
            <span className="grid size-11 place-items-center rounded-full bg-muted text-muted-foreground">
              <SearchX className="size-5" aria-hidden="true" />
            </span>
            <p className="mt-3 text-sm font-medium">No chats match</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {filter === "unread"
                ? "Every loaded chat is read. Try the All tab."
                : "Try a different name, username or keyword."}
            </p>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="mt-2 min-h-11 text-primary"
              onClick={() => {
                setQuery("");
                setFilter("all");
              }}
            >
              Clear filters
            </Button>
          </div>
        ) : (
          <ul className="divide-y divide-border/70">
            {visible.map((conversation) => (
              <ConversationRow
                key={conversation.id}
                conversation={conversation}
                active={conversation.id === activeId}
              />
            ))}
          </ul>
        )}
      </div>

      <div className="flex min-h-12 shrink-0 items-center justify-between gap-1 border-t border-border px-2 py-1">
        {showViewAll ? (
          totalPages > 1 ? (
            <Link
              href="/dashboard/messages"
              className="inline-flex min-h-11 items-center gap-1 rounded-md px-2 text-xs font-medium text-primary transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              View all conversations
              <ChevronRight className="size-3.5" aria-hidden="true" />
            </Link>
          ) : (
            <p className="px-2 text-[11px] text-muted-foreground">
              {total} {total === 1 ? "conversation" : "conversations"} in your
              inbox
            </p>
          )
        ) : totalPages > 1 ? (
          <RailPagination
            pathname={pathname}
            searchParams={searchParams}
            page={page}
            totalPages={totalPages}
          />
        ) : (
          <p className="px-2 text-[11px] text-muted-foreground">
            {total === 0
              ? "Your inbox is empty"
              : filter === "unread" && counts.unread === 0
                ? "No unread chats"
                : "You are all caught up"}
          </p>
        )}
      </div>
    </aside>
  );
}
