"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { apiDelete, apiPost, apiRequest } from "@/lib/api-client";
import type { ConversationThread, MessageItem } from "@/lib/message-types";
import {
  mergeMessages,
  newIncomingMessages,
} from "./message-format";

const POLL_INTERVAL_MS = 10_000;
const PENDING_PREFIX = "pending:";

type PollPayload = ConversationThread | MessageItem[];

function pendingMessage(body: string): MessageItem {
  return {
    id: `${PENDING_PREFIX}${crypto.randomUUID()}`,
    body,
    mine: true,
    createdAt: new Date().toISOString(),
    readAt: null,
    deleted: false,
  };
}

export function useMessageThread({
  conversationId,
  initialItems,
  page,
  participantName,
}: {
  conversationId: string;
  initialItems: MessageItem[];
  page: number;
  participantName: string;
}) {
  const router = useRouter();
  const [items, setItems] = useState<MessageItem[]>(initialItems);
  const [announcement, setAnnouncement] = useState("");
  const listRef = useRef<HTMLDivElement>(null);
  const itemsRef = useRef<MessageItem[]>(initialItems);
  const stickToBottom = useRef(true);
  const initialScrolled = useRef(false);

  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  // Server data (refresh, read receipts) is folded into local polled state.
  useEffect(() => {
    setItems((current) => mergeMessages(current, initialItems));
  }, [initialItems]);

  const markRead = useCallback(() => {
    void apiPost(`/api/v1/messages/conversations/${conversationId}/read`, {}).catch(
      () => {
        // Read receipts are best-effort; never block the thread.
      },
    );
  }, [conversationId]);

  useEffect(() => {
    markRead();
  }, [markRead]);

  useEffect(() => {
    if (page !== 1) return;
    let active = true;

    const poll = async () => {
      if (document.visibilityState !== "visible") return;
      try {
        const payload = await apiRequest<PollPayload>(
          `/api/v1/messages/conversations/${conversationId}?page=1`,
        );
        if (!active) return;
        const polled = Array.isArray(payload) ? payload : payload.items;
        if (polled.length === 0) return;
        const fresh = newIncomingMessages(itemsRef.current, polled);
        setItems((current) => mergeMessages(current, polled));
        if (fresh.length > 0) {
          setAnnouncement(
            `${fresh.length} new ${
              fresh.length === 1 ? "message" : "messages"
            } from ${participantName}.`,
          );
          markRead();
        }
      } catch {
        // Keep polling; a transient failure should not surface as a toast.
      }
    };

    const interval = window.setInterval(() => void poll(), POLL_INTERVAL_MS);
    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, [conversationId, markRead, page, participantName]);

  useEffect(() => {
    const element = listRef.current;
    if (!element) return;
    if (!initialScrolled.current) {
      element.scrollTop = element.scrollHeight;
      initialScrolled.current = true;
      return;
    }
    if (stickToBottom.current) element.scrollTop = element.scrollHeight;
  }, [items.length]);

  const handleScroll = useCallback(() => {
    const element = listRef.current;
    if (!element) return;
    stickToBottom.current =
      element.scrollHeight - element.scrollTop - element.clientHeight < 48;
  }, []);

  const removeMessage = useCallback(
    async (messageId: string) => {
      await apiDelete<{ deleted: true }>(`/api/v1/messages/${messageId}`);
      setItems((current) =>
        current.map((item) =>
          item.id === messageId
            ? { ...item, deleted: true, body: "" }
            : item,
        ),
      );
      router.refresh();
    },
    [router],
  );

  const sendMessage = useCallback(
    async (body: string) => {
      const optimistic = pendingMessage(body);
      stickToBottom.current = true;
      setItems((current) => [...current, optimistic]);
      try {
        const created = await apiPost<MessageItem>(
          `/api/v1/messages/conversations/${conversationId}/messages`,
          { body },
        );
        setItems((current) =>
          mergeMessages(
            current.filter((item) => item.id !== optimistic.id),
            [created],
          ),
        );
        router.refresh();
      } catch (error) {
        setItems((current) =>
          current.filter((item) => item.id !== optimistic.id),
        );
        throw error;
      }
    },
    [conversationId, router],
  );

  return {
    items,
    announcement,
    listRef,
    handleScroll,
    sendMessage,
    removeMessage,
  };
}

export function isPendingMessage(item: MessageItem): boolean {
  return item.id.startsWith(PENDING_PREFIX);
}
