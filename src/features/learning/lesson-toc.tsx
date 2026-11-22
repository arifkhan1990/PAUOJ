"use client";

import { useEffect, useMemo, useState } from "react";
import { useActiveSection } from "@/lib/use-active-section";
import { cn } from "@/lib/utils";

export type LessonTocItem = {
  id: string;
  label: string;
  children?: LessonTocItem[];
};

/** Section ids in reading order (parents before their submenu children). */
export function flattenTocIds(items: LessonTocItem[]): string[] {
  return items.flatMap((item) => [
    item.id,
    ...(item.children ? flattenTocIds(item.children) : []),
  ]);
}

function childIds(item: LessonTocItem): string[] {
  return item.children ? flattenTocIds(item.children) : [];
}

/**
 * Docs-style lesson table of contents with submenu sections.
 * Stays put beside the scrolling lesson (positioned by the page layout) and
 * highlights the section or submenu item currently in the reading zone.
 */
export function LessonToc({
  items,
  label = "In this lesson",
  className,
}: {
  items: LessonTocItem[];
  label?: string;
  className?: string;
}) {
  const ids = useMemo(() => flattenTocIds(items), [items]);
  const [offset, setOffset] = useState(120);
  const active = useActiveSection(ids, null, offset);

  useEffect(() => {
    const query = window.matchMedia("(min-width: 1024px)");
    const apply = () => setOffset(query.matches ? 210 : 120);
    apply();
    query.addEventListener("change", apply);
    return () => query.removeEventListener("change", apply);
  }, []);

  const handleClick = (
    event: React.MouseEvent<HTMLAnchorElement>,
    id: string,
  ) => {
    const target = document.getElementById(id);
    if (!target) return;
    event.preventDefault();
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    target.scrollIntoView({
      behavior: reduceMotion ? "auto" : "smooth",
      block: "start",
    });
    window.history.replaceState(null, "", `#${id}`);
  };

  const renderItem = (item: LessonTocItem, depth: number) => {
    const isActive = item.id === active;
    const inPath = !isActive && childIds(item).includes(active);

    return (
      <li key={item.id}>
        <a
          href={`#${item.id}`}
          aria-current={isActive ? "location" : undefined}
          onClick={(event) => handleClick(event, item.id)}
          className={cn(
            "-ml-px block border-l-2 py-1.5 text-[13px] leading-snug transition-colors",
            depth > 0 ? "pl-6 text-[12px]" : "pl-3",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
            isActive
              ? "border-primary font-medium text-primary"
              : inPath
                ? "border-transparent text-foreground"
                : "border-transparent text-muted-foreground hover:border-border hover:text-foreground",
          )}
        >
          {item.label}
        </a>
        {item.children && item.children.length > 0 ? (
          <ul className="border-l border-border/60">
            {item.children.map((child) => renderItem(child, depth + 1))}
          </ul>
        ) : null}
      </li>
    );
  };

  return (
    <nav aria-label={label} className={className}>
      <p
        className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground"
        aria-hidden="true"
      >
        {label}
      </p>
      <ul className="mt-3">
        {items.map((item) => renderItem(item, 0))}
      </ul>
    </nav>
  );
}
