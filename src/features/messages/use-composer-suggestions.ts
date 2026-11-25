"use client";

import { useCallback, useId, useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import { formatMessageReference } from "@/lib/message-references";
import {
  insertReference,
  replaceSelection,
  type TextInsertion,
} from "./composer-insert";
import {
  detectSuggestionTrigger,
  filterSuggestionCategories,
  primaryAlias,
  type SuggestionCategoryOption,
  type SuggestionTrigger,
} from "./suggestion-trigger";
import { useMessageSuggestions } from "./use-message-suggestions";

/**
 * All composer drawer state in one place: the trigger under the caret, the
 * debounced result list, the active row and the keyboard contract. The
 * composer keeps the textarea; it calls `sync` on every selection change and
 * forwards keydown events until this hook says it handled them.
 */
export function useComposerSuggestions({
  value,
  applyInsert,
}: {
  value: string;
  applyInsert: (insertion: TextInsertion) => void;
}) {
  const baseId = useId();
  const listboxId = `${baseId}-suggestions`;
  const [trigger, setTrigger] = useState<SuggestionTrigger | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  // Suppresses reopening at the same `@` after Escape.
  const dismissedStart = useRef<number | null>(null);
  const lastKey = useRef("");

  const kind = trigger?.mode === "items" ? trigger.kind : null;
  const query = trigger?.mode === "items" ? trigger.query : "";
  const { items, loading, error, retry } = useMessageSuggestions(kind, query);

  const categories: SuggestionCategoryOption[] =
    trigger?.mode === "categories"
      ? filterSuggestionCategories(trigger.query)
      : [];
  const visibleItems = trigger?.mode === "items" ? items : [];
  const count =
    trigger?.mode === "categories" ? categories.length : visibleItems.length;
  const clampedActive = count === 0 ? 0 : Math.min(activeIndex, count - 1);

  const sync = useCallback((nextValue: string, caret: number | null) => {
    if (caret === null) {
      setTrigger(null);
      return;
    }
    const next = detectSuggestionTrigger(nextValue, caret);
    if (!next) {
      // Leaving the trigger (including clearing or replacing the draft) ends
      // the Escape/selection suppression, so a fresh `@` opens again.
      dismissedStart.current = null;
      setTrigger(null);
      return;
    }
    if (next.start === dismissedStart.current) {
      setTrigger(null);
      return;
    }
    dismissedStart.current = null;
    setTrigger(next);
    const key = `${next.mode}:${next.mode === "items" ? next.kind : ""}:${next.query}`;
    if (key !== lastKey.current) {
      lastKey.current = key;
      setActiveIndex(0);
    }
  }, []);

  const close = useCallback(() => {
    if (trigger) dismissedStart.current = trigger.start;
    setTrigger(null);
  }, [trigger]);

  const reset = useCallback(() => {
    dismissedStart.current = null;
    lastKey.current = "";
    setTrigger(null);
    setActiveIndex(0);
  }, []);

  const selectIndex = useCallback(
    (index: number) => {
      if (!trigger) return;

      if (trigger.mode === "categories") {
        const category = filterSuggestionCategories(trigger.query)[index];
        if (!category) return;
        const alias = `@${primaryAlias(category.kind)}`;
        const result = replaceSelection(
          {
            value,
            selectionStart: trigger.start,
            selectionEnd: trigger.end,
          },
          alias,
        );
        if (!result) return;
        applyInsert(result);
        lastKey.current = `items:${category.kind}:`;
        setActiveIndex(0);
        setTrigger({
          mode: "items",
          start: trigger.start,
          end: result.caret,
          kind: category.kind,
          query: "",
        });
        return;
      }

      const item = items[index];
      if (!item) return;
      const token = formatMessageReference({
        label: item.label,
        href: item.href,
      });
      if (!token) return;
      const result = insertReference(
        {
          value,
          selectionStart: trigger.start,
          selectionEnd: trigger.end,
        },
        token,
      );
      if (!result) return;
      applyInsert(result);
      // The inserted token is not a trigger, so the drawer stays closed until
      // the user types a fresh `@`. Do not suppress that position: selecting a
      // row is not the same as pressing Escape.
      setTrigger(null);
    },
    [applyInsert, items, trigger, value],
  );

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLTextAreaElement>): boolean => {
      if (!trigger) return false;
      const total =
        trigger.mode === "categories"
          ? filterSuggestionCategories(trigger.query).length
          : items.length;

      switch (event.key) {
        case "ArrowDown":
          event.preventDefault();
          if (total > 0) {
            setActiveIndex((current) => (Math.min(current, total - 1) + 1) % total);
          }
          return true;
        case "ArrowUp":
          event.preventDefault();
          if (total > 0) {
            setActiveIndex(
              (current) => (Math.min(current, total - 1) - 1 + total) % total,
            );
          }
          return true;
        case "Home":
          event.preventDefault();
          setActiveIndex(0);
          return true;
        case "End":
          event.preventDefault();
          if (total > 0) setActiveIndex(total - 1);
          return true;
        case "Enter":
          // While the drawer is open Enter selects; it must never send.
          event.preventDefault();
          if (total > 0) selectIndex(Math.min(activeIndex, total - 1));
          return true;
        case "Tab":
          if (total > 0) {
            event.preventDefault();
            selectIndex(Math.min(activeIndex, total - 1));
            return true;
          }
          close();
          return false;
        case "Escape":
          event.preventDefault();
          close();
          return true;
        default:
          return false;
      }
    },
    [activeIndex, close, items.length, selectIndex, trigger],
  );

  return {
    open: trigger !== null,
    mode: trigger?.mode ?? ("categories" as const),
    kind,
    query,
    categories,
    items: visibleItems,
    loading,
    error,
    activeIndex: clampedActive,
    listboxId,
    activeOptionId:
      trigger && count > 0
        ? `${listboxId}-option-${clampedActive}`
        : undefined,
    optionId: (index: number) => `${listboxId}-option-${index}`,
    setActiveIndex,
    selectIndex,
    close,
    reset,
    retry,
    sync,
    handleKeyDown,
  };
}

export type ComposerSuggestions = ReturnType<typeof useComposerSuggestions>;
