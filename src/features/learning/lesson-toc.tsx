"use client";

import { useMemo } from "react";
import { useActiveSection } from "@/lib/use-active-section";
import { cn } from "@/lib/utils";

export type LessonTocItem = {
  id: string;
  label: string;
};

/**
 * Docs-style lesson table of contents.
 * Stays put beside the scrolling lesson (positioned by the page layout) and
 * highlights the section currently in the reading zone.
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
  const ids = useMemo(() => items.map((item) => item.id), [items]);
  const active = useActiveSection(ids);

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

  return (
    <nav aria-label={label} className={className}>
      <p
        className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground"
        aria-hidden="true"
      >
        {label}
      </p>
      <ul className="mt-3 border-l border-border">
        {items.map((item) => {
          const isActive = item.id === active;
          return (
            <li key={item.id}>
              <a
                href={`#${item.id}`}
                aria-current={isActive ? "location" : undefined}
                onClick={(event) => handleClick(event, item.id)}
                className={cn(
                  "-ml-px block border-l-2 py-1.5 pl-3 text-[13px] leading-snug transition-colors",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                  isActive
                    ? "border-primary font-medium text-primary"
                    : "border-transparent text-muted-foreground hover:border-border hover:text-foreground",
                )}
              >
                {item.label}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
