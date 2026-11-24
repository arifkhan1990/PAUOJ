// Renders the `pipeline` lesson visual: CI jobs lighting up in order, a deploy
// gate, then the deploy step (or the rollback once deploy fails).

import { ArrowLeft } from "lucide-react";
import type { CSSProperties } from "react";
import type { LessonVisualConfig } from "@/lib/learning/visual-types";
import { cn } from "@/lib/utils";
import { VisualFrame } from "./visual-frame";

type VisualProps = { config: LessonVisualConfig; compact?: boolean };

const DEFAULT_JOBS = ["lint", "test", "build", "security"];
const BOX = "flex w-full flex-col items-center justify-center rounded-md border px-1.5 py-1 text-center sm:w-20";

export function PipelineVisual({ config, compact = false }: VisualProps) {
  const variant = config.data?.variant ?? "gate";
  const rollback = variant === "rollback";
  const labels = config.data?.labels?.length
    ? config.data.labels
    : rollback
      ? ["lint", "test", "build"]
      : DEFAULT_JOBS;
  const deployIndex = labels.findIndex((label) => /deploy|prod/i.test(label));
  const splitAt = deployIndex === -1 ? labels.length : deployIndex;
  const before = labels.slice(0, splitAt).slice(0, 4);
  const after = labels.slice(splitAt).slice(0, 2);
  const gateDelay = before.length * 480 + 240;

  const jobBox = (name: string, index: number) => (
    <div
      key={`${name}-${index}`}
      className={cn(BOX, "lv-glow border-border bg-card")}
      style={{ animationDelay: `${index * 480}ms` } as CSSProperties}
    >
      <span className="w-full break-words font-mono text-[10px] font-semibold leading-tight text-foreground">{name}</span>
      <span className="font-mono text-[10px] text-foreground">✓ pass</span>
    </div>
  );

  const deployBox = (name: string) => (
    <div key={name} className={cn(BOX, rollback ? "border-destructive/50 bg-destructive/10" : "border-primary/40 bg-primary/10")}>
      <span className={cn("w-full break-words font-mono text-[10px] font-semibold leading-tight", rollback ? "text-foreground" : "text-foreground")}>
        {name}
      </span>
      <span className="inline-flex items-center gap-1 font-mono text-[10px] text-muted-foreground">
        <span className={cn("size-1.5 rounded-full animate-pulse-soft", rollback ? "bg-destructive" : "bg-primary")} />
        prod
      </span>
    </div>
  );

  return (
    <VisualFrame config={config} compact={compact}>
      <div className="flex h-full flex-col justify-center gap-3">
        <div className="grid w-full grid-cols-3 items-stretch gap-1.5 sm:flex sm:items-stretch sm:justify-center">
          {before.map((job, index) => jobBox(job, index))}

          <div
            className={cn(
              BOX,
              "lv-pop",
              rollback
                ? "border-destructive/50 bg-destructive/10 text-foreground"
                : "border-warning/50 bg-warning/10 text-foreground",
            )}
            style={{ animationDelay: `${gateDelay}ms` } as CSSProperties}
          >
            <span className="font-mono text-[10px] font-semibold">{rollback ? "failed" : "gate"}</span>
            <span className="font-mono text-[10px]">{rollback ? "rollback" : "approve"}</span>
          </div>

          {after.length > 0
            ? after.map((job) => deployBox(job))
            : deployBox("deploy")}
        </div>

        {rollback ? (
          <div className="flex items-center justify-center gap-1 text-[10px] text-foreground">
            <ArrowLeft className="size-3.5" aria-hidden="true" />
            <span className="border-b border-dashed border-destructive/50 pb-0.5 font-mono text-[10px]">
              previous stable image-এ ফিরে যাও
            </span>
          </div>
        ) : (
          <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[10px] text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <span className="size-1.5 rounded-full bg-success" />
              jobs সিরিয়ালি চলে
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="size-1.5 rounded-full bg-warning" />
              gate ছাড়া deploy নয়
            </span>
          </div>
        )}
      </div>
    </VisualFrame>
  );
}
