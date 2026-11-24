// Renders the "flow" lesson visual: ordered steps joined by a path, or interval bars.
import { Fragment } from "react";
import type { LessonVisualConfig } from "@/lib/learning/visual-types";
import { cn } from "@/lib/utils";
import { VisualFrame } from "./visual-frame";

type VisualProps = { config: LessonVisualConfig; compact?: boolean };

const DEFAULT_STEPS = ["শুরু", "শর্ত", "পুনরাবৃত্তি", "শেষ"];

export function FlowVisual({ config, compact = false }: VisualProps) {
  const labels = (config.data?.labels?.length ? config.data.labels : DEFAULT_STEPS).slice(0, 5);
  const isIntervals = config.data?.variant === "intervals";

  return (
    <VisualFrame config={config} compact={compact}>
      {isIntervals ? (
        <IntervalTrack labels={labels} />
      ) : (
        <StepChain labels={labels} compact={compact} />
      )}
    </VisualFrame>
  );
}

function StepChain({ labels, compact }: { labels: string[]; compact: boolean }) {
  return (
    <div className="flex h-full flex-col justify-center gap-4">
      <div className="lv-scroll overflow-x-auto pb-1">
        <div className="flex min-w-max items-stretch gap-1">
          {labels.map((label, index) => (
            <Fragment key={`${label}-${index}`}>
              {index > 0 ? <FlowArrow /> : null}
              <div
                className={cn(
                  "flex shrink-0 flex-col items-center gap-1.5 rounded-lg border border-border bg-card px-2 py-2.5 text-center shadow-xs",
                  compact ? "w-[78px]" : "w-[92px]",
                )}
              >
                <span className="relative flex size-5 items-center justify-center rounded-full bg-primary/10 font-mono text-[10px] font-semibold text-foreground">
                  <span
                    className="lv-blink absolute -inset-0.5 rounded-full border border-primary/50"
                    style={{ animationDelay: `${index * 0.55}s` }}
                  />
                  {index + 1}
                </span>
                <span className="break-words text-[11px] font-medium leading-tight text-foreground">
                  {label}
                </span>
              </div>
            </Fragment>
          ))}
        </div>
      </div>
      <p className="font-mono text-[10px] leading-relaxed text-muted-foreground">
        {labels.join(" → ")}
      </p>
    </div>
  );
}

function FlowArrow() {
  return (
    <svg viewBox="0 0 28 10" className="h-2.5 w-7 shrink-0 self-center" aria-hidden="true">
      <line
        x1="0"
        y1="5"
        x2="21"
        y2="5"
        className="animate-dash stroke-primary/50"
        strokeWidth="1.5"
        strokeDasharray="4 3"
      />
      <path
        d="M20 1.5 L27 5 L20 8.5"
        fill="none"
        className="stroke-primary/70"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IntervalTrack({ labels }: { labels: string[] }) {
  return (
    <div className="flex h-full flex-col justify-center gap-3">
      <div className="flex flex-col gap-2">
        {labels.map((label, index) => {
          const start = Math.min(68, index * 16);
          const span = Math.min(100 - start, 34 + ((index * 13) % 28));
          return (
            <div key={`${label}-${index}`} className="flex items-center gap-2">
              <span className="w-14 shrink-0 truncate text-right text-[10px] text-muted-foreground">
                {label}
              </span>
              <div className="relative h-5 flex-1 overflow-hidden rounded-sm bg-muted/50">
                <div
                  className="animate-bar absolute inset-y-0 rounded-sm border border-primary/40 bg-primary/25"
                  style={{
                    left: `${start}%`,
                    width: `${span}%`,
                    animationDelay: `${index * 220}ms`,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex items-center justify-between pl-16 font-mono text-[10px] text-muted-foreground">
        <span>0</span>
        <span>সময় →</span>
        <span>n</span>
      </div>
      <p className="text-[10px] leading-relaxed text-muted-foreground">
        ওভারল্যাপ মানে একই সময়ে একাধিক কাজ চলছে।
      </p>
    </div>
  );
}
