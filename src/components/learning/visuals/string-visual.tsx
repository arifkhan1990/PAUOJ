// Renders the `string` lesson visual: text/pattern cells, a sliding window and
// the KMP prefix (LPS) row.

import type { CSSProperties } from "react";
import type { LessonVisualConfig } from "@/lib/learning/visual-types";
import { cn } from "@/lib/utils";
import { VisualFrame } from "./visual-frame";

type VisualProps = { config: LessonVisualConfig; compact?: boolean };

const DEFAULT_TEXT = "ABABDABACD";
const DEFAULT_PATTERN = "ABABC";

function buildLps(pattern: string): number[] {
  const lps = pattern.split("").map(() => 0);
  let length = 0;
  for (let index = 1; index < pattern.length; ) {
    if (pattern[index] === pattern[length]) {
      length += 1;
      lps[index] = length;
      index += 1;
    } else if (length > 0) {
      length = lps[length - 1] ?? 0;
    } else {
      lps[index] = 0;
      index += 1;
    }
  }
  return lps;
}

export function StringVisual({ config, compact = false }: VisualProps) {
  const variant = config.data?.variant ?? "kmp";
  const rawLabels = config.data?.labels ?? [];
  // Two supported shapes: [text, pattern] or a per-character pattern whose
  // LPS values arrive in `data.values` (the foundation mapping uses the latter).
  const charPattern = rawLabels.length > 2;
  const pattern = (
    charPattern ? rawLabels.slice(0, 8).join("") : (rawLabels[1] ?? DEFAULT_PATTERN)
  )
    .replace(/\s+/g, "")
    .slice(0, 8) || DEFAULT_PATTERN;
  const text = charPattern
    ? pattern
    : (rawLabels[0] ?? DEFAULT_TEXT).replace(/\s+/g, "").slice(0, 12) || DEFAULT_TEXT;

  const providedLps = config.data?.values;
  const lps =
    charPattern && providedLps?.length === pattern.length ? providedLps : buildLps(pattern);
  let matched = 0;
  while (matched < pattern.length && matched < text.length && text[matched] === pattern[matched]) {
    matched += 1;
  }
  const mismatch = matched < Math.min(text.length, pattern.length) ? matched : -1;

  const cellPx = compact ? 24 : 28;
  const gapPx = 4;
  const bandLength = Math.min(pattern.length, text.length);
  const bandWidth = bandLength * cellPx + Math.max(0, bandLength - 1) * gapPx;
  const travel = Math.max(0, (text.length - bandLength) * (cellPx + gapPx));
  const showPrefix = variant === "kmp" || variant === "prefix";
  const activePrefix = Math.max(0, (mismatch >= 0 ? mismatch : matched) - 1);

  const cell = cn(
    "flex items-center justify-center rounded border font-mono tabular-nums leading-none",
    compact ? "text-[10px]" : "text-[11px]",
  );
  const cellStyle = { width: `${cellPx}px`, height: `${cellPx}px` } as CSSProperties;

  const note =
    variant === "window"
      ? `window ${pattern.length} → matched ${matched}`
      : variant === "prefix"
        ? `longest border = ${lps[lps.length - 1] ?? 0}`
        : mismatch >= 0
          ? `mismatch @ ${mismatch} → fallback lps[${Math.max(0, mismatch - 1)}] = ${lps[Math.max(0, mismatch - 1)] ?? 0}`
          : `full match @ 0 → ${pattern.length}`;

  return (
    <VisualFrame config={config} compact={compact}>
      <div className="flex h-full flex-col justify-center gap-2">
        <div className="lv-scroll overflow-x-auto pb-1">
          <div className="mx-auto w-max space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-12 shrink-0 text-right font-mono text-[10px] uppercase tracking-wide text-muted-foreground">
                pattern
              </span>
              <div className="flex gap-1">
                {pattern.split("").map((character, index) => (
                  <span
                    key={`${character}-${index}`}
                    className={cn(cell, "lv-rise border-border bg-card text-foreground")}
                    style={{ ...cellStyle, animationDelay: `${index * 110}ms` }}
                  >
                    {character}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="w-12 shrink-0 text-right font-mono text-[10px] uppercase tracking-wide text-muted-foreground">
                text
              </span>
              <div className="relative">
                <div className="flex gap-1">
                  {text.split("").map((character, index) => (
                    <span
                      key={`${character}-${index}`}
                      className={cn(
                        cell,
                        index < matched
                          ? "border-primary/50 bg-primary/10 text-foreground"
                          : index === mismatch
                            ? "border-destructive/50 bg-destructive/10 text-foreground"
                            : "border-border bg-card text-foreground",
                      )}
                      style={cellStyle}
                    >
                      {character}
                    </span>
                  ))}
                </div>
                {variant !== "prefix" ? (
                  <span
                    className="lv-sweep pointer-events-none absolute inset-y-0 left-0 rounded-md border-2 border-primary/50 bg-primary/10"
                    style={
                      {
                        width: `${bandWidth}px`,
                        "--lv-travel": `${travel}px`,
                      } as CSSProperties
                    }
                  />
                ) : null}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="w-12 shrink-0" />
              <div className="flex gap-1">
                {text.split("").map((_, index) => (
                  <span
                    key={`index-${index}`}
                    className={cn(
                      "text-center font-mono text-[10px] leading-none text-muted-foreground",
                    )}
                    style={{ width: `${cellPx}px` }}
                  >
                    {index}
                  </span>
                ))}
              </div>
            </div>

            {showPrefix ? (
              <div className="flex items-center gap-2">
                <span className="w-12 shrink-0 text-right font-mono text-[10px] uppercase tracking-wide text-muted-foreground">
                  {variant === "kmp" ? "lps" : "border"}
                </span>
                <div className="flex gap-1">
                  {lps.map((value, index) => (
                    <span
                      key={`lps-${index}`}
                      className={cn(
                        cell,
                        index === activePrefix
                          ? "border-accent/60 bg-accent/10 font-semibold text-foreground lv-glow"
                          : "border-border/70 bg-muted/40 text-muted-foreground",
                      )}
                      style={cellStyle}
                    >
                      {value}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[10.5px] text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <span className="size-2.5 rounded border border-primary/50 bg-primary/10" />
            matched
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="size-2.5 rounded border border-destructive/50 bg-destructive/10" />
            mismatch
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="size-2.5 rounded border border-accent/60 bg-accent/10" />
            lps
          </span>
        </div>
        <p className="text-center font-mono text-[10px] text-muted-foreground">{note}</p>
      </div>
    </VisualFrame>
  );
}
