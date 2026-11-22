import { Award } from "lucide-react";
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
          ? "border-amber-300/70 bg-amber-500/[0.06] dark:border-amber-700/60"
          : "border-dashed border-border bg-muted/30",
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          "grid size-14 shrink-0 place-items-center rounded-full border-[3px]",
          earned
            ? "border-amber-400/70 bg-amber-500/15 text-amber-600 dark:text-amber-300"
            : "border-border bg-muted text-muted-foreground",
        )}
      >
        <Award className="size-7" />
      </span>
      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          {earned ? "Module badge earned" : "Module badge"}
        </p>
        <p className="mt-0.5 text-base font-semibold">{badge.name}</p>
        <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
          {badge.description}
        </p>
        <p className="mt-2 text-[11px] text-muted-foreground">
          {earned && completedAt
            ? `Earned on ${formatDate(completedAt)}`
            : "Complete the checkpoint to unlock this badge."}
        </p>
      </div>
    </div>
  );
}
