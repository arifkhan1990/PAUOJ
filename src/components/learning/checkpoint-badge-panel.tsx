import { Award, Check, LockKeyhole } from "lucide-react";
import type { LearningCheckpointDefinition } from "@/lib/learning/types";
import { cn, formatDate } from "@/lib/utils";

export function CheckpointBadgePanel({
  badge,
  earned,
  completedAt,
}: {
  badge: LearningCheckpointDefinition["badge"];
  earned: boolean;
  completedAt?: string | null;
}) {
  return (
    <div
      className={cn(
        "flex items-start gap-4 rounded-xl border p-4",
        earned
          ? "border-amber-300/80 bg-amber-500/[0.07] dark:border-amber-700/60 dark:bg-amber-500/[0.06]"
          : "border-dashed border-border bg-muted/20",
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          "grid size-14 shrink-0 place-items-center rounded-full border-2 shadow-xs",
          earned
            ? "border-amber-400/80 bg-amber-500/15 text-amber-700 dark:text-amber-300"
            : "border-border bg-background text-muted-foreground/70",
        )}
      >
        <Award className="size-7" />
      </span>
      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          {earned ? "Module badge earned" : "Badge preview"}
        </p>
        <p className="mt-1 text-base font-semibold leading-snug">{badge.name}</p>
        <p lang="bn" className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
          {badge.description}
        </p>
        <p className="mt-2 inline-flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
          {earned ? (
            <>
              <Check
                className="size-3.5 text-amber-600 dark:text-amber-400"
                aria-hidden="true"
              />
              {completedAt
                ? `Earned on ${formatDate(completedAt)}`
                : "Earned by clearing the checkpoint"}
            </>
          ) : (
            <>
              <LockKeyhole className="size-3.5" aria-hidden="true" />
              Clear the checkpoint inside the time window to unlock it
            </>
          )}
        </p>
      </div>
    </div>
  );
}
