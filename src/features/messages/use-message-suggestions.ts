"use client";

import { useCallback, useEffect, useState } from "react";
import { ApiClientError, apiRequest } from "@/lib/api-client";
import type {
  MessageSuggestion,
  MessageSuggestionKind,
  MessageSuggestionResponse,
} from "@/lib/message-types";

export const SUGGESTION_DEBOUNCE_MS = 200;
export const MAX_SUGGESTIONS = 8;
/** Mirrors the API's query cap so a long draft filter never 400s. */
const MAX_QUERY_LENGTH = 80;

function suggestionsPath(
  kind: MessageSuggestionKind,
  query: string,
): string {
  const params = new URLSearchParams({ kind });
  if (query) params.set("q", query.slice(0, MAX_QUERY_LENGTH));
  return `/api/v1/messages/suggestions?${params.toString()}`;
}

/**
 * Debounced, abortable fetch for the composer drawer. Nothing is requested
 * until a category is known, and a superseded keystroke can never overwrite a
 * newer result.
 */
export function useMessageSuggestions(
  kind: MessageSuggestionKind | null,
  query: string,
) {
  const [items, setItems] = useState<MessageSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  // Switching category must not show the previous category's rows, even
  // during the debounce window.
  useEffect(() => {
    setItems([]);
  }, [kind]);

  useEffect(() => {
    if (!kind) {
      setLoading(false);
      setError(null);
      return;
    }

    const controller = new AbortController();
    setLoading(true);
    setError(null);
    const timer = window.setTimeout(() => {
      void apiRequest<MessageSuggestionResponse>(suggestionsPath(kind, query), {
        signal: controller.signal,
      })
        .then((payload) => {
          if (controller.signal.aborted) return;
          setItems(payload.items.slice(0, MAX_SUGGESTIONS));
          setLoading(false);
        })
        .catch((cause: unknown) => {
          if (controller.signal.aborted) return;
          setItems([]);
          setLoading(false);
          setError(
            cause instanceof ApiClientError
              ? cause.message
              : "Could not load suggestions.",
          );
        });
    }, SUGGESTION_DEBOUNCE_MS);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [attempt, kind, query]);

  const retry = useCallback(() => {
    setAttempt((current) => current + 1);
  }, []);

  return { items, loading, error, retry };
}
