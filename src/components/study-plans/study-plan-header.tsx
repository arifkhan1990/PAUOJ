import { Clock3, FileCode2, Layers3, Sparkles } from "lucide-react";
import { DifficultySplit } from "@/components/study-plans/difficulty-split";
import { PlanActions } from "@/components/study-plans/plan-actions";
import { StudyProgress } from "@/components/study-plans/study-progress";
import { TopicChips } from "@/components/study-plans/topic-chips";
import { Badge } from "@/components/ui/badge";
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
      <div className="grid gap-6 p-5 sm:p-6 lg:grid-cols-[minmax(0,1fr)_19rem]">
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
            {plan.enrolled ? (
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

          <div className="mt-5 max-w-md border-t border-border pt-4">
            <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              Difficulty mix
            </p>
            <DifficultySplit counts={plan.difficultyCounts} className="mt-2" />
          </div>
        </div>

        <div className="rounded-lg border border-border bg-muted/30 p-4">
          <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            Your progress
          </p>
          <p className="mt-2 font-mono text-3xl font-semibold tabular-nums">
            {percent}
            <span className="text-lg font-normal text-muted-foreground">%</span>
          </p>
          <StudyProgress
            className="mt-2"
            solved={plan.solvedCount}
            total={plan.problemCount}
            percent={percent}
            muted={!signedIn}
            label={`${plan.title}: ${plan.solvedCount} of ${plan.problemCount} problems solved`}
          />
          <dl className="mt-3 grid grid-cols-2 gap-2 border-t border-border pt-3 text-xs">
            <div>
              <dt className="text-muted-foreground">Solved</dt>
              <dd className="mt-0.5 font-medium tabular-nums">
                {plan.solvedCount} of {plan.problemCount}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Attempted</dt>
              <dd className="mt-0.5 font-medium tabular-nums">
                {plan.attemptedCount}
              </dd>
            </div>
          </dl>
          <PlanActions
            slug={plan.slug}
            signedIn={signedIn}
            enrolled={plan.enrolled}
            completed={plan.completed}
          />
        </div>
      </div>
    </Card>
  );
}
