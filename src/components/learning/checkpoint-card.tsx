import Link from "next/link";
import { Flag } from "lucide-react";
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
import { ProblemGroup } from "./problem-group";

const STATUS_META: Record<
  LearningCheckpointStatus,
  { label: string; variant: "muted" | "default" | "success" | "warning" }
> = {
  NOT_STARTED: { label: "Not started", variant: "muted" },
  ACTIVE: { label: "In progress", variant: "default" },
  COMPLETED: { label: "Completed", variant: "success" },
  EXPIRED: { label: "Time ended", variant: "warning" },
};

function CheckpointHeader({ checkpoint }: { checkpoint: LearningCheckpointView }) {
  const meta = STATUS_META[checkpoint.status];

  return (
    <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border bg-muted/20 px-5 py-4">
      <div className="flex items-start gap-3">
        <span
          className="grid size-10 shrink-0 place-items-center rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400"
          aria-hidden="true"
        >
          <Flag className="size-5" />
        </span>
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Checkpoint · {checkpoint.durationMinutes} min
          </p>
          <h2 className="mt-0.5 text-base font-semibold leading-snug">
            {checkpoint.title}
          </h2>
          <p lang="bn" className="mt-0.5 text-xs text-muted-foreground">
            {checkpoint.titleBn}
          </p>
        </div>
      </div>
      <Badge variant={meta.variant}>{meta.label}</Badge>
    </div>
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
    <>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1.5 text-xs leading-relaxed text-muted-foreground">
          {expired ? (
            <p>
              <span className="font-medium text-foreground">
                Time ended — start a fresh attempt.
              </span>{" "}
              A new {checkpoint.durationMinutes}-minute window opens and only
              submissions inside it count.
            </p>
          ) : (
            <p>
              You get{" "}
              <span className="font-medium text-foreground">
                {checkpoint.durationMinutes} minutes
              </span>{" "}
              once you start. All three problems must be accepted inside that
              window.
            </p>
          )}
          {expired && checkpoint.attempt ? (
            <p className="font-mono text-[11px]">
              Previous attempt ended {formatDateTime(checkpoint.attempt.endsAt)}
            </p>
          ) : (
            <p>The clock starts only when you press start.</p>
          )}
        </div>
        <StartAction
          moduleSlug={moduleSlug}
          signedIn={signedIn}
          expired={expired}
        />
      </div>
      <ProblemGroup
        title="Problems in this checkpoint"
        problems={checkpoint.problems}
        emptyText="Checkpoint problems are in production."
      />
    </>
  );
}

function ActiveAttempt({ checkpoint }: { checkpoint: LearningCheckpointView }) {
  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border bg-background px-3 py-2">
        {checkpoint.attempt ? (
          <Countdown
            target={checkpoint.attempt.endsAt}
            label="Time left"
            className="text-xs font-medium"
          />
        ) : null}
        <span className="font-mono text-xs tabular-nums text-muted-foreground">
          {checkpoint.solvedCount} / {checkpoint.problemCount} solved
        </span>
      </div>
      <p className="text-xs text-muted-foreground">
        Every problem must be accepted before the timer reaches zero. The
        attempt cannot be restarted.
      </p>
      <ProblemGroup
        title="Problems in this checkpoint"
        problems={checkpoint.problems}
        emptyText="Checkpoint problems are in production."
      />
    </>
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
  return (
    <Card
      id="checkpoint"
      className={cn("scroll-mt-24 overflow-hidden", className)}
    >
      <CheckpointHeader checkpoint={checkpoint} />
      <div className="space-y-4 p-5">
        <p className="text-sm leading-relaxed text-muted-foreground">
          {checkpoint.description}
        </p>
        {checkpoint.status === "COMPLETED" ? (
          <CheckpointBadgePanel
            badge={checkpoint.badge}
            earned={checkpoint.earned}
            completedAt={checkpoint.attempt?.completedAt ?? null}
          />
        ) : checkpoint.status === "ACTIVE" ? (
          <ActiveAttempt checkpoint={checkpoint} />
        ) : (
          <AwaitingStart
            checkpoint={checkpoint}
            moduleSlug={moduleSlug}
            signedIn={signedIn}
          />
        )}
      </div>
    </Card>
  );
}
