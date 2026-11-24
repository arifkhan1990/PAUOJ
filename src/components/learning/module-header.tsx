import Link from "next/link";
import {
  ArrowLeft,
  Award,
  ChevronRight,
  Clock3,
  FileCode2,
  Hammer,
  Layers3,
  LockKeyhole,
  Sparkles,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { LearningModuleView } from "@/lib/learning/types";
import { cn } from "@/lib/utils";
import { LearningProgressBar } from "./learning-progress";

function TrackBreadcrumb({ label }: { label: string }) {
  return (
    <nav aria-label="Breadcrumb">
      <ol className="flex flex-wrap items-center gap-1.5 text-xs font-medium">
        <li>
          <Link
            href="/learn"
            className="inline-flex items-center gap-1 text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          >
            <ArrowLeft className="size-3.5" aria-hidden="true" />
            All learning tracks
          </Link>
        </li>
        <li aria-hidden="true" className="text-muted-foreground/60">
          <ChevronRight className="size-3.5" />
        </li>
        <li aria-current="page" className="font-mono text-foreground">
          {label}
        </li>
      </ol>
    </nav>
  );
}

function StatusChips({ module }: { module: LearningModuleView }) {
  const isLive = module.status === "LIVE";
  const isTools = module.track === "tools";
  const locked = isLive && module.locked && !isTools;

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {isLive ? (
        isTools ? (
          <Badge variant="success">
            <Sparkles className="size-3" aria-hidden="true" />
            Free
          </Badge>
        ) : locked ? (
          <Badge variant="muted">
            <LockKeyhole className="size-3" aria-hidden="true" />
            Locked
          </Badge>
        ) : (
          <Badge variant="success">Live</Badge>
        )
      ) : (
        <Badge variant="muted">Planned</Badge>
      )}
      {module.badgeEarned ? (
        <Badge variant="warning">
          <Award className="size-3" aria-hidden="true" />
          Badge earned
        </Badge>
      ) : null}
    </div>
  );
}

function TrackMeta({ module }: { module: LearningModuleView }) {
  const items = [
    {
      icon: Clock3,
      term: "Estimated time",
      value: `${module.estimatedHours} hours`,
    },
    { icon: Layers3, term: "Topics", value: `${module.topics.length} topics` },
    {
      icon: FileCode2,
      term: "Problems",
      value: `${module.progress.total} problems`,
    },
  ];

  return (
    <dl className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-muted-foreground">
      {items.map((item) => (
        <div key={item.term} className="inline-flex items-center gap-1.5">
          <item.icon className="size-3.5 shrink-0" aria-hidden="true" />
          <dt className="sr-only">{item.term}</dt>
          <dd>{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}

function ProgressPanel({ module }: { module: LearningModuleView }) {
  const isLive = module.status === "LIVE";

  if (!isLive) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-muted/20 p-4">
        <p className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          <Hammer className="size-3.5" aria-hidden="true" />
          Roadmap preview
        </p>
        <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
          Progress starts tracking when this track goes live.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-background/70 p-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
        Your progress
      </p>
      <LearningProgressBar
        solved={module.progress.solved}
        total={module.progress.total}
        percent={module.progress.percent}
        className="mt-1"
        label={`${module.title}: ${module.progress.solved} of ${module.progress.total} problems solved`}
      />
      <p className="mt-3 flex items-center gap-1.5 border-t border-border pt-2.5 text-[11px] text-muted-foreground">
        {module.badgeEarned ? (
          <>
            <Award className="size-3.5 text-amber-600 dark:text-amber-400" aria-hidden="true" />
            Checkpoint badge earned
          </>
        ) : (
          <>
            {module.track === "tools" ? (
              <Award className="size-3.5 opacity-60" aria-hidden="true" />
            ) : (
              <LockKeyhole className="size-3.5" aria-hidden="true" />
            )}
            Badge unlocks at the checkpoint
          </>
        )}
      </p>
    </div>
  );
}

function BadgePreviewPanel({ module }: { module: LearningModuleView }) {
  const checkpoint = module.checkpoint;

  return (
    <div className="h-full rounded-xl border border-dashed border-border bg-muted/20 p-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
        Track badge
      </p>
      {checkpoint ? (
        <>
          <p className="mt-2 flex items-start gap-2 text-sm font-semibold leading-snug">
            <Award
              className="mt-0.5 size-4 shrink-0 text-amber-600 dark:text-amber-400"
              aria-hidden="true"
            />
            {checkpoint.badge.name}
          </p>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            Clear the {checkpoint.durationMinutes}-minute checkpoint (
            {checkpoint.problemCount} problems) to earn it.
          </p>
        </>
      ) : (
        <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
          A checkpoint badge arrives with the launch.
        </p>
      )}
    </div>
  );
}

function TrackIdentity({
  module,
  trackNumber,
  dormant,
}: {
  module: LearningModuleView;
  trackNumber: string;
  dormant: boolean;
}) {
  return (
    <div className="flex items-start gap-3 sm:gap-4">
      <span
        aria-hidden="true"
        className={cn(
          "grid size-12 shrink-0 place-items-center rounded-xl border font-mono text-sm font-semibold shadow-xs sm:size-14 sm:text-base",
          dormant
            ? "border-border bg-muted text-muted-foreground"
            : "border-primary/25 bg-primary/10 text-primary",
        )}
      >
        {trackNumber}
      </span>
      <div className="min-w-0">
        <p
          className={cn(
            "font-mono text-[10.5px] font-semibold uppercase tracking-[0.2em]",
            dormant ? "text-muted-foreground" : "text-primary",
          )}
        >
          {module.track === "tools" ? "Career toolkit" : "Learning track"}
        </p>
        <div className="mt-1.5">
          <StatusChips module={module} />
        </div>
      </div>
    </div>
  );
}

function TrackCopy({ module }: { module: LearningModuleView }) {
  return (
    <>
      <h1 className="mt-3 break-words text-2xl font-semibold tracking-tight sm:text-3xl">
        {module.title}
      </h1>
      <p lang="bn" className="mt-1 text-sm text-muted-foreground sm:text-base">
        {module.subtitle}
      </p>
      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
        {module.goal}
      </p>
      {module.description ? (
        <p
          lang="bn"
          className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground"
        >
          {module.description}
        </p>
      ) : null}
    </>
  );
}

export function ModuleHeader({ module }: { module: LearningModuleView }) {
  const isLive = module.status === "LIVE";
  const isTools = module.track === "tools";
  const locked = isLive && module.locked && !isTools;
  const dormant = !isLive || locked;
  const trackNumber = String(module.order).padStart(2, "0");

  return (
    <header>
      <TrackBreadcrumb
        label={isTools ? "Career toolkit" : `Track ${trackNumber}`}
      />

      <div className="relative mt-4 overflow-hidden rounded-2xl border border-border bg-card shadow-xs">
        <span
          aria-hidden="true"
          className={cn(
            "absolute inset-y-0 left-0 w-1",
            dormant ? "bg-muted-foreground/25" : "bg-primary",
          )}
        />
        <div className="p-5 pl-6 sm:p-6 sm:pl-7">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between lg:gap-8">
            <div className="min-w-0 flex-1">
              <TrackIdentity
                module={module}
                trackNumber={trackNumber}
                dormant={dormant}
              />
              <TrackCopy module={module} />
              <div className="mt-4 border-t border-border pt-3">
                <TrackMeta module={module} />
              </div>
            </div>

            <div className="w-full shrink-0 lg:w-64">
              {locked ? (
                <BadgePreviewPanel module={module} />
              ) : (
                <ProgressPanel module={module} />
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

