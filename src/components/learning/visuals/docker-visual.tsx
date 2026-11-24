// Renders the `docker` lesson visual: an image layer stack with cache hits or a
// multistage build where builder layers are discarded.

import { ArrowRight } from "lucide-react";
import type { CSSProperties } from "react";
import type { LessonVisualConfig } from "@/lib/learning/visual-types";
import { cn } from "@/lib/utils";
import { VisualFrame } from "./visual-frame";

type VisualProps = { config: LessonVisualConfig; compact?: boolean };

const DEFAULT_BUILDER = [
  "FROM node:24 AS build",
  "COPY package.json",
  "RUN pnpm install",
  "COPY . .",
  "RUN pnpm build",
];
const DEFAULT_RUNTIME = ["FROM node:24-slim", "COPY --from=build /app/dist", "CMD node server.js"];

function LayerRow({
  name,
  index,
  badge,
  tone,
  compact,
}: {
  name: string;
  index: number;
  badge: string;
  tone: "primary" | "muted" | "success";
  compact: boolean;
}) {
  const muted = tone === "muted";
  return (
    <div
      className={cn(
        "lv-rise flex items-center justify-between gap-2 rounded-md border px-2",
        compact ? "py-1" : "py-1.5",
        muted
          ? "border-dashed border-border bg-muted/20 text-muted-foreground"
          : "border-border bg-card text-foreground",
      )}
      style={{ animationDelay: `${index * 240}ms` } as CSSProperties}
    >
      <span className="flex min-w-0 items-center gap-1.5">
        <span
          className={cn(
            "size-1.5 shrink-0 rounded-full",
            tone === "primary" && "bg-primary/70",
            tone === "muted" && "bg-muted-foreground/50",
            tone === "success" && "bg-success/70",
          )}
        />
        <span className="truncate font-mono text-[10px]">{name}</span>
      </span>
      <span
        className={cn(
          "inline-flex shrink-0 items-center rounded px-1 py-0.5 font-mono text-[10px] uppercase tracking-wide",
          tone === "primary" && "bg-primary/10 text-foreground",
          tone === "muted" && "bg-muted text-muted-foreground",
          tone === "success" && "bg-success/10 text-foreground lv-pop",
        )}
      >
        {badge}
      </span>
    </div>
  );
}

export function DockerVisual({ config, compact = false }: VisualProps) {
  const variant = config.data?.variant ?? "multistage";
  const provided = config.data?.labels ?? [];
  const hasStages = provided.some((label) => /^(builder|final|runtime):/i.test(label));
  const builder = hasStages
    ? provided.filter((label) => /^builder:/i.test(label))
    : provided.length >= 5 ? provided.slice(0, Math.max(1, provided.length - 2)) : DEFAULT_BUILDER;
  const runtime = hasStages
    ? provided.filter((label) => /^(final|runtime):/i.test(label))
    : provided.length >= 5 ? provided.slice(-2) : DEFAULT_RUNTIME;
  const cacheLayers = provided.length >= 3 ? provided.slice(0, 5) : DEFAULT_BUILDER;
  const cacheHits = Math.min(
    cacheLayers.length,
    Math.max(0, config.data?.values?.[0] ?? 2),
  );

  const note =
    variant === "cache"
      ? "একই layer আবার build হয় না → cache hit"
      : "শুধু final stage image-এ থাকে, builder বাদ যায়";

  if (variant === "cache") {
    return (
      <VisualFrame config={config} compact={compact}>
        <div className="flex h-full flex-col items-center justify-center gap-2">
          <div className="flex w-full max-w-[300px] flex-col-reverse gap-1">
            {cacheLayers.map((name, index) => (
              <LayerRow
                key={`${name}-${index}`}
                name={name}
                index={index}
                badge={index < cacheHits ? "cache hit" : "rebuild"}
                tone={index < cacheHits ? "success" : "primary"}
                compact={compact}
              />
            ))}
          </div>
          <p className="font-mono text-[10px] text-muted-foreground">
            {cacheHits}/{cacheLayers.length} layers reused
          </p>
          <p className="text-center text-[10px] leading-relaxed text-muted-foreground">{note}</p>
        </div>
      </VisualFrame>
    );
  }

  return (
    <VisualFrame config={config} compact={compact}>
      <div className="flex h-full flex-col justify-center gap-2">
        <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center">
          <section className="min-w-0 flex-1">
            <p className="mb-1 flex items-center justify-between gap-1 font-mono text-[10px] uppercase tracking-wide text-muted-foreground">
              builder
              <span className="rounded bg-muted px-1 py-0.5 text-[10px] normal-case text-muted-foreground">
                discarded
              </span>
            </p>
            <div className="flex flex-col-reverse gap-1">
              {builder.map((name, index) => (
                <LayerRow
                  key={`${name}-${index}`}
                  name={name}
                  index={index}
                  badge="discard"
                  tone="muted"
                  compact={compact}
                />
              ))}
            </div>
          </section>

          <div className="flex shrink-0 flex-row items-center justify-center gap-1 sm:w-24 sm:flex-col">
            <span className="lv-glow inline-flex items-center justify-center rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-center font-mono text-[10px] text-foreground">
              COPY --from
            </span>
            <ArrowRight
              className="size-3.5 rotate-90 text-muted-foreground lv-sweep sm:rotate-0"
              style={{ "--lv-travel": "10px" } as CSSProperties}
              aria-hidden="true"
            />
          </div>

          <section className="min-w-0 flex-1">
            <p className="mb-1 flex items-center justify-between gap-1 font-mono text-[10px] uppercase tracking-wide text-muted-foreground">
              runtime
              <span className="rounded bg-primary/10 px-1 py-0.5 text-[10px] normal-case text-foreground">
                final
              </span>
            </p>
            <div className="flex flex-col-reverse gap-1">
              {runtime.map((name, index) => (
                <LayerRow
                  key={`${name}-${index}`}
                  name={name}
                  index={index + 2}
                  badge="keep"
                  tone="primary"
                  compact={compact}
                />
              ))}
            </div>
          </section>
        </div>

        <p className="text-center text-[10px] leading-relaxed text-muted-foreground">{note}</p>
      </div>
    </VisualFrame>
  );
}
