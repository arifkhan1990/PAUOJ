import type { LucideIcon } from "lucide-react";
import { BookOpen, Compass, Flag, Rocket, Shapes } from "lucide-react";
import { cn } from "@/lib/utils";

type Step = {
  label: string;
  hint: string;
  icon: LucideIcon;
  final?: boolean;
};

const STEPS: readonly Step[] = [
  { label: "Concept note", hint: "Read the idea", icon: BookOpen },
  { label: "Guided", hint: "Warm up with support", icon: Compass },
  { label: "Tiered practice", hint: "Easy → medium → hard", icon: Shapes },
  { label: "Extra practice", hint: "Try it without hints", icon: Rocket },
  {
    label: "Checkpoint",
    hint: "Timed · 3 problems · earns a badge",
    icon: Flag,
    final: true,
  },
];

function StepItem({
  step,
  index,
  last,
  muted,
}: {
  step: Step;
  index: number;
  last: boolean;
  muted: boolean;
}) {
  const Icon = step.icon;

  return (
    <li className="flex gap-3 sm:flex-1 sm:flex-col sm:gap-0">
      <div className="flex flex-col items-center sm:w-full sm:flex-row">
        <span
          aria-hidden="true"
          className={cn(
            "grid size-9 shrink-0 place-items-center rounded-full border font-mono text-xs font-semibold",
            muted
              ? "border-border bg-muted text-muted-foreground"
              : last
                ? "border-amber-300 bg-amber-500/10 text-amber-700 dark:border-amber-700/70 dark:text-amber-300"
                : "border-primary/25 bg-primary/10 text-primary",
          )}
        >
          {index + 1}
        </span>
        {last ? null : (
          <span
            aria-hidden="true"
            className={cn(
              "my-1.5 w-px flex-1 sm:my-0 sm:ml-2 sm:h-px sm:w-auto",
              muted ? "bg-border" : "bg-primary/20",
            )}
          />
        )}
      </div>

      <div
        className={cn(
          "flex min-w-0 items-start gap-2 sm:block sm:pr-3 sm:pt-3",
          last ? "pb-0" : "pb-5 sm:pb-0",
        )}
      >
        <Icon
          className={cn(
            "mt-0.5 size-3.5 shrink-0 sm:hidden",
            muted
              ? "text-muted-foreground/60"
              : last
                ? "text-amber-600 dark:text-amber-400"
                : "text-primary/80",
          )}
          aria-hidden="true"
        />
        <div className="min-w-0">
          <p className="text-xs font-semibold leading-snug">
            <span className="sr-only">
              Step {index + 1} of {STEPS.length}:{" "}
            </span>
            {step.label}
            {step.final ? (
              <span
                className={cn(
                  "ml-1.5 rounded px-1 py-px align-[1px] text-[9.5px] font-semibold uppercase tracking-[0.12em]",
                  muted
                    ? "bg-muted text-muted-foreground"
                    : "bg-amber-500/15 text-amber-700 dark:text-amber-300",
                )}
              >
                Final
              </span>
            ) : null}
          </p>
          <p className="mt-0.5 text-[11px] leading-snug text-muted-foreground">
            {step.hint}
          </p>
        </div>
      </div>
    </li>
  );
}

export function LearningSteps({
  muted = false,
  className,
}: {
  muted?: boolean;
  className?: string;
}) {
  return (
    <ol
      aria-label={`How a track works: ${STEPS.length} steps from the concept note to the timed checkpoint`}
      className={cn(
        "flex flex-col rounded-xl border border-border bg-card p-4 shadow-xs sm:flex-row sm:p-5",
        className,
      )}
    >
      {STEPS.map((step, index) => (
        <StepItem
          key={step.label}
          step={step}
          index={index}
          last={index === STEPS.length - 1}
          muted={muted}
        />
      ))}
    </ol>
  );
}
