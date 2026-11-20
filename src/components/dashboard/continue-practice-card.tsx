import Link from "next/link";
import { Target } from "lucide-react";
import { DashboardPanel } from "@/components/dashboard/dashboard-panel";
import { DifficultyBadge } from "@/components/shared/difficulty-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { buttonVariants } from "@/components/ui/button";
import type { ProfileProblemItem } from "@/lib/profile-types";

export function ContinuePracticeCard({
  problems,
}: {
  problems: ProfileProblemItem[];
}) {
  return (
    <DashboardPanel
      title="Continue practice"
      description="Problems you have started but not solved yet."
      icon={<Target className="size-4" />}
      bodyClassName="px-4 pb-2 pt-1"
      action={
        problems.length > 0 ? (
          <Link
            href="/problems"
            className="text-[11px] font-medium text-primary hover:underline"
          >
            Find more
          </Link>
        ) : null
      }
    >
      {problems.length === 0 ? (
        <EmptyState
          className="border-0 px-0 py-8"
          title="No open attempts"
          description="Pick a fresh problem to keep your streak going."
          icon={Target}
          action={
            <Link href="/problems" className={buttonVariants({ size: "sm" })}>
              Find a problem
            </Link>
          }
        />
      ) : (
        <ul className="divide-y divide-border">
          {problems.map((problem) => (
            <li key={problem.slug} className="py-2.5">
              <div className="flex items-center justify-between gap-3">
                <Link
                  href={`/problems/${problem.slug}`}
                  className="min-w-0 truncate text-[13px] font-medium hover:text-primary"
                >
                  {problem.title}
                </Link>
                <DifficultyBadge difficulty={problem.difficulty} />
              </div>
              <p className="text-[11px] text-muted-foreground">
                {problem.attempts} attempt
                {problem.attempts === 1 ? "" : "s"} · {problem.points} points
              </p>
            </li>
          ))}
        </ul>
      )}
    </DashboardPanel>
  );
}
