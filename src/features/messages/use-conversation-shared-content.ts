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

/**
 * Lazily loads the conversation info panel payload once the panel opens. The
 * last payload stays cached while the panel is closed, but reopening refreshes
 * it so media or links shared in the meantime appear without a page reload.
 */
export function useConversationSharedContent(
  conversationId: string | null,
  enabled: boolean,
) {
  const [state, setState] = useState<SharedContentState>(IDLE);
  const [request, setRequest] = useState(0);
  const handled = useRef<{ id: string | null; request: number }>({
    id: null,
    request: 0,
  });

  useEffect(() => {
    // A closed panel invalidates the cache marker; the next open refetches.
    if (!enabled) {
      handled.current = { id: null, request: handled.current.request };
    }
  }, [enabled]);

  useEffect(() => {
    if (!enabled || !conversationId) return;
    if (
      handled.current.id === conversationId &&
      handled.current.request === request
    ) {
      return;
    }
    handled.current = { id: conversationId, request };
    let active = true;
    setState({ status: "loading", data: null, error: null });

    void (async () => {
      try {
        const data = await apiRequest<ConversationSharedContent>(
          `/api/v1/messages/conversations/${conversationId}/info`,
        );
        if (!active) return;
        setState({ status: "ready", data, error: null });
      } catch (error) {
        if (!active) return;
        setState({
          status: "error",
          data: null,
          error:
            error instanceof ApiClientError
              ? error.message
              : "Could not load shared media and links.",
        });
      }
    })();

    return () => {
      active = false;
    };
  }, [conversationId, enabled, request]);

  const retry = useCallback(() => {
    setRequest((current) => current + 1);
  }, []);

  return { ...state, retry };
}
