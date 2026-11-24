// Renders the "stack" lesson visual: a LIFO stack, plus a FIFO queue strip for variant="both".
import type { LessonVisualConfig } from "@/lib/learning/visual-types";
import { cn } from "@/lib/utils";
import { VisualFrame } from "./visual-frame";

type VisualProps = { config: LessonVisualConfig; compact?: boolean };

const DEFAULT_VALUES = [4, 7, 2, 9];
const DEFAULT_QUEUE = ["A", "B", "C", "D"];

export function StackVisual({ config, compact = false }: VisualProps) {
  const raw = (config.data?.values ?? DEFAULT_VALUES).filter(Number.isFinite).map(Math.trunc);
  const stack = (raw.length ? raw : DEFAULT_VALUES).slice(compact ? -3 : -5);
  const showQueue = config.data?.variant === "both";
  const queueLabels = (config.data?.labels?.length ? config.data.labels : DEFAULT_QUEUE).slice(
    0,
    compact ? 3 : 5,
  );

  const panel = <StackPanel stack={stack} compact={compact} />;

  return (
    <VisualFrame config={config} compact={compact}>
      {showQueue ? (
        <div className="flex h-full flex-col justify-center gap-4">
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-end sm:justify-center sm:gap-8">
            {panel}
          </div>
          <QueueStrip labels={queueLabels} compact={compact} />
        </div>
      ) : (
        <div className="flex h-full flex-col items-center justify-center gap-4 sm:flex-row sm:items-end sm:gap-8">
          {panel}
        </div>
      )}
    </VisualFrame>
  );
}

function StackPanel({ stack, compact }: { stack: number[]; compact: boolean }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <span className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.16em] text-foreground">
        <span className="lv-blink size-1.5 rounded-full bg-primary" />
        top
      </span>

      <div className="flex flex-col gap-1">
        {[...stack].reverse().map((value, index) => {
          const isTop = index === 0;
          const slot = stack.length - 1 - index;
          return (
            <div
              key={`${value}-${slot}`}
              className={cn(
                "relative flex items-center justify-between rounded-md border px-3 font-mono",
                compact ? "h-7 w-28 text-[11px]" : "h-9 w-36 text-xs",
                isTop
                  ? "border-primary bg-primary/10 text-foreground"
                  : "border-border bg-card text-foreground",
              )}
            >
              {isTop ? (
                <span className="lv-glow pointer-events-none absolute -inset-px rounded-md border border-primary/50" />
              ) : null}
              <span className="tabular-nums">{value}</span>
              <span className="text-[10px] tabular-nums text-muted-foreground">[{slot}]</span>
            </div>
          );
        })}
      </div>

      <div className={cn("h-0.5 rounded-full bg-border", compact ? "w-28" : "w-36")} />
      <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
        base
      </span>
    </div>
  );
}

function QueueStrip({ labels, compact }: { labels: string[]; compact: boolean }) {
  return (
    <div className="w-full max-w-md self-center border-t border-dashed border-border pt-3">
      <div className="mb-1.5 flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.14em]">
        <span className="inline-flex items-center gap-1 text-foreground">
          <span className="lv-blink size-1.5 rounded-full bg-accent" />
          front
        </span>
        <span className="text-muted-foreground">queue · FIFO</span>
        <span className="text-muted-foreground">back</span>
      </div>

      <div className="flex items-stretch gap-1.5 lv-scroll overflow-x-auto pb-1">
        <span className="shrink-0 self-center font-mono text-[10px] text-muted-foreground">
          ← dequeue
        </span>
        {labels.map((label, index) => (
          <div
            key={`${label}-${index}`}
            className={cn(
              "lv-rise flex max-w-24 shrink-0 items-center justify-center truncate rounded-md border px-2 font-mono",
              compact ? "h-7 text-[10px]" : "h-8 text-xs",
              index === 0
                ? "border-accent/60 bg-accent/10 text-foreground"
                : "border-border bg-card text-foreground",
            )}
            style={{ animationDelay: `${index * 0.16}s` }}
          >
            {label}
          </div>
        ))}
        <span className="shrink-0 self-center font-mono text-[10px] text-muted-foreground">
          enqueue →
        </span>
      </div>

      <p className="mt-1 text-[10px] leading-relaxed text-muted-foreground">
        queue-এ আগে ঢোকা আগে বেরোয় (FIFO) · stack-এ শেষে ঢোকা আগে বেরোয় (LIFO)।
      </p>
    </div>
  );
}
