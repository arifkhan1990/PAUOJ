import Link from "next/link";
import {
  ArrowRight,
  Award,
  Clock3,
  FileCode2,
  Layers3,
  LockKeyhole,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import type { LearningModuleSummary } from "@/lib/learning/types";
import { cn } from "@/lib/utils";
import { LearningProgressBar } from "./learning-progress";

type TrackState = "live" | "locked" | "planned";

function trackState(module: LearningModuleSummary): TrackState {
  if (module.status === "PLANNED") return "planned";
  return module.locked ? "locked" : "live";
}

function plural(count: number, singular: string) {
  return `${count} ${singular}${count === 1 ? "" : "s"}`;
}

function StatusChip({ state }: { state: TrackState }) {
  if (state === "live") {
    return (
      <Badge variant="success">
        <span
          className="size-1.5 rounded-full bg-emerald-600 dark:bg-emerald-300"
          aria-hidden="true"
        />
        Live
      </Badge>
    );
  }
  if (state === "locked") {
    return (
      <Badge variant="muted">
        <LockKeyhole className="size-3" aria-hidden="true" />
        Locked
      </Badge>
    );
  }
  return (
    <Badge variant="secondary">
      <Clock3 className="size-3" aria-hidden="true" />
      Planned
    </Badge>
  );
}

function BadgeChip({ module }: { module: LearningModuleSummary }) {
  if (module.badgeEarned) {
    return (
      <Badge variant="warning">
        <Award className="size-3" aria-hidden="true" />
        Badge earned
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="text-muted-foreground">
      <Award className="size-3 opacity-60" aria-hidden="true" />
      {module.status === "PLANNED" ? "Badge at launch" : "Badge locked"}
    </Badge>
  );
}

export function ModuleCard({
  module,
  signedIn,
}: {
  module: LearningModuleSummary;
  signedIn: boolean;
}) {
  const state = trackState(module);
  const trackNumber = String(module.order).padStart(2, "0");
  const isComplete =
    module.progress.total > 0 &&
    module.progress.solved >= module.progress.total;
  const ctaLabel =
    state === "planned"
      ? "Preview"
      : isComplete
        ? "Review"
        : module.progress.solved > 0
          ? "Resume"
          : "Open";

  return (
    <li className="group relative">
      <Card
        className={cn(
          "relative flex h-full flex-col overflow-hidden p-0 transition duration-200 ease-out",
          state === "live" &&
            "group-hover:-translate-y-0.5 group-hover:border-primary/40 group-hover:shadow-md group-focus-within:border-primary/40",
          state !== "live" && "group-hover:border-muted-foreground/35",
        )}
      >
        <span
          aria-hidden="true"
          className={cn(
            "absolute inset-x-0 top-0 h-0.5",
            state === "live"
              ? "bg-gradient-to-r from-primary via-primary/50 to-transparent"
              : "bg-muted-foreground/15",
          )}
        />

        <div className="flex flex-1 flex-col p-5">
          <div className="flex items-start justify-between gap-3">
            <span
              aria-hidden="true"
              className={cn(
                "grid size-9 shrink-0 place-items-center rounded-md border font-mono text-xs font-semibold tabular-nums",
                state === "live" && "border-primary/25 bg-primary/10 text-primary",
                state === "locked" &&
                  "border-border bg-muted text-muted-foreground",
                state === "planned" &&
                  "border-dashed border-border bg-transparent text-muted-foreground",
              )}
            >
              {trackNumber}
            </span>
            <StatusChip state={state} />
          </div>

          <h3 className="mt-4 break-words text-base font-semibold leading-snug">
            <span className="sr-only">Track {module.order}: </span>
            {module.title}
          </h3>
          <p
            lang="bn"
            className="mt-1 text-sm leading-relaxed text-muted-foreground"
          >
            {module.subtitle}
          </p>
          <p className="mt-2.5 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
            {module.goal}
          </p>

          <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <Layers3 className="size-3.5" aria-hidden="true" />
              {plural(module.topicCount, "topic")}
            </span>
            {module.problemCount > 0 ? (
              <span className="inline-flex items-center gap-1">
                <FileCode2 className="size-3.5" aria-hidden="true" />
                {plural(module.problemCount, "problem")}
              </span>
            ) : null}
            <span className="inline-flex items-center gap-1">
              <Clock3 className="size-3.5" aria-hidden="true" />
              {module.estimatedHours} h
            </span>
          </div>

          <div className="mt-auto pt-4">
            {state === "planned" ? (
              <p className="flex items-center gap-2 rounded-md border border-dashed border-border px-2.5 py-2 text-[11px] text-muted-foreground">
                <Clock3 className="size-3.5 shrink-0" aria-hidden="true" />
                Roadmap · content in production
              </p>
            ) : (
              <LearningProgressBar
                solved={module.progress.solved}
                total={module.progress.total}
                percent={module.progress.percent}
                muted={!signedIn}
                label={`${module.title}: ${module.progress.solved} of ${module.progress.total} problems solved`}
              />
            )}

            {state === "locked" && module.unlockHint ? (
              <p className="mt-2 flex gap-1.5 text-[11px] leading-relaxed text-muted-foreground">
                <LockKeyhole
                  className="mt-0.5 size-3 shrink-0"
                  aria-hidden="true"
                />
                <span className="line-clamp-2 break-words">
                  {module.unlockHint}
                </span>
              </p>
            ) : null}

            <div className="mt-3 flex items-center justify-between gap-2 border-t border-border pt-3">
              <BadgeChip module={module} />
              <span
                aria-hidden="true"
                className="inline-flex shrink-0 items-center gap-1 text-[11px] font-medium text-muted-foreground transition-colors group-hover:text-primary"
              >
                {ctaLabel}
                <ArrowRight className="size-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
              </span>
            </div>
          </div>
        </div>
      </Card>

      <Link
        href={`/learn/${module.slug}`}
        aria-label={`Open track ${module.order}: ${module.title}${
          state === "locked" ? " (locked)" : ""
        }`}
        className="absolute inset-0 z-10 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
      />
    </li>
  );
}
