"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { ChevronDown, ChevronUp, X } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type TagFilterCloudItem = {
  name: string;
  slug: string;
  href: string;
  active: boolean;
};

const COLLAPSED_HEIGHT_REM = 3.625;
const FOCUS_RING =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background";

function orderTags(tags: TagFilterCloudItem[]): TagFilterCloudItem[] {
  const active: TagFilterCloudItem[] = [];
  const rest: TagFilterCloudItem[] = [];
  for (const tag of tags) {
    if (tag.active) active.push(tag);
    else rest.push(tag);
  }
  return [...active, ...rest];
}

function useTagOverflow(tagCount: number, orderKey: string) {
  const contentRef = useRef<HTMLDivElement | null>(null);
  const [canExpand, setCanExpand] = useState(tagCount > 0);
  const [hiddenFrom, setHiddenFrom] = useState<number | null>(null);

  useEffect(() => {
    const content = contentRef.current;
    if (!content) return;

    const measure = () => {
      const contentRect = content.getBoundingClientRect();
      // Layout is unavailable before paint or in non-browser renderers; keep the
      // optimistic default and leave every pill reachable.
      if (contentRect.height <= 0) return;
      const rootFontSize = Number.parseFloat(
        getComputedStyle(document.documentElement).fontSize,
      );
      const rowLimit =
        COLLAPSED_HEIGHT_REM *
        (Number.isFinite(rootFontSize) && rootFontSize > 0 ? rootFontSize : 16);
      setCanExpand(contentRect.height > rowLimit + 0.5);

      const pills = Array.from(content.children) as HTMLElement[];
      const cutoff = pills.findIndex(
        (pill) =>
          pill.getBoundingClientRect().top - contentRect.top >= rowLimit - 0.5,
      );
      setHiddenFrom(cutoff === -1 ? pills.length : cutoff);
    };

    measure();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(measure);
    observer.observe(content);
    return () => observer.disconnect();
  }, [tagCount, orderKey]);

  return { contentRef, canExpand, hiddenFrom };
}

function TagPill({ tag, hidden }: { tag: TagFilterCloudItem; hidden: boolean }) {
  return (
    <Link
      href={tag.href}
      aria-current={tag.active ? "true" : undefined}
      aria-hidden={hidden ? true : undefined}
      tabIndex={hidden ? -1 : undefined}
      className={cn(
        "rounded-full border px-2.5 py-1 text-xs leading-4 whitespace-nowrap transition-colors",
        FOCUS_RING,
        tag.active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-primary",
      )}
    >
      {tag.name}
    </Link>
  );
}

export function TagFilterCloud({
  tags,
  clearHref = null,
}: {
  tags: TagFilterCloudItem[];
  clearHref?: string | null;
}) {
  const listId = useId();
  const [expanded, setExpanded] = useState(false);
  const ordered = orderTags(tags);
  const orderKey = ordered.map((tag) => tag.slug).join("|");
  const activeSlug = ordered.find((tag) => tag.active)?.slug ?? "";
  const [lastActiveSlug, setLastActiveSlug] = useState(activeSlug);
  const { contentRef, canExpand, hiddenFrom } = useTagOverflow(
    tags.length,
    orderKey,
  );

  // A tag click is a filter navigation: collapse again so the filtered
  // problem list stays in view instead of the full tag cloud. Adjusting state
  // during render (React's prop-change pattern) avoids an expanded first paint.
  if (lastActiveSlug !== activeSlug) {
    setLastActiveSlug(activeSlug);
    setExpanded(false);
  }

  if (tags.length === 0) return null;

  const collapsed = canExpand && !expanded;

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1">
        <span className="text-xs font-medium text-muted-foreground">Tags</span>
        <div className="flex items-center gap-1.5">
          {clearHref ? (
            <Link
              href={clearHref}
              className={cn(
                "inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs text-muted-foreground transition-colors hover:text-destructive",
                FOCUS_RING,
              )}
            >
              <X className="size-3" /> Clear
            </Link>
          ) : null}
          {canExpand ? (
            <button
              type="button"
              aria-expanded={expanded}
              aria-controls={listId}
              onClick={() => setExpanded((value) => !value)}
              className={cn(
                buttonVariants({ variant: "ghost", size: "sm" }),
                "h-7 gap-1 rounded-full px-2 text-xs font-medium text-muted-foreground",
              )}
            >
              {expanded ? <ChevronUp /> : <ChevronDown />}
              {expanded ? "Show less" : `Show all ${tags.length} tags`}
            </button>
          ) : null}
        </div>
      </div>
      <div
        id={listId}
        data-state={collapsed ? "collapsed" : "expanded"}
        className={cn(collapsed && "max-h-[3.625rem] overflow-hidden")}
      >
        <div ref={contentRef} className="flex flex-wrap gap-1.5">
          {ordered.map((tag, index) => (
            <TagPill
              key={tag.slug}
              tag={tag}
              hidden={collapsed && hiddenFrom !== null && index >= hiddenFrom}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
