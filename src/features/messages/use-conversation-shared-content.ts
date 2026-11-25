"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ApiClientError, apiRequest } from "@/lib/api-client";
import type { ConversationSharedContent } from "@/lib/message-types";

export type SharedContentState = {
  status: "idle" | "loading" | "ready" | "error";
  data: ConversationSharedContent | null;
  error: string | null;
};

const IDLE: SharedContentState = { status: "idle", data: null, error: null };

/** Shared media/links/documents refresh while the info panel stays open. */
export const SHARED_CONTENT_POLL_INTERVAL_MS = 20_000;

function describeSharedError(error: unknown): string {
  return error instanceof ApiClientError
    ? error.message
    : "Could not load shared media and links.";
}

/**
 * Loads the conversation info panel payload when the panel opens, refreshes it
 * as soon as it is reopened, then polls every 20s while it stays open and the
 * tab is visible. The last good payload is cached while the panel is closed so
 * reopening stays instant; background failures never clear it.
 */
export function useConversationSharedContent(
  conversationId: string | null,
  enabled: boolean,
) {
  const [state, setState] = useState<SharedContentState>(IDLE);
  const [request, setRequest] = useState(0);
  const cached = useRef<ConversationSharedContent | null>(null);
  const owner = useRef<string | null>(null);

  useEffect(() => {
    if (!enabled || !conversationId) return;
    const id = conversationId;

    // Switching conversations must never show the previous person's files.
    if (owner.current !== id) {
      owner.current = id;
      cached.current = null;
      setState(IDLE);
    }

    let cancelled = false;
    let inFlight = false;
    const controller = new AbortController();

    const pull = async (initial: boolean) => {
      // Never overlap requests; an in-flight fetch already covers this payload.
      if (inFlight) return;
      inFlight = true;
      if (initial && cached.current === null) {
        setState({ status: "loading", data: null, error: null });
      }
      try {
        const data = await apiRequest<ConversationSharedContent>(
          `/api/v1/messages/conversations/${id}/info`,
          { signal: controller.signal },
        );
        if (cancelled) return;
        cached.current = data;
        setState({ status: "ready", data, error: null });
      } catch (error) {
        if (cancelled) return;
        // A failed refresh keeps the last good payload on screen.
        if (cached.current === null) {
          setState({
            status: "error",
            data: null,
            error: describeSharedError(error),
          });
        }
      } finally {
        inFlight = false;
      }
    };

    void pull(true);

    const interval = window.setInterval(() => {
      if (document.visibilityState !== "visible") return;
      void pull(false);
    }, SHARED_CONTENT_POLL_INTERVAL_MS);

    // Catch up immediately when the tab comes back instead of waiting a tick.
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") void pull(false);
    };
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      cancelled = true;
      controller.abort();
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [conversationId, enabled, request]);

  const retry = useCallback(() => {
    setRequest((current) => current + 1);
  }, []);

  return { ...state, retry };
}
