"use client";

import { useRef } from "react";
import { cn } from "@/lib/utils";

export type TabBarItem = {
  value: string;
  label: string;
  count?: number;
};

export function tabId(prefix: string, value: string): string {
  return `${prefix}-tab-${value}`;
}

export function tabPanelId(prefix: string, value: string): string {
  return `${prefix}-panel-${value}`;
}

const NAV_KEYS = new Set(["ArrowLeft", "ArrowRight", "Home", "End"]);

/**
 * Accessible tab strip. Arrow keys move the active tab (automatic
 * activation), Home/End jump to the edges and each tab exposes `aria-current`
 * in addition to `aria-selected` for screen readers that announce location.
 */
export function TabBar({
  idPrefix,
  items,
  value,
  onChange,
  ariaLabel,
  panelId,
  className,
}: {
  idPrefix: string;
  items: TabBarItem[];
  value: string;
  onChange: (value: string) => void;
  ariaLabel: string;
  /** Set when every tab controls the same panel, e.g. list filters. */
  panelId?: string;
  className?: string;
}) {
  const refs = useRef<Array<HTMLButtonElement | null>>([]);

  const handleKeyDown = (
    event: React.KeyboardEvent<HTMLButtonElement>,
    index: number,
  ) => {
    if (!NAV_KEYS.has(event.key)) return;
    event.preventDefault();
    const next =
      event.key === "Home"
        ? 0
        : event.key === "End"
          ? items.length - 1
          : event.key === "ArrowLeft"
            ? (index - 1 + items.length) % items.length
            : (index + 1) % items.length;
    const item = items[next];
    if (!item) return;
    onChange(item.value);
    refs.current[next]?.focus();
  };

  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={cn(
        "flex w-full items-center gap-1 overflow-x-auto rounded-lg border border-border bg-card p-1",
        className,
      )}
    >
      {items.map((item, index) => {
        const active = item.value === value;
        return (
          <button
            key={item.value}
            ref={(node) => {
              refs.current[index] = node;
            }}
            type="button"
            role="tab"
            id={tabId(idPrefix, item.value)}
            aria-selected={active}
            aria-current={active ? "true" : undefined}
            aria-controls={panelId ?? tabPanelId(idPrefix, item.value)}
            tabIndex={active ? 0 : -1}
            onClick={() => onChange(item.value)}
            onKeyDown={(event) => handleKeyDown(event, index)}
            className={cn(
              "inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center gap-1.5 rounded-md px-3 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              active
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            {item.label}
            {typeof item.count === "number" && item.count > 0 ? (
              <span
                className={cn(
                  "rounded px-1 font-mono text-[10px] tabular-nums",
                  active ? "bg-primary-foreground/20" : "bg-muted",
                )}
              >
                {item.count}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
