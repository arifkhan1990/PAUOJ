"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Smile } from "lucide-react";
import { Button } from "@/components/ui/button";

type EmojiEntry = { char: string; name: string };

const EMOJI_GROUPS: ReadonlyArray<{
  label: string;
  items: readonly EmojiEntry[];
}> = [
  {
    label: "Smileys",
    items: [
      { char: "😀", name: "grinning face" },
      { char: "😄", name: "smiling face" },
      { char: "😁", name: "beaming face" },
      { char: "😂", name: "face with tears of joy" },
      { char: "🤣", name: "rolling on the floor laughing" },
      { char: "😊", name: "smiling face with smiling eyes" },
      { char: "😍", name: "smiling face with heart eyes" },
      { char: "🙂", name: "slightly smiling face" },
      { char: "😉", name: "winking face" },
      { char: "😎", name: "smiling face with sunglasses" },
      { char: "🤔", name: "thinking face" },
      { char: "😐", name: "neutral face" },
      { char: "😴", name: "sleeping face" },
      { char: "😢", name: "crying face" },
      { char: "😭", name: "loudly crying face" },
      { char: "😡", name: "angry face" },
      { char: "😅", name: "grinning face with sweat" },
      { char: "🙃", name: "upside-down face" },
      { char: "😇", name: "smiling face with halo" },
      { char: "🤗", name: "hugging face" },
      { char: "🤩", name: "star-struck face" },
      { char: "🥳", name: "partying face" },
      { char: "😬", name: "grimacing face" },
      { char: "😱", name: "face screaming in fear" },
    ],
  },
  {
    label: "Gestures",
    items: [
      { char: "👍", name: "thumbs up" },
      { char: "👎", name: "thumbs down" },
      { char: "👏", name: "clapping hands" },
      { char: "🙌", name: "raising hands" },
      { char: "👋", name: "waving hand" },
      { char: "🤝", name: "handshake" },
      { char: "✌️", name: "victory hand" },
      { char: "🤞", name: "crossed fingers" },
      { char: "👌", name: "ok hand" },
      { char: "🙏", name: "folded hands" },
      { char: "💪", name: "flexed biceps" },
      { char: "👀", name: "eyes" },
      { char: "🫡", name: "saluting face" },
    ],
  },
  {
    label: "Symbols",
    items: [
      { char: "❤️", name: "red heart" },
      { char: "🔥", name: "fire" },
      { char: "✨", name: "sparkles" },
      { char: "🎉", name: "party popper" },
      { char: "💯", name: "hundred points" },
      { char: "✅", name: "check mark" },
      { char: "❌", name: "cross mark" },
      { char: "⚠️", name: "warning" },
      { char: "⭐", name: "star" },
      { char: "🏆", name: "trophy" },
      { char: "🎯", name: "target" },
      { char: "🚀", name: "rocket" },
      { char: "💡", name: "light bulb" },
    ],
  },
  {
    label: "Objects",
    items: [
      { char: "📷", name: "camera" },
      { char: "💻", name: "laptop" },
      { char: "🧑‍💻", name: "technologist" },
      { char: "📝", name: "memo" },
      { char: "📌", name: "pushpin" },
      { char: "📚", name: "books" },
      { char: "🎓", name: "graduation cap" },
      { char: "🧠", name: "brain" },
      { char: "☕", name: "hot beverage" },
      { char: "🍕", name: "pizza" },
      { char: "🎮", name: "video game" },
      { char: "🌙", name: "crescent moon" },
      { char: "⚡", name: "high voltage" },
    ],
  },
];

const GRID_COLUMNS = 7;

/**
 * Composer emoji popover. The trigger is a 44px target; the panel opens above
 * the toolbar, keeps focus inside the grid, and closes on Escape or an outside
 * pointer press. Emoji are inserted as message content by the composer.
 */
export function EmojiPicker({
  disabled = false,
  onSelect,
}: {
  disabled?: boolean;
  onSelect: (emoji: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const popoverId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

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
    if (!open) return;
    popoverRef.current?.querySelector<HTMLButtonElement>("[data-emoji]")?.focus();
  }, [open]);

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
          className="absolute bottom-full left-0 z-50 mb-2 max-h-[min(20rem,60dvh)] w-[min(20rem,calc(100vw-2.5rem))] overflow-y-auto overscroll-contain rounded-lg border border-border bg-popover p-1 text-popover-foreground shadow-lg"
        >
          {EMOJI_GROUPS.map((group) => (
            <div key={group.label}>
              <p className="px-2 pb-0.5 pt-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                {group.label}
              </p>
              <div className="grid grid-cols-7 gap-0.5">
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
                    className="flex h-10 items-center justify-center rounded text-lg leading-none transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <span aria-hidden="true">{item.char}</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
