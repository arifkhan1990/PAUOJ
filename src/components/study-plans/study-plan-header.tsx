import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  Clock3,
  FileCode2,
  Layers3,
  Lock,
  Pencil,
  Sparkles,
} from "lucide-react";
import { DifficultyMix } from "@/components/study-plans/difficulty-mix";
import { PlanActions } from "@/components/study-plans/plan-actions";
import { PlanProgressRing } from "@/components/study-plans/plan-progress-ring";
import { TopicChips } from "@/components/study-plans/topic-chips";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  formatStudyDuration,
  studyListLevelMeta,
  studyProgressPercent,
} from "@/lib/study-list";
import type { StudyListDetail } from "@/lib/study-list-types";
import { cn } from "@/lib/utils";

export function StudyPlanHeader({
  plan,
  signedIn,
  className,
}: {
  plan: StudyListDetail;
  signedIn: boolean;
  className?: string;
}) {
  const level = studyListLevelMeta(plan.level);
  const percent = studyProgressPercent(plan.solvedCount, plan.problemCount);

  return (
    <Card className={cn("overflow-hidden", className)}>
      <div className="grid gap-6 p-5 sm:p-6 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start lg:gap-8">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge
              variant="outline"
              className="font-mono text-[10.5px] uppercase tracking-wide"
            >
              {level.label}
            </Badge>
            {plan.isFeatured ? (
              <Badge variant="warning">
                <Sparkles className="size-3" aria-hidden="true" />
                Featured
              </Badge>
            ) : null}
            {plan.isPublic ? null : (
              <Badge variant="outline">
                <Lock className="size-3" aria-hidden="true" />
                Private
              </Badge>
            )}
            {plan.completed ? (
              <Badge variant="success">
                <CheckCircle2 className="size-3" aria-hidden="true" />
                Completed
              </Badge>
            ) : plan.enrolled ? (
              <Badge variant="muted">
                <span
                  className="size-1.5 rounded-full bg-emerald-600 dark:bg-emerald-300"
                  aria-hidden="true"
                />
                Enrolled
              </Badge>
            ) : null}
          </div>

          <h1 className="mt-3 break-words text-2xl font-semibold tracking-tight text-balance sm:text-3xl">
            {plan.title}
          </h1>
          <p className="mt-2 max-w-2xl whitespace-pre-line break-words text-sm leading-relaxed text-muted-foreground">
            {plan.description}
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <FileCode2 className="size-4" aria-hidden="true" />
              {plan.problemCount} problems
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Layers3 className="size-4" aria-hidden="true" />
              {plan.sectionCount} sections
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Clock3 className="size-4" aria-hidden="true" />
              {formatStudyDuration(plan.durationMinutes)}
            </span>
          </div>

          <TopicChips topics={plan.topics} className="mt-4" />

          <div className="mt-5 max-w-sm">
            <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
              Difficulty mix
            </p>
            <DifficultyMix counts={plan.difficultyCounts} className="mt-2" />
          </div>
        </div>

        <div className="rounded-xl border border-border bg-muted/20 p-4 sm:p-5">
          <div className="flex items-center gap-4">
            <PlanProgressRing
              size="lg"
              percent={percent}
              solved={plan.solvedCount}
              total={plan.problemCount}
              label={`${plan.title}: ${plan.solvedCount} of ${plan.problemCount} problems solved`}
            />
            <div className="min-w-0">
              <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                Your progress
              </p>
              <p className="mt-2 text-sm font-medium tabular-nums">
                {plan.solvedCount} of {plan.problemCount} solved
              </p>
              {plan.completed ? null : (
                <p className="mt-1 text-xs text-muted-foreground">
                  {plan.solvedCount > 0 || plan.attemptedCount > 0
                    ? "Keep going"
                    : "Not started"}
                </p>
              )}
            </div>
          </div>

          <dl className="mt-4 grid grid-cols-2 gap-3 border-t border-border pt-3 text-xs">
            <div>
              <dt className="text-muted-foreground">Attempted</dt>
              <dd className="mt-0.5 font-medium tabular-nums">
                {plan.attemptedCount}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Remaining</dt>
              <dd className="mt-0.5 font-medium tabular-nums">
                {Math.max(plan.problemCount - plan.solvedCount, 0)}
              </dd>
            </div>
          </dl>

          {signedIn &&
          plan.enrolled &&
          !plan.completed &&
          plan.nextProblem ? (
            <Link
              href={`/problems/${plan.nextProblem.slug}`}
              className={cn(
                buttonVariants({ size: "lg" }),
                "mt-4 w-full",
              )}
            >
              Continue
              <ArrowRight aria-hidden="true" />
              <span className="sr-only"> — {plan.nextProblem.title}</span>
            </Link>
          ) : null}

          {plan.isPublic ? (
            <PlanActions
              slug={plan.slug}
              signedIn={signedIn}
              enrolled={plan.enrolled}
              completed={plan.completed}
            />
          ) : null}
          {plan.isOwned ? (
            <Link
              href={`/lists/${plan.slug}/edit`}
              className={cn(
                buttonVariants({ variant: "outline", size: "lg" }),
                "mt-4 w-full",
              )}
            >
              <Pencil aria-hidden="true" />
              Edit plan
            </Link>
          ) : null}
        </div>
      </div>
    </Card>
  );
}
