// Renders the "sort" lesson visual: bars compared and swapped until they are ordered.
import type { LessonVisualConfig } from "@/lib/learning/visual-types";
import { cn } from "@/lib/utils";
import { VisualFrame } from "./visual-frame";

type VisualProps = { config: LessonVisualConfig; compact?: boolean };

const DEFAULT_VALUES = [5, 2, 9, 1, 6, 3];

export function SortVisual({ config, compact = false }: VisualProps) {
  const raw = (config.data?.values ?? DEFAULT_VALUES).filter(Number.isFinite).map(Math.trunc);
  const values = (raw.length ? raw : DEFAULT_VALUES).slice(0, 7);
  const max = Math.max(...values.map((value) => Math.abs(value)), 1);
  const sorted = [...values].sort((left, right) => left - right);
  const pairStart = values.length > 2 ? 1 : 0;
  const pair: [number, number] = [pairStart, Math.min(pairStart + 1, values.length - 1)];

  return (
    <VisualFrame config={config} compact={compact}>
      <div className="flex h-full flex-col justify-center gap-4">
        <div className="flex items-end gap-1.5 sm:gap-2">
          {values.map((value, index) => {
            const active = pair.includes(index);
            const height = Math.max(10, (Math.abs(value) / max) * 100);
            return (
              <div key={`${value}-${index}`} className="flex min-w-0 flex-1 flex-col items-center gap-1">
                <span
                  className={cn(
                    "font-mono text-[10px] tabular-nums",
                    active ? "text-foreground" : "text-muted-foreground",
                  )}
                >
                  {value}
                </span>
                <div className={cn("flex w-full items-end", compact ? "h-20" : "h-24")}>
                  <div
                    className={cn(
                      "animate-bar-y relative mx-auto w-full max-w-12 rounded-t-md border",
                      active
                        ? "border-accent/60 bg-accent/25"
                        : "border-primary/40 bg-primary/20",
                    )}
                    style={{ height: `${height}%`, animationDelay: `${index * 80}ms` }}
                  >
                    <span
                      className="lv-blink absolute inset-x-0 top-0 h-0.5 rounded-full bg-accent/70"
                      style={{ animationDelay: `${index * 0.4}s` }}
                    />
                  </div>
                </div>
                <span className="font-mono text-[10px] tabular-nums text-muted-foreground">
                  {index}
                </span>
              </div>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="inline-flex items-center gap-1.5 text-[10px] text-muted-foreground">
            <span className="lv-blink size-1.5 rounded-full bg-accent" />
            তুলনা
            <span className="font-mono text-foreground">{values[pair[0]]}</span>
            ↔
            <span className="font-mono text-foreground">{values[pair[1]]}</span>
          </span>
          <span className="text-[10px] text-muted-foreground">
            বড়টা ডানে সরে · ছোটটা বাঁয়ে
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-1">
          <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
            sorted
          </span>
          {sorted.map((value, index) => (
            <span
              key={`${value}-${index}`}
              className="lv-rise rounded border border-success/40 bg-success/10 px-1.5 py-0.5 font-mono text-[10px] tabular-nums text-foreground"
              style={{ animationDelay: `${(0.45 + index * 0.12).toFixed(2)}s` }}
            >
              {value}
            </span>
          ))}
        </div>
      </div>
    </VisualFrame>
  );
}
