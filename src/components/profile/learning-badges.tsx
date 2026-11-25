import Link from "next/link";
import { ArrowUpRight, Award } from "lucide-react";
import { Card } from "@/components/ui/card";
import type { LearningBadge } from "@/lib/learning/types";
import { cn, formatDate } from "@/lib/utils";

export function LearningBadges({
  badges,
  className,
}: {
  badges: LearningBadge[];
  className?: string;
}) {
  // Only completed checkpoints are shown; an empty profile gets no section.
  const earned = badges.filter((badge) => badge.earned);
  if (earned.length === 0) return null;

  return (
    <Card className={cn("overflow-hidden", className)}>
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-5 py-4">
        <div>
          <h2 className="text-sm font-semibold">Learning badges</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Module checkpoints completed in the learning tracks.
          </p>
        </div>
        <span className="font-mono text-xs text-muted-foreground">
          {earned.length}/{badges.length} earned
        </span>
      </div>
      <ul className="grid gap-2 p-3 sm:grid-cols-2 xl:grid-cols-3">
        {earned.map((badge) => (
          <li key={badge.moduleSlug}>
            <Link
              href={badge.href}
              className="group flex h-full items-start gap-3 rounded-lg border border-amber-300/60 bg-amber-500/[0.06] p-3 transition-colors hover:border-amber-400/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring dark:border-amber-700/50"
            >
              <span
                className="grid size-9 shrink-0 place-items-center rounded-full border border-amber-400/70 bg-amber-500/15 text-amber-600 dark:text-amber-300"
                aria-hidden="true"
              >
                <Award className="size-4" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-xs font-semibold">
                  {badge.badgeName}
                </span>
                <span className="mt-0.5 block truncate text-[11px] text-muted-foreground">
                  Track {String(badge.moduleOrder).padStart(2, "0")} ·{" "}
                  {badge.moduleTitle}
                </span>
                <span className="mt-1 block text-[10px] text-muted-foreground">
                  {badge.earnedAt
                    ? `Earned ${formatDate(badge.earnedAt)}`
                    : "Earned"}
                </span>
              </span>
              <ArrowUpRight
                className="mt-0.5 size-3.5 shrink-0 text-muted-foreground/50 transition-colors group-hover:text-primary"
                aria-hidden="true"
              />
            </Link>
          </li>
        ))}
      </ul>
    </Card>
  );
}
