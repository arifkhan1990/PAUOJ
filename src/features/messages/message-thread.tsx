"use client";

import { useState } from "react";
import { CheckCheck, Flag, Trash2 } from "lucide-react";
import { useToast } from "@/components/providers/toast-provider";
import { ReportDialog } from "@/features/moderation/report-dialog";
import { ApiClientError } from "@/lib/api-client";
import type { MessageItem } from "@/lib/message-types";
import { cn } from "@/lib/utils";
import { MessageComposer } from "./message-composer";
import { formatMessageTime } from "./message-format";
import { isPendingMessage, useMessageThread } from "./use-message-thread";

function MessageBubble({
  item,
  participantName,
  showLabel,
  seen,
  confirming,
  deleting,
  onRequestDelete,
  onConfirmDelete,
  onCancelDelete,
  onReport,
}: {
  item: MessageItem;
  participantName: string;
  showLabel: boolean;
  seen: boolean;
  confirming: boolean;
  deleting: boolean;
  onRequestDelete: () => void;
  onConfirmDelete: () => void;
  onCancelDelete: () => void;
  onReport: () => void;
}) {
  const label = showLabel ? (
    <p className="px-1 text-[11px] font-medium text-muted-foreground">
      {item.mine ? "You" : participantName}
    </p>
  ) : null;
  const time = (
    <p className="flex flex-wrap items-center gap-1.5 px-1 text-[10px] text-muted-foreground">
      <time dateTime={item.createdAt} suppressHydrationWarning>
        {formatMessageTime(item.createdAt)}
      </time>
      {isPendingMessage(item) ? <span aria-hidden="true">· Sending…</span> : null}
      {seen ? (
        <span className="inline-flex items-center gap-0.5 font-medium text-primary">
          <CheckCheck className="size-3" aria-hidden="true" />
          Seen
        </span>
      ) : null}
      {item.mine && !item.deleted && !isPendingMessage(item) ? (
        confirming ? (
          <span className="inline-flex items-center gap-1">
            <span className="text-[10px] font-medium text-foreground">
              Delete?
            </span>
            <button
              type="button"
              onClick={onConfirmDelete}
              disabled={deleting}
              className="min-h-11 rounded px-2 text-[10px] font-semibold text-destructive hover:bg-destructive/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60"
            >
              {deleting ? "Deleting…" : "Delete"}
            </button>
            <button
              type="button"
              onClick={onCancelDelete}
              disabled={deleting}
              className="min-h-11 rounded px-2 text-[10px] font-medium text-muted-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60"
            >
              Cancel
            </button>
          </span>
        ) : (
          <button
            type="button"
            onClick={onRequestDelete}
            aria-label="Delete message"
            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Trash2 className="size-3.5" aria-hidden="true" />
          </button>
        )
      ) : null}
      {!item.mine && !item.deleted && !isPendingMessage(item) ? (
        <button
          type="button"
          onClick={onReport}
          aria-label="Report message"
          aria-haspopup="dialog"
          className="inline-flex min-h-11 min-w-11 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Flag className="size-3.5" aria-hidden="true" />
        </button>
      ) : null}
    </p>
  );

  if (item.deleted) {
    return (
      <li
        className={cn(
          "flex flex-col gap-1",
          item.mine ? "items-end" : "items-start",
        )}
      >
        {label}
        <div className="max-w-[85%] rounded-2xl border border-dashed border-border px-3.5 py-2 text-sm italic text-muted-foreground sm:max-w-[75%]">
          Message deleted
        </div>
        {time}
      </li>
    );
  }

  return (
    <li
      className={cn(
        "flex flex-col gap-1",
        item.mine ? "items-end" : "items-start",
      )}
    >
      {label}
      <div
        className={cn(
          "max-w-[85%] rounded-2xl px-3.5 py-2 text-sm sm:max-w-[75%]",
          item.mine
            ? "rounded-br-sm bg-primary text-primary-foreground"
            : "rounded-bl-sm bg-muted text-foreground",
          isPendingMessage(item) && "opacity-60",
        )}
      >
        <p className="whitespace-pre-wrap break-words">{item.body}</p>
      </div>
      {time}
    </li>
  );
}

export function MessageThread({
  conversationId,
  initialItems,
  page,
  participant,
  blocked,
}: {
  conversationId: string;
  initialItems: MessageItem[];
  page: number;
  participant: { username: string; displayName: string };
  blocked: boolean;
}) {
  const { items, announcement, listRef, handleScroll, sendMessage, removeMessage } =
    useMessageThread({
      conversationId,
      initialItems,
      page,
      participantName: participant.displayName,
    });
  const { toast } = useToast();
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [reportId, setReportId] = useState<string | null>(null);

  const confirmDelete = async (id: string) => {
    if (deletingId) return;
    setDeletingId(id);
    try {
      await removeMessage(id);
      setConfirmId(null);
      toast({ title: "Message deleted", variant: "success" });
    } catch (error) {
      toast({
        title: "Could not delete the message",
        description:
          error instanceof ApiClientError
            ? error.message
            : "Please try again.",
        variant: "error",
      });
    } finally {
      setDeletingId(null);
    }
  };

  const lastMine = [...items].reverse().find((item) => item.mine);
  const seenId = lastMine?.readAt ? lastMine.id : null;

  return (
    <div className="flex flex-col">
      <p className="sr-only" aria-live="polite">
        {announcement}
      </p>
      <div
        ref={listRef}
        onScroll={handleScroll}
        role="region"
        aria-label={`Conversation with ${participant.displayName}`}
        tabIndex={0}
        className="h-[min(60dvh,560px)] overflow-y-auto overscroll-contain p-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
      >
        {items.length === 0 ? (
          <div className="flex h-full items-center justify-center px-6 text-center">
            <p className="text-sm text-muted-foreground">
              No messages yet. Say hello to @{participant.username}.
            </p>
          </div>
        ) : (
          <div className="flex min-h-full flex-col justify-end">
            <ul className="flex flex-col gap-3">
              {items.map((item, index) => (
                <MessageBubble
                  key={item.id}
                  item={item}
                  participantName={participant.displayName}
                  showLabel={
                    index === 0 || items[index - 1]?.mine !== item.mine
                  }
                  seen={item.id === seenId}
                  confirming={confirmId === item.id}
                  deleting={deletingId === item.id}
                  onRequestDelete={() => setConfirmId(item.id)}
                  onConfirmDelete={() => void confirmDelete(item.id)}
                  onCancelDelete={() => setConfirmId(null)}
                  onReport={() => setReportId(item.id)}
                />
              ))}
            </ul>
          </div>
        )}
      </div>

      {blocked ? (
        <div
          role="status"
          className="border-t border-border bg-muted/50 px-4 py-3 text-xs text-muted-foreground"
        >
          This conversation is blocked, so new messages cannot be sent. Past
          messages stay visible.
        </div>
      ) : null}

      <MessageComposer blocked={blocked} onSend={sendMessage} />

      <ReportDialog
        open={reportId !== null}
        kind="MESSAGE"
        username={participant.username}
        conversationId={conversationId}
        messageId={reportId ?? undefined}
        onClose={() => setReportId(null)}
      />
    </div>
  );
}
