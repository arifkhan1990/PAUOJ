"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Smile } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EMOJI_GROUPS, filterEmojiGroups } from "./emoji-data";

const GRID_COLUMNS = 7;

/**
 * Composer emoji popover. The trigger is a 44px target; the panel opens above
 * the toolbar with a search field focused first, keeps keyboard focus inside
 * the visible grid, and closes on Escape, Tab, or an outside pointer press.
 * Emoji are inserted as message content by the composer.
 */
export function EmojiPicker({
  disabled = false,
  onSelect,
}: {
  disabled?: boolean;
  onSelect: (emoji: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const popoverId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const groups = useMemo(() => filterEmojiGroups(EMOJI_GROUPS, query), [query]);
  const trimmedQuery = query.trim();

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (rootRef.current?.contains(event.target as Node)) return;
      setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setOpen(false);
      triggerRef.current?.focus();
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  useEffect(() => {
    if (open) {
      searchRef.current?.focus();
      return;
    }
    setQuery("");
  }, [open]);

  const focusFirstEmoji = () => {
    popoverRef.current?.querySelector<HTMLButtonElement>("[data-emoji]")?.focus();
  };

  const onSearchKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      focusFirstEmoji();
      return;
    }
    if (event.key === "ArrowDown") {
      event.preventDefault();
      event.stopPropagation();
      focusFirstEmoji();
    }
  };

  const onGridKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Tab") {
      setOpen(false);
      return;
    }
    if (
      !["ArrowRight", "ArrowLeft", "ArrowDown", "ArrowUp", "Home", "End"].includes(
        event.key,
      )
    ) {
      return;
    }
    const buttons = Array.from(
      popoverRef.current?.querySelectorAll<HTMLButtonElement>("[data-emoji]") ??
        [],
    );
    const current = buttons.indexOf(document.activeElement as HTMLButtonElement);
    if (current < 0) return;

    let next = current;
    if (event.key === "ArrowRight") next = Math.min(buttons.length - 1, current + 1);
    else if (event.key === "ArrowLeft") next = Math.max(0, current - 1);
    else if (event.key === "ArrowDown")
      next = Math.min(buttons.length - 1, current + GRID_COLUMNS);
    else if (event.key === "ArrowUp") next = Math.max(0, current - GRID_COLUMNS);
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = buttons.length - 1;

    event.preventDefault();
    buttons[next]?.focus();
  };

  return (
    <div ref={rootRef} className="relative">
      <Button
        ref={triggerRef}
        type="button"
        variant="ghost"
        size="icon"
        disabled={disabled}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={open ? popoverId : undefined}
        aria-label="Insert emoji"
        onClick={() => setOpen((current) => !current)}
        className="min-h-11 min-w-11 text-muted-foreground"
      >
        <Smile className="size-4" aria-hidden="true" />
      </Button>

      {open ? (
        <div
          ref={popoverRef}
          id={popoverId}
          role="dialog"
          aria-label="Emoji picker"
          onKeyDown={onGridKeyDown}
          className="absolute bottom-full left-0 z-50 mb-2 max-h-[min(20rem,60dvh)] w-[min(21.5rem,calc(100vw-1.5rem))] overflow-y-auto overscroll-contain rounded-lg border border-border bg-popover p-1 text-popover-foreground shadow-lg"
        >
          <input
            ref={searchRef}
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={onSearchKeyDown}
            aria-label="Search emoji"
            placeholder="Search emoji…"
            autoComplete="off"
            spellCheck={false}
            className="sticky top-0 z-10 mb-1 h-11 w-full rounded-md border border-border bg-background px-2.5 text-base text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:text-sm"
          />
          {groups.length === 0 ? (
            <p
              role="status"
              className="px-2 py-4 text-center text-sm text-muted-foreground"
            >
              No emoji match “{trimmedQuery}”.
            </p>
          ) : (
            groups.map((group) => (
              <div key={group.label}>
                <p className="px-2 pb-0.5 pt-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                  {group.label}
                </p>
                <div className="grid grid-cols-7 justify-items-center gap-0.5">
                  {group.items.map((item) => (
                    <button
                      key={item.char}
                      type="button"
                      data-emoji=""
                      title={item.name}
                      aria-label={`Insert ${item.name}`}
                      onClick={() => {
                        onSelect(item.char);
                        setOpen(false);
                      }}
                      className="flex h-11 w-11 items-center justify-center rounded text-lg leading-none transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <span aria-hidden="true">{item.char}</span>
                    </button>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      ) : null}
    </div>
  );
}
