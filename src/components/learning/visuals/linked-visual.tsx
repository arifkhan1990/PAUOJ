// Renders the "linked" lesson visual: nodes joined by next-pointers, a pointer walking them.
import { Fragment, type CSSProperties } from "react";
import type { LessonVisualConfig } from "@/lib/learning/visual-types";
import { cn } from "@/lib/utils";
import { VisualFrame } from "./visual-frame";

type VisualProps = { config: LessonVisualConfig; compact?: boolean };

const DEFAULT_VALUES = [12, 45, 7, 30];
const NODE_W = 64;
const ARROW_W = 28;
const STRIDE = NODE_W + ARROW_W;

export function LinkedVisual({ config, compact = false }: VisualProps) {
  const raw = (config.data?.values ?? DEFAULT_VALUES).filter(Number.isFinite).map(Math.trunc);
  const values = (raw.length ? raw : DEFAULT_VALUES).slice(0, 6);
  const travel = Math.max(0, (values.length - 1) * STRIDE);

  return (
    <VisualFrame config={config} compact={compact}>
      <div className="flex h-full flex-col justify-center gap-3">
        <div className="lv-scroll overflow-x-auto pb-1">
          <div className="relative w-max pt-7">
            <div className="absolute left-0 top-0 flex w-16 justify-center">
              <span
                className="lv-sweep inline-flex h-5 items-center justify-center rounded-full border border-accent/50 bg-accent/10 px-2 font-mono text-[10px] font-semibold uppercase tracking-wide text-foreground"
                style={{ "--lv-travel": `${travel}px` } as CSSProperties}
              >
                cur
              </span>
            </div>

            <div className="flex items-center">
              {values.map((value, index) => (
                <Fragment key={`${value}-${index}`}>
                  <div
                    className={cn(
                      "flex w-16 shrink-0 overflow-hidden rounded-md border shadow-xs",
                      compact ? "h-9" : "h-10",
                      index === 0 ? "border-primary/50" : "border-border",
                    )}
                  >
                    <span className="flex w-9 items-center justify-center overflow-hidden border-r border-border bg-muted/40 px-0.5 font-mono text-xs tabular-nums text-foreground">
                      {value}
                    </span>
                    <span className="flex flex-1 items-center justify-center bg-card">
                      <span
                        className={cn(
                          "size-1.5 rounded-full",
                          index === values.length - 1
                            ? "border border-muted-foreground/70"
                            : "bg-primary",
                        )}
                      />
                    </span>
                  </div>
                  <LinkArrow last={index === values.length - 1} />
                </Fragment>
              ))}
              <span className="font-mono text-[10px] text-muted-foreground">null</span>
            </div>
          </div>
        </div>

        <p className="text-[10px] leading-relaxed text-muted-foreground">
          প্রতি node-এ value + next · শেষ node-এর next = null · pointer হেঁটে গিয়ে খোঁজে, তাই O(n)।
        </p>
      </div>
    </VisualFrame>
  );
}

function LinkArrow({ last }: { last: boolean }) {
  return (
    <svg viewBox="0 0 28 10" className="h-2.5 w-7 shrink-0 self-center" aria-hidden="true">
      <line
        x1="0"
        y1="5"
        x2="20"
        y2="5"
        className={cn("animate-dash", last ? "stroke-muted-foreground/50" : "stroke-primary/60")}
        strokeWidth="1.5"
        strokeDasharray="4 3"
      />
      <path
        d="M19 1.5 L27 5 L19 8.5"
        fill="none"
        className={last ? "stroke-muted-foreground/70" : "stroke-primary/70"}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
