import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  AlarmClock,
  Award,
  Check,
  CheckCircle2,
  Circle,
  Clock3,
  Flag,
  ListChecks,
  Timer,
} from "lucide-react";
import { Countdown } from "@/components/shared/countdown";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { StartCheckpointButton } from "@/features/learning/start-checkpoint-button";
import type {
  LearningCheckpointStatus,
  LearningCheckpointView,
} from "@/lib/learning/types";
import { cn, formatDateTime } from "@/lib/utils";
import { CheckpointBadgePanel } from "./checkpoint-badge-panel";
import { LearningProgressBar } from "./learning-progress";
import { ProblemGroup } from "./problem-group";

const STATUS_META: Record<
  LearningCheckpointStatus,
  {
    label: string;
    variant: "muted" | "default" | "success" | "warning";
    icon: LucideIcon;
  }
> = {
  NOT_STARTED: { label: "Not started", variant: "muted", icon: Circle },
  ACTIVE: { label: "In progress", variant: "default", icon: Timer },
  COMPLETED: { label: "Completed", variant: "success", icon: Check },
  EXPIRED: { label: "Time ended", variant: "warning", icon: AlarmClock },
};

function CheckpointHeader({
  checkpoint,
}: {
  checkpoint: LearningCheckpointView;
}) {
  const meta = STATUS_META[checkpoint.status];
  const StatusIcon = meta.icon;

  return (
    <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border bg-amber-500/[0.06] px-5 py-4 dark:bg-amber-500/[0.07]">
      <div className="flex min-w-0 items-start gap-3">
        <span
          className="grid size-11 shrink-0 place-items-center rounded-xl border border-amber-300/70 bg-amber-500/10 text-amber-700 dark:border-amber-700/60 dark:text-amber-300"
          aria-hidden="true"
        >
          <Flag className="size-5" />
        </span>
        <div className="min-w-0">
          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-amber-700 dark:text-amber-300">
            Final checkpoint
          </p>
          <h2 className="mt-1 break-words text-lg font-semibold leading-snug">
            {checkpoint.title}
          </h2>
          <p lang="bn" className="mt-0.5 text-xs text-muted-foreground">
            {checkpoint.titleBn}
          </p>
        </div>
      </div>
      <Badge variant={meta.variant}>
        <StatusIcon className="size-3" aria-hidden="true" />
        {meta.label}
      </Badge>
    </div>
  );
}

