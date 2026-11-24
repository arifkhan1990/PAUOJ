// Renders the "array" lesson visual: scan, sliding window, prefix sums or vector growth.
import type { CSSProperties } from "react";
import type { LessonVisualConfig } from "@/lib/learning/visual-types";
import { cn } from "@/lib/utils";
import { VisualFrame } from "./visual-frame";

type VisualProps = { config: LessonVisualConfig; compact?: boolean };

const DEFAULT_VALUES = [3, 8, 1, 7, 4, 9];
const CELL_W = 40;
const CELL_GAP = 6;
const STRIDE = CELL_W + CELL_GAP;

export function ArrayVisual({ config, compact = false }: VisualProps) {
  const raw = (config.data?.values ?? DEFAULT_VALUES).filter(Number.isFinite);
  const values = (raw.length ? raw : DEFAULT_VALUES).map((value) => Math.trunc(value)).slice(0, 8);
  const variant = config.data?.variant ?? "scan";
  const isWindow = variant === "window";
  const isPrefix = variant === "prefix";
  const isVector = variant === "vector";
  const isNim = variant === "nim";
  const displayValues = isNim
    ? values.map((value) => (value === 0 ? "L" : "W"))
    : values;

  const windowSize = Math.min(3, values.length);
  const bracketWidth = windowSize * CELL_W + (windowSize - 1) * CELL_GAP;
  const travel = Math.max(0, (values.length - windowSize) * STRIDE);
  const windowSum = values.slice(0, windowSize).reduce((sum, value) => sum + value, 0);
  const prefixSums = values.reduce<number[]>((acc, value) => {
    acc.push((acc[acc.length - 1] ?? 0) + value);
    return acc;
  }, []);
  let capacity = 1;
  while (capacity < values.length) capacity *= 2;

  return (
    <VisualFrame config={config} compact={compact}>
      <div className="flex h-full flex-col justify-center gap-3">
        <div className="lv-scroll overflow-x-auto pb-1">
          <div className="w-max">
            <div className="relative flex items-start gap-1.5">
              {displayValues.map((value, index) => (
                <div key={`${value}-${index}`} className="flex w-10 shrink-0 flex-col items-center gap-1">
                  {isWindow || isPrefix || isVector || isNim ? null : (
                    <span
                      className="lv-blink size-1 rounded-full bg-accent"
                      style={{ animationDelay: `${index * 0.35}s` }}
                    />
                  )}
                  <Cell value={value} compact={compact} />
                </div>
              ))}

              {isWindow ? (
                <span
                  className="lv-sweep absolute left-0 top-full mt-1 block h-2 rounded-b-md border-x-2 border-b-2 border-accent"
                  style={
                    {
                      width: bracketWidth,
                      "--lv-travel": `${travel}px`,
                      animationDelay: "0.3s",
                    } as CSSProperties
                  }
                />
              ) : null}
            </div>

            <div className={cn("flex gap-1.5", isWindow ? "mt-5" : "mt-1.5")}>
              {values.map((_, index) => (
                <span
                  key={index}
                  className="w-10 shrink-0 text-center font-mono text-[10px] tabular-nums text-muted-foreground"
                >
                  {index}
                </span>
              ))}
            </div>
          </div>
        </div>

        {isPrefix ? (
          <div className="mt-2">
            <p className="mb-1 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
              prefix sum →
            </p>
            <div className="flex gap-1.5">
              {prefixSums.map((sum, index) => (
                <div
                  key={`${sum}-${index}`}
                  className="lv-rise"
                  style={{ animationDelay: `${index * 0.18}s` }}
                >
                  <Cell value={sum} compact={compact} tone="active" />
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {isVector ? (
          <div className="mt-2">
            <p className="mb-1 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
              capacity = {capacity} · size = {values.length}
            </p>
            <div className="flex gap-1.5">
              {Array.from({ length: capacity }, (_, index) => {
                const value = values[index];
                if (value === undefined) {
                  return <Cell key={index} value="·" compact={compact} tone="muted" />;
                }
                return (
                  <Cell
                    key={index}
                    value={value}
                    compact={compact}
                    tone={index === values.length - 1 ? "active" : "default"}
                  />
                );
              })}
            </div>
          </div>
        ) : null}

        <p className="text-[10px] leading-relaxed text-muted-foreground">
          {isWindow
            ? `উইন্ডো ${windowSize} ঘর সরে ডানে · প্রথম যোগফল ${windowSum} · নতুন ঘর যোগ, পুরোনো ঘর বাদ।`
            : isPrefix
              ? `প্রতিটি ঘরে শুরু থেকে এ পর্যন্ত যোগফল · মোট ${prefixSums[prefixSums.length - 1] ?? 0}।`
              : isVector
                ? "ভেক্টর ভরে গেলে দ্বিগুণ capacity নেয় · push শেষে যোগ, pop শেষ থেকে বাদ।"
                : isNim
                  ? "০ = L (হারার অবস্থা), ১ = W (জেতার অবস্থা) · Nim-এ সব পাইলের XOR শূন্য হলে L।"
                  : "পয়েন্টার বাঁ থেকে ডানে প্রতিটি ঘর একবার পড়ে · O(n)।"}
        </p>
      </div>
    </VisualFrame>
  );
}

function Cell({
  value,
  compact,
  tone = "default",
}: {
  value: number | string;
  compact: boolean;
  tone?: "default" | "active" | "muted";
}) {
  const label = String(value);
  const dense = label.length > 3;

  return (
    <div
      className={cn(
        "flex w-10 shrink-0 items-center justify-center overflow-hidden rounded-md border font-mono tabular-nums",
        compact ? "h-9" : "h-10",
        dense ? "text-[10px]" : compact ? "text-xs" : "text-sm",
        tone === "active"
          ? "border-primary/50 bg-primary/10 text-foreground"
          : tone === "muted"
            ? "border-dashed border-border bg-muted/30 text-muted-foreground"
            : "border-border bg-card text-foreground",
      )}
    >
      {label}
    </div>
  );
}
