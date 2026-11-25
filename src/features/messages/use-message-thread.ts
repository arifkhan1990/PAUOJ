"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ApiClientError,
  apiDelete,
  apiPost,
  apiPostForm,
  apiRequest,
} from "@/lib/api-client";
import type {
  ConversationThread,
  MessageAttachment,
  MessageItem,
} from "@/lib/message-types";
import {
  mergeMessages,
  messageImageMime,
  newIncomingMessages,
} from "./message-format";

const POLL_INTERVAL_MS = 10_000;
const PENDING_PREFIX = "pending:";

type PollPayload = ConversationThread | MessageItem[];

function pendingMessage(
  body: string,
  attachment: MessageAttachment | null = null,
): MessageItem {
  return {
    id: `${PENDING_PREFIX}${crypto.randomUUID()}`,
    body,
    mine: true,
    createdAt: new Date().toISOString(),
    readAt: null,
    deleted: false,
    attachment,
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
  // Blob URLs created for optimistic image bubbles, revoked on unmount.
  const objectUrls = useRef(new Set<string>());

  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  useEffect(() => {
    const urls = objectUrls.current;
    return () => {
      for (const url of urls) URL.revokeObjectURL(url);
      urls.clear();
    };
  }, []);

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
            ? { ...item, deleted: true, body: "", attachment: null }
            : item,
        ),
      );
      router.refresh();
    },
    [router],
  );

  const releaseObjectUrl = useCallback((url: string) => {
    // Let React commit the replacement bubble before the blob goes away.
    window.setTimeout(() => {
      URL.revokeObjectURL(url);
      objectUrls.current.delete(url);
    }, 0);
  }, []);

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

  const sendImage = useCallback(
    async (file: File, caption: string) => {
      const mime = messageImageMime(file.type);
      if (!mime) {
        throw new ApiClientError(
          "UNSUPPORTED_IMAGE",
          "Choose a PNG, JPEG, or WebP image.",
          400,
        );
      }

      const url = URL.createObjectURL(file);
      objectUrls.current.add(url);
      const optimistic = pendingMessage(caption, {
        id: `local:${crypto.randomUUID()}`,
        mime,
        width: 0,
        height: 0,
        url,
      });
      stickToBottom.current = true;
      setItems((current) => [...current, optimistic]);

      const form = new FormData();
      form.append("file", file);
      if (caption) form.append("caption", caption);

      try {
        const created = await apiPostForm<MessageItem>(
          `/api/v1/messages/conversations/${conversationId}/images`,
          form,
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
      } finally {
        releaseObjectUrl(url);
      }
    },
    [conversationId, releaseObjectUrl, router],
  );

  return {
    items,
    announcement,
    listRef,
    handleScroll,
    sendMessage,
    sendImage,
    removeMessage,
  };
}

export function isPendingMessage(item: MessageItem): boolean {
  return item.id.startsWith(PENDING_PREFIX);
}
