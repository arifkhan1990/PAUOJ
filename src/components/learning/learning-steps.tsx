import { cn } from "@/lib/utils";

const STEPS = [
  { label: "Concept note", hint: "Read the idea" },
  { label: "Guided", hint: "Warm up with support" },
  { label: "Tiered practice", hint: "Easy → medium → hard" },
  { label: "Extra practice", hint: "Try without hints" },
  { label: "Checkpoint", hint: "Timed, 3 problems" },
] as const;

export function LearningSteps({
  muted = false,
  className,
}: {
  muted?: boolean;
  className?: string;
}) {
  return (
    <ol
      aria-label="How a track works"
      className={cn("grid grid-cols-2 gap-2 sm:grid-cols-5", className)}
    >
      {STEPS.map((step, index) => (
        <li
          key={step.label}
          className="flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2"
        >
          <span
            className={cn(
              "grid size-6 shrink-0 place-items-center rounded-full font-mono text-[10px] font-semibold",
              muted
                ? "bg-muted text-muted-foreground"
                : "bg-primary/10 text-primary",
            )}
            aria-hidden="true"
          >
            {index + 1}
          </span>
          <span className="min-w-0">
            <span className="block text-[11px] font-medium leading-tight">
              {step.label}
            </span>
            <span className="mt-0.5 hidden text-[10px] leading-tight text-muted-foreground sm:block">
              {step.hint}
            </span>
          </span>
        </li>
      ))}
    </ol>
  );
}
