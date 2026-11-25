import { Medal } from "lucide-react";
import { cn } from "@/lib/utils";

/** Row `rank` is always global, so badge colours reflect the real top three. */
function rankBadgeClass(rank: number): string {
  if (rank === 1) {
    return "border-amber-400 bg-amber-50 text-amber-900 dark:border-amber-600 dark:bg-amber-950 dark:text-amber-100";
  }
  if (rank === 2) {
    return "border-slate-300 bg-slate-100 text-slate-700 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200";
  }
  if (rank === 3) {
    return "border-orange-300 bg-orange-50 text-orange-900 dark:border-orange-700 dark:bg-orange-950 dark:text-orange-100";
  }
  return "border-border bg-background text-muted-foreground";
}

export function RankBadge({
  rank,
  size = "sm",
}: {
  rank: number;
  size?: "sm" | "md";
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center gap-1 rounded-full border font-semibold tabular-nums",
        rankBadgeClass(rank),
        size === "md" ? "h-9 min-w-9 px-2 text-sm" : "h-7 min-w-7 px-1.5 text-xs",
      )}
    >
      {rank <= 3 ? <Medal aria-hidden="true" className="size-3" /> : null}
      {rank}
    </span>
  );
}

export function YouPill() {
  return (
    <span className="rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-semibold text-primary-foreground">
      You
    </span>
  );
}