function CheckpointMeta({
  checkpoint,
}: {
  checkpoint: LearningCheckpointView;
}) {
  const items = [
    {
      icon: Clock3,
      term: "Time limit",
      value: `${checkpoint.durationMinutes} min`,
    },
    {
      icon: ListChecks,
      term: "Problems",
      value: String(checkpoint.problemCount),
    },
    { icon: Award, term: "Badge", value: checkpoint.badge.name },
  ];

  return (
    <dl className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-lg border border-border bg-muted/20 px-3.5 py-2.5 text-xs">
      {items.map((item) => (
        <div key={item.term} className="inline-flex min-w-0 items-center gap-1.5">
          <item.icon
            className="size-3.5 shrink-0 text-muted-foreground"
            aria-hidden="true"
          />
          <dt className="shrink-0 text-muted-foreground">{item.term}</dt>
          <dd className="min-w-0 font-medium">{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}

function StartAction({
  moduleSlug,
  signedIn,
  expired,
}: {
  moduleSlug: string;
  signedIn: boolean;
  expired: boolean;
}) {
  if (!signedIn) {
    return (
      <Link
        href={`/login?next=/learn/${moduleSlug}`}
        className={buttonVariants({ className: "shrink-0" })}
      >
        Sign in to start
      </Link>
    );
  }
  return (
    <StartCheckpointButton
      moduleSlug={moduleSlug}
      label={expired ? "Start a fresh attempt" : "Start checkpoint"}
    />
  );
}

function AwaitingStart({
  checkpoint,
  moduleSlug,
  signedIn,
}: {
  checkpoint: LearningCheckpointView;
  moduleSlug: string;
  signedIn: boolean;
}) {
  const expired = checkpoint.status === "EXPIRED";

  return (
    <div className="rounded-xl border border-primary/25 bg-primary/[0.04] p-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 space-y-1">
          <p className="text-sm font-semibold">
            {expired
              ? "Time ended — start a fresh attempt"
              : "One sitting, timed on the clock"}
          </p>
          <p className="text-xs leading-relaxed text-muted-foreground">
            {expired ? (
              <>
                A new {checkpoint.durationMinutes}-minute window opens and only
                submissions inside it count.
              </>
            ) : (
              <>
                You get{" "}
                <span className="font-medium text-foreground">
                  {checkpoint.durationMinutes} minutes
                </span>{" "}
                once you start. Every problem must be accepted before the clock
                runs out.
              </>
            )}
          </p>
          <p className="font-mono text-[11px] text-muted-foreground">
            {expired && checkpoint.attempt
              ? `Previous attempt ended ${formatDateTime(checkpoint.attempt.endsAt)}`
              : "The clock starts only when you press start."}
          </p>
        </div>
        <StartAction
          moduleSlug={moduleSlug}
          signedIn={signedIn}
          expired={expired}
        />
      </div>
    </div>
  );
}

function ActiveAttempt({
  checkpoint,
}: {
  checkpoint: LearningCheckpointView;
}) {
  const percent =
    checkpoint.problemCount > 0
      ? (checkpoint.solvedCount / checkpoint.problemCount) * 100
      : 0;

  return (
    <div className="rounded-xl border border-primary/30 bg-primary/[0.06] p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">
          <Timer className="size-3.5" aria-hidden="true" />
          Attempt running
        </p>
        {checkpoint.attempt ? (
          <Countdown
            target={checkpoint.attempt.endsAt}
            label="Time left"
            className="font-mono text-sm font-semibold tabular-nums"
          />
        ) : null}
      </div>
      <LearningProgressBar
        solved={checkpoint.solvedCount}
        total={checkpoint.problemCount}
        percent={percent}
        className="mt-3"
        label={`Checkpoint: ${checkpoint.solvedCount} of ${checkpoint.problemCount} problems accepted`}
      />
      <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
        Every problem must be accepted before the timer reaches zero. The attempt
        cannot be restarted.
      </p>
    </div>
  );
}

function CompletedAttempt({
  checkpoint,
}: {
  checkpoint: LearningCheckpointView;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3 rounded-xl border border-success/30 bg-success/[0.06] p-4">
      <div className="flex min-w-0 items-start gap-3">
        <span
          className="grid size-9 shrink-0 place-items-center rounded-full bg-success/15 text-success"
          aria-hidden="true"
        >
          <CheckCircle2 className="size-5" />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-semibold">Checkpoint cleared</p>
          <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
            {checkpoint.attempt?.completedAt
              ? `All problems accepted · finished ${formatDateTime(
                  checkpoint.attempt.completedAt,
                )}`
              : "All problems were accepted inside the time window."}
          </p>
        </div>
      </div>
      <span className="font-mono text-xs tabular-nums text-muted-foreground">
        {checkpoint.solvedCount}/{checkpoint.problemCount}
      </span>
    </div>
  );
}

export function CheckpointCard({
  checkpoint,
  moduleSlug,
  signedIn,
  className,
}: {
  checkpoint: LearningCheckpointView;
  moduleSlug: string;
  signedIn: boolean;
  className?: string;
}) {
  const completed = checkpoint.status === "COMPLETED";

  return (
    <Card
      id="checkpoint"
      className={cn("scroll-mt-24 overflow-hidden", className)}
    >
      <CheckpointHeader checkpoint={checkpoint} />
      <div className="space-y-4 p-5">
        <p lang="bn" className="text-sm leading-relaxed text-muted-foreground">
          {checkpoint.description}
        </p>
        <CheckpointMeta checkpoint={checkpoint} />

        {completed ? (
          <CompletedAttempt checkpoint={checkpoint} />
        ) : checkpoint.status === "ACTIVE" ? (
          <ActiveAttempt checkpoint={checkpoint} />
        ) : (
          <AwaitingStart
            checkpoint={checkpoint}
            moduleSlug={moduleSlug}
            signedIn={signedIn}
          />
        )}

        <CheckpointBadgePanel
          badge={checkpoint.badge}
          earned={checkpoint.earned}
          completedAt={checkpoint.attempt?.completedAt ?? null}
        />

        <div className="border-t border-border pt-4">
          <ProblemGroup
            title="Problems in this checkpoint"
            problems={checkpoint.problems}
            emptyText="Checkpoint problems are in production."
          />
        </div>
      </div>
    </Card>
  );
}
