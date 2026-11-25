"use client";

import { useId, useRef, useState } from "react";
import { ChevronDown, ChevronUp, Code2 } from "lucide-react";
import { CopyButton } from "@/components/shared/copy-button";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

/** Roughly 15 shiki lines fit in the 360px collapsed viewport. */
const COLLAPSE_AFTER_LINES = 15;

/**
 * Collapsible, server-highlighted source panel. The code is tall on purpose
 * (360px collapsed, 640px expanded) so long solutions scroll inside the card.
 */
export function SubmissionCode({
  html,
  languageLabel,
  lineCount,
  copyValue,
  className,
}: {
  html: string;
  languageLabel: string;
  lineCount: number;
  copyValue: string;
  className?: string;
}) {
  const contentId = useId();
  const contentRef = useRef<HTMLDivElement>(null);
  const viewMoreRef = useRef<HTMLButtonElement>(null);
  const [expanded, setExpanded] = useState(false);
  const canExpand = lineCount > COLLAPSE_AFTER_LINES;

  const expand = () => {
    setExpanded(true);
    requestAnimationFrame(() => contentRef.current?.focus({ preventScroll: true }));
  };

  const collapse = () => {
    setExpanded(false);
    requestAnimationFrame(() => {
      if (canExpand) viewMoreRef.current?.focus({ preventScroll: true });
      else contentRef.current?.focus({ preventScroll: true });
    });
  };

  return (
    <Card className={cn("min-w-0 overflow-hidden", className)}>
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 border-b border-border px-4 py-2.5">
        <h2 className="flex items-center gap-1.5 text-sm font-semibold">
          <Code2 className="size-4" aria-hidden="true" />
          Code
        </h2>
        <span aria-hidden="true" className="text-muted-foreground/50">
          |
        </span>
        <span className="text-xs text-muted-foreground">{languageLabel}</span>
        <span className="text-[11px] tabular-nums text-muted-foreground/80">
          {lineCount.toLocaleString("en-US")}{" "}
          {lineCount === 1 ? "line" : "lines"}
        </span>
        <div className="ml-auto">
          <CopyButton
            value={copyValue}
            label="Copy code"
            className="min-h-11 lg:min-h-8"
          />
        </div>
      </div>

      <div className="relative">
        <div
          id={contentId}
          ref={contentRef}
          role="region"
          aria-label={`${languageLabel} source code`}
          tabIndex={0}
          className={cn(
            "bg-[#0d1117] p-4 text-[13px] leading-relaxed text-slate-200 [&_pre]:!bg-transparent",
            expanded
              ? "max-h-[640px] overflow-auto overscroll-contain"
              : canExpand
                ? "max-h-[360px] overflow-x-auto overflow-y-hidden"
                : "overflow-x-auto",
          )}
          dangerouslySetInnerHTML={{ __html: html }}
        />

        {!expanded && canExpand ? (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-center bg-gradient-to-t from-[#0d1117] via-[#0d1117]/85 to-transparent pb-3 pt-14">
            <button
              ref={viewMoreRef}
              type="button"
              onClick={expand}
              aria-expanded={false}
              aria-controls={contentId}
              className="pointer-events-auto inline-flex min-h-11 items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-4 text-xs font-medium text-slate-100 shadow-sm backdrop-blur transition-colors hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-[#0d1117] lg:min-h-9"
            >
              <ChevronDown className="size-3.5" aria-hidden="true" />
              View more
            </button>
          </div>
        ) : null}
      </div>

      {expanded ? (
        <div className="flex justify-center border-t border-border bg-muted/20 py-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={collapse}
            aria-expanded
            aria-controls={contentId}
            className="min-h-11 gap-1.5 text-xs lg:min-h-9"
          >
            <ChevronUp className="size-3.5" aria-hidden="true" />
            View less
          </Button>
        </div>
      ) : null}
    </Card>
  );
}
