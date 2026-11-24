// Renders the "hash" lesson visual: keys landing in buckets, with one collision chain.
import { Fragment } from "react";
import type { LessonVisualConfig } from "@/lib/learning/visual-types";
import { cn } from "@/lib/utils";
import { VisualFrame } from "./visual-frame";

type VisualProps = { config: LessonVisualConfig; compact?: boolean };

const DEFAULT_KEYS = [12, 27, 8, 31, 19];
const DEFAULT_BUCKETS = ["bucket 0", "bucket 1", "bucket 2", "bucket 3"];

export function HashVisual({ config, compact = false }: VisualProps) {
  const raw = (config.data?.values ?? DEFAULT_KEYS).filter(Number.isFinite).map(Math.trunc);
  const keys = (raw.length ? raw : DEFAULT_KEYS).slice(0, 6);
  const bucketNames = config.data?.labels?.length ? config.data.labels : DEFAULT_BUCKETS;
  const count = Math.min(6, Math.max(2, bucketNames.length));
  const labels = Array.from(
    { length: count },
    (_, index) => bucketNames[index]?.trim() || `bucket ${index}`,
  );

  const buckets: Array<Array<{ key: number; order: number }>> = Array.from(
    { length: count },
    () => [],
  );
  keys.forEach((key, order) => {
    const slot = ((key % count) + count) % count;
    buckets[slot].push({ key, order });
  });

  return (
    <VisualFrame config={config} compact={compact}>
      <div className="flex h-full flex-col justify-center gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
            keys
          </span>
          {keys.map((key, order) => (
            <span
              key={`${key}-${order}`}
              className="lv-rise rounded border border-border bg-card px-1.5 py-0.5 font-mono text-[11px] tabular-nums text-foreground"
              style={{ animationDelay: `${order * 0.18}s` }}
            >
              {key}
            </span>
          ))}
        </div>

        <div className="lv-scroll overflow-x-auto pb-1">
          <div className="flex w-max items-start gap-2">
            {buckets.map((entries, bucketIndex) => (
              <div
                key={bucketIndex}
                className="flex w-16 shrink-0 flex-col items-center gap-1"
              >
                <span className="w-full truncate text-center font-mono text-[10px] text-muted-foreground">
                  {labels[bucketIndex]}
                </span>
                <div
                  className={cn(
                    "flex w-full flex-col items-center gap-1 rounded-md border p-1.5",
                    entries.length > 1
                      ? "border-accent/50 bg-accent/5"
                      : "border-border bg-card/60",
                  )}
                >
                  {entries.length === 0 ? (
                    <span className="py-1 font-mono text-[11px] text-muted-foreground">·</span>
                  ) : (
                    entries.map((entry, entryIndex) => (
                      <Fragment key={`${entry.key}-${entry.order}`}>
                        {entryIndex > 0 ? (
                          <span className="h-2 w-px bg-accent/60" />
                        ) : null}
                        <span
                          className="lv-rise w-full truncate rounded border border-border bg-card px-1 py-0.5 text-center font-mono text-[10px] tabular-nums text-foreground"
                          style={{ animationDelay: `${entry.order * 0.18}s` }}
                        >
                          {entry.key}
                        </span>
                      </Fragment>
                    ))
                  )}
                </div>
                {entries.length > 1 ? (
                  <span className="inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-wide text-foreground">
                    <span className="lv-blink size-1 rounded-full bg-accent" />
                    collision
                  </span>
                ) : null}
              </div>
            ))}
          </div>
        </div>

        <p className="text-[10px] leading-relaxed text-muted-foreground">
          hash(key) দিয়ে bucket বেছে নাও · দুই key একই bucket-এ পড়লে chain ধরে রাখা হয়।
        </p>
      </div>
    </VisualFrame>
  );
}
