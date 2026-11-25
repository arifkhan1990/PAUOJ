"use client";

import { useCallback, useId, useRef, useState } from "react";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  MessagesSquare,
  ShieldCheck,
} from "lucide-react";
import type {
  ConversationSummary,
  ConversationThread,
} from "@/lib/message-types";
import { pageHref, type SearchParams } from "@/lib/pagination";
import { cn } from "@/lib/utils";
import { ConversationHeader } from "./conversation-header";
import { ConversationInfoPanel } from "./conversation-info-panel";
import { ConversationRail } from "./conversation-rail";
import { MessageThread } from "./message-thread";
import { useConversationSharedContent } from "./use-conversation-shared-content";

function ThreadPageBar({
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
  if (totalPages <= 1) return null;
  const older = Math.min(totalPages, page + 1);
  const newer = Math.max(1, page - 1);
  return (
    <nav
      aria-label="Older messages"
      className="flex min-h-11 shrink-0 items-center justify-between gap-2 border-b border-border bg-muted/30 px-2 py-1"
    >
      <Link
        href={pageHref(pathname, searchParams, older)}
        aria-disabled={page >= totalPages}
        className={cn(
          "inline-flex min-h-11 items-center gap-1 rounded-md px-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          page >= totalPages && "pointer-events-none opacity-40",
        )}
      >
        <ChevronLeft className="size-4" aria-hidden="true" />
        Older
      </Link>
      <span className="text-[11px] font-medium tabular-nums text-muted-foreground">
        Page {page} of {totalPages}
      </span>
      <Link
        href={pageHref(pathname, searchParams, newer)}
        aria-disabled={page <= 1}
        className={cn(
          "inline-flex min-h-11 items-center gap-1 rounded-md px-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          page <= 1 && "pointer-events-none opacity-40",
        )}
      >
        Newer
        <ChevronRight className="size-4" aria-hidden="true" />
      </Link>
    </nav>
  );
}

function EmptyConversationPane() {
  return (
    <div className="hidden min-h-0 min-w-0 flex-1 flex-col items-center justify-center gap-3 bg-muted/20 px-6 text-center md:flex">
      <span className="grid size-14 place-items-center rounded-full border border-primary/20 bg-primary/10 text-primary">
        <MessagesSquare className="size-6" aria-hidden="true" />
      </span>
      <h2 className="text-sm font-semibold">Select a conversation</h2>
      <p className="max-w-xs text-sm text-muted-foreground">
        Pick a chat from the rail to read the thread and reply. Conversations
        stay private between you and the other coder.
      </p>
      <p className="mt-1 inline-flex items-center gap-1.5 text-[11px] text-muted-foreground">
        <ShieldCheck className="size-3.5" aria-hidden="true" />
        Messaging unlocks after a follow request is accepted
      </p>
    </div>
  );
}

/**
 * WhatsApp-style messages workspace shared by the inbox and thread routes.
 * The rail, thread and info column all scroll independently inside one
 * bordered shell so the dashboard footer stays below the chat area.
 */
export function MessagesWorkspace({
  conversations,
  activeId,
  list,
  thread,
  pathname,
  searchParams,
}: {
  conversations: ConversationSummary[];
  activeId: string | null;
  list: { total: number; page: number; totalPages: number };
  thread: ConversationThread | null;
  pathname: string;
  searchParams: SearchParams;
}) {
  const currentId = thread?.id ?? activeId;
  const infoId = useId();
  const panelId = `conversation-info-${infoId}`;
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [infoOpenId, setInfoOpenId] = useState<string | null>(null);
  // The panel belongs to one conversation, so navigation closes it without a
  // post-paint effect and never flashes the previous person's details.
  const infoOpen = currentId !== null && infoOpenId === currentId;
  const shared = useConversationSharedContent(currentId, infoOpen);

  const closeInfo = useCallback(() => {
    setInfoOpenId(null);
    triggerRef.current?.focus();
  }, []);

  return (
    <div className="flex h-[calc(100dvh-7rem)] min-h-[28rem] w-full overflow-hidden rounded-xl border border-border bg-card shadow-xs">
      <ConversationRail
        conversations={conversations}
        activeId={currentId}
        total={list.total}
        page={list.page}
        totalPages={list.totalPages}
        pathname={pathname}
        searchParams={searchParams}
        showViewAll={Boolean(thread)}
        className={thread ? "hidden md:flex" : "flex"}
      />

      {thread ? (
        <>
          <section className="flex min-h-0 min-w-0 flex-1 flex-col bg-background/40">
            <ConversationHeader
              conversationId={thread.id}
              participant={thread.participant}
              muted={thread.muted}
              infoOpen={infoOpen}
              infoPanelId={panelId}
              onToggleInfo={() =>
                setInfoOpenId(infoOpen ? null : currentId)
              }
              triggerRef={triggerRef}
            />
            <ThreadPageBar
              pathname={`/dashboard/messages/${thread.id}`}
              searchParams={searchParams}
              page={thread.page}
              totalPages={thread.totalPages}
            />
            <MessageThread
              key={`${thread.id}:${thread.page}`}
              conversationId={thread.id}
              initialItems={thread.items}
              page={thread.page}
              participant={{
                username: thread.participant.username,
                displayName: thread.participant.displayName,
              }}
              blocked={thread.blocked}
            />
          </section>

          {infoOpen ? (
            <ConversationInfoPanel
              panelId={panelId}
              conversationId={thread.id}
              participant={thread.participant}
              muted={thread.muted}
              shared={shared}
              onRetryShared={shared.retry}
              onClose={closeInfo}
            />
          ) : null}
        </>
      ) : (
        <EmptyConversationPane />
      )}
    </div>
  );
}
