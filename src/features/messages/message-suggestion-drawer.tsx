"use client";

import {
  ChevronRight,
  Code2,
  GraduationCap,
  Trophy,
  X,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { MessageSuggestionKind } from "@/lib/message-types";
import { cn } from "@/lib/utils";
import { primaryAlias } from "./suggestion-trigger";
import type { ComposerSuggestions } from "./use-composer-suggestions";

const KIND_COPY: Record<
  MessageSuggestionKind,
  { header: string; plural: string; icon: LucideIcon }
> = {
  contest: { header: "Insert a contest", plural: "contests", icon: Trophy },
  problem: { header: "Insert a problem", plural: "problems", icon: Code2 },
  learn: {
    header: "Insert a learning resource",
    plural: "learning resources",
    icon: GraduationCap,
  },
};

const ROW =
  "flex min-h-11 w-full items-center gap-2.5 rounded-md px-2 py-2 text-left text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

function OptionRow({
  id,
  active,
  onHover,
  onSelect,
  children,
}: {
  id: string;
  active: boolean;
  onHover: () => void;
  onSelect: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      id={id}
      type="button"
      role="option"
      aria-selected={active}
      onMouseDown={(event) => event.preventDefault()}
      onMouseEnter={onHover}
      onClick={onSelect}
      className={cn(ROW, active ? "bg-muted" : "hover:bg-muted/60")}
    >
      {children}
    </button>
  );
}

function DrawerSkeleton() {
  return (
    <div className="space-y-1 p-1" aria-hidden="true">
      {[0, 1, 2, 3].map((row) => (
        <div key={row} className="flex min-h-11 items-center gap-2.5 px-2 py-2">
          <Skeleton className="size-4 shrink-0 rounded" />
          <div className="min-w-0 flex-1 space-y-1.5">
            <Skeleton className="h-3 w-2/3" />
            <Skeleton className="h-2.5 w-1/3" />
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Composer suggestion panel. Renders in flow above the textarea, so it never
 * overflows the thread card and stays full width on phones. Focus remains in
 * the textarea; `aria-activedescendant` points at the active row.
 */
export function MessageSuggestionDrawer({
  suggestions,
}: {
  suggestions: ComposerSuggestions;
}) {
  if (!suggestions.open) return null;

  const { mode, kind, query, categories, items, loading, error } = suggestions;
  const copy = kind ? KIND_COPY[kind] : null;
  const header =
    mode === "items" && copy ? copy.header : "Insert a contest, problem, or topic";
  const total = mode === "categories" ? categories.length : items.length;
  const showSkeleton = loading && total === 0;
  const plural = copy?.plural ?? "results";

  const emptyText =
    mode === "categories"
      ? "No sections match that word."
      : query
        ? `No ${plural} match “${query}”.`
        : `No ${plural} available.`;

  const liveText = error
    ? "Suggestions could not be loaded."
    : loading
      ? "Searching."
      : mode === "categories"
        ? `${categories.length} sections available.`
        : `${items.length} ${plural} available.`;

  return (
    <div className="mb-2 min-w-0 overflow-hidden rounded-lg border border-border bg-popover text-popover-foreground shadow-sm">
      <div className="flex items-center justify-between gap-2 border-b border-border py-0.5 pl-3 pr-1">
        <p className="min-w-0 truncate text-xs font-semibold">{header}</p>
        <button
          type="button"
          onClick={suggestions.close}
          onMouseDown={(event) => event.preventDefault()}
          aria-label="Close suggestions"
          className="inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <X className="size-3.5" aria-hidden="true" />
        </button>
      </div>

      <p className="sr-only" aria-live="polite">
        {liveText}
      </p>

      <div className="max-h-60 overflow-y-auto overscroll-contain p-1">
        {showSkeleton ? <DrawerSkeleton /> : null}

        {error ? (
          <div role="alert" className="px-3 py-4 text-center">
            <p className="text-sm text-muted-foreground">{error}</p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={suggestions.retry}
              onMouseDown={(event) => event.preventDefault()}
              className="mt-2 min-h-9"
            >
              Try again
            </Button>
          </div>
        ) : null}

        {!error && !showSkeleton && total === 0 ? (
          <p className="px-3 py-6 text-center text-sm text-muted-foreground">
            {emptyText}
          </p>
        ) : null}

        {!error && total > 0 ? (
          <div
            id={suggestions.listboxId}
            role="listbox"
            aria-label={header}
            className="min-w-0"
          >
            {mode === "categories"
              ? categories.map((category, index) => {
                  const CategoryIcon = KIND_COPY[category.kind].icon;
                  return (
                    <OptionRow
                      key={category.kind}
                      id={suggestions.optionId(index)}
                      active={index === suggestions.activeIndex}
                      onHover={() => suggestions.setActiveIndex(index)}
                      onSelect={() => suggestions.selectIndex(index)}
                    >
                      <CategoryIcon
                        className="size-4 shrink-0 text-muted-foreground"
                        aria-hidden="true"
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-medium">
                          {category.label}
                        </span>
                        <span className="block truncate text-xs text-muted-foreground">
                          {category.hint}
                        </span>
                      </span>
                      <kbd className="hidden shrink-0 rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground sm:block">
                        @{primaryAlias(category.kind)}
                      </kbd>
                      <ChevronRight
                        className="size-3.5 shrink-0 text-muted-foreground"
                        aria-hidden="true"
                      />
                    </OptionRow>
                  );
                })
              : items.map((item, index) => {
                  const ItemIcon = KIND_COPY[item.kind].icon;
                  return (
                    <OptionRow
                      key={`${item.kind}:${item.id}`}
                      id={suggestions.optionId(index)}
                      active={index === suggestions.activeIndex}
                      onHover={() => suggestions.setActiveIndex(index)}
                      onSelect={() => suggestions.selectIndex(index)}
                    >
                      <ItemIcon
                        className="size-4 shrink-0 text-muted-foreground"
                        aria-hidden="true"
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-medium">
                          {item.label}
                        </span>
                        {item.meta ? (
                          <span className="block truncate text-xs text-muted-foreground">
                            {item.meta}
                          </span>
                        ) : null}
                      </span>
                    </OptionRow>
                  );
                })}
          </div>
        ) : null}

        {loading && total > 0 ? (
          <p className="px-2 py-1 text-[11px] text-muted-foreground">
            Searching…
          </p>
        ) : null}
      </div>

      <p className="border-t border-border px-3 py-1.5 text-[10px] text-muted-foreground">
        ↑↓ move · Enter insert · Esc close
      </p>
    </div>
  );
}
