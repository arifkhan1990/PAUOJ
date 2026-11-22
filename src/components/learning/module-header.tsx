import Link from "next/link";
import {
  ArrowLeft,
  Clock3,
  FileCode2,
  Layers3,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { LearningModuleView } from "@/lib/learning/types";
import { cn } from "@/lib/utils";
import { LearningProgressBar } from "./learning-progress";

export function ModuleHeader({ module }: { module: LearningModuleView }) {
  const isLive = module.status === "LIVE";
  const trackNumber = String(module.order).padStart(2, "0");

  return (
    <header className="border-b border-border pb-6">
      <Link
        href="/learn"
        className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
      >
        <ArrowLeft className="size-3.5" aria-hidden="true" />
        All learning tracks
      </Link>

      <div className="mt-4 flex items-start gap-3 sm:gap-4">
        <span
          className={cn(
            "grid size-11 shrink-0 place-items-center rounded-xl border font-mono text-sm font-semibold sm:size-12",
            isLive
              ? "border-primary/30 bg-primary/10 text-primary"
              : "border-border bg-muted text-muted-foreground",
          )}
          aria-hidden="true"
        >
          {trackNumber}
        </span>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
              Track {trackNumber}
            </p>
            {isLive ? (
              <Badge variant="success">Live</Badge>
            ) : (
              <Badge variant="muted">Planned</Badge>
            )}
          </div>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
            {module.title}
          </h1>
          <p lang="bn" className="mt-1 text-sm text-muted-foreground">
            {module.subtitle}
          </p>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            {module.goal}
          </p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <Clock3 className="size-3.5" aria-hidden="true" />
          {module.estimatedHours} hours
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Layers3 className="size-3.5" aria-hidden="true" />
          {module.topics.length} topics
        </span>
        <span className="inline-flex items-center gap-1.5">
          <FileCode2 className="size-3.5" aria-hidden="true" />
          {module.progress.total} problems
        </span>
      </div>

      {isLive ? (
        <LearningProgressBar
          solved={module.progress.solved}
          total={module.progress.total}
          percent={module.progress.percent}
          className="mt-4 max-w-sm"
          label={`${module.title}: ${module.progress.solved} of ${module.progress.total} problems solved`}
        />
      ) : (
        <p className="mt-4 text-[11px] text-muted-foreground">
          Roadmap preview · progress starts when this track goes live
        </p>
      )}
    </header>
  );
}
