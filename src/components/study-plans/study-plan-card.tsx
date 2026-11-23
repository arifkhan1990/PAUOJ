import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  Clock3,
  FileCode2,
  Layers3,
  Lock,
  Pencil,
  Play,
  RotateCcw,
  Sparkles,
  UserRoundCheck,
} from "lucide-react";
import { DifficultyMix } from "@/components/study-plans/difficulty-mix";
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
import type { StudyListSummary } from "@/lib/study-list-types";
import { cn } from "@/lib/utils";

type PlanCta = {
  href: string;
  label: string;
  icon: typeof Play;
  variant: "default" | "outline";
};

function planCta(plan: StudyListSummary): PlanCta {
  if (plan.completed) {
    return {
      href: `/lists/${plan.slug}`,
      label: "Review plan",
      icon: RotateCcw,
      variant: "outline",
    };
  }
  if (plan.nextProblem && plan.solvedCount > 0) {
    return {
      href: `/problems/${plan.nextProblem.slug}`,
      label: "Continue",
      icon: ArrowRight,
      variant: "default",
    };
  }
  return {
    href: `/lists/${plan.slug}`,
    label: "Start plan",
    icon: Play,
    variant: "default",
  };
}

export function StudyPlanCard({
  plan,
  signedIn,
  compact = false,
}: {
  plan: StudyListSummary;
  signedIn: boolean;
  /** Denser layout for the "My plans" section: progress first, no description. */
  compact?: boolean;
}) {
  const level = studyListLevelMeta(plan.level);
  const percent = studyProgressPercent(plan.solvedCount, plan.problemCount);
  const cta = planCta(plan);
  const CtaIcon = cta.icon;

  const progress = (
    <div className="flex items-center gap-3">
      <PlanProgressRing
        size="md"
        percent={signedIn ? percent : 0}
        solved={signedIn ? plan.solvedCount : 0}
        total={plan.problemCount}
        label={
          signedIn
            ? `${plan.title}: ${plan.solvedCount} of ${plan.problemCount} problems solved`
            : "Sign in to track progress"
        }
      />
      <p className="min-w-0 text-xs font-medium text-foreground/80">
        {signedIn
          ? `${plan.solvedCount} of ${plan.problemCount} solved`
          : "Sign in to track progress"}
      </p>
    </div>
  );

  const ctaLink = (
    <Link
      href={cta.href}
      className={cn(buttonVariants({ size: "lg", variant: cta.variant }), "w-full")}
    >
      <CtaIcon aria-hidden="true" />
      {cta.label}
      <span className="sr-only"> — {plan.title}</span>
    </Link>
  );

  return (
    <Card className="flex h-full flex-col overflow-hidden">
      <div className="flex flex-wrap items-center gap-1.5 border-b border-border bg-muted/20 px-4 py-2.5">
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
        {plan.isOwned ? (
          <Badge variant="accent">
            <UserRoundCheck className="size-3" aria-hidden="true" />
            Your plan
          </Badge>
        ) : null}
        {plan.enrolled ? (
          <Badge variant="success">
            <CheckCircle2 className="size-3" aria-hidden="true" />
            Enrolled
          </Badge>
        ) : null}
        {plan.isOwned ? (
          <Link
            href={`/lists/${plan.slug}/edit`}
            className={cn(
              buttonVariants({ variant: "ghost", size: "sm" }),
              "ml-auto min-h-11 lg:min-h-8",
            )}
          >
            <Pencil aria-hidden="true" />
            Edit
            <span className="sr-only"> — {plan.title}</span>
          </Link>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col p-4 sm:p-5">
        <h3 className="break-words text-base font-semibold leading-snug">
          <Link
            href={`/lists/${plan.slug}`}
            className="flex min-h-11 items-center rounded-sm transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background lg:min-h-0"
          >
            {plan.title}
          </Link>
        </h3>

        {compact ? null : (
          <p className="mt-1.5 line-clamp-2 break-words text-sm leading-relaxed text-muted-foreground">
            {plan.description}
          </p>
        )}

        <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <FileCode2 className="size-3.5" aria-hidden="true" />
            {plan.problemCount} problems
          </span>
          <span className="inline-flex items-center gap-1">
            <Layers3 className="size-3.5" aria-hidden="true" />
            {plan.sectionCount} sections
          </span>
          <span className="inline-flex items-center gap-1">
            <Clock3 className="size-3.5" aria-hidden="true" />
            {formatStudyDuration(plan.durationMinutes)}
          </span>
        </div>

        {compact ? (
          <>
            <div className="mt-4">{progress}</div>
            {plan.nextProblem && plan.enrolled ? (
              <p className="mt-2 truncate text-[11px] text-muted-foreground">
                <span className="font-medium text-foreground">Next:</span>{" "}
                {plan.nextProblem.title}
              </p>
            ) : null}
            <div className="mt-auto pt-4">{ctaLink}</div>
          </>
        ) : (
          <>
            <TopicChips topics={plan.topics} className="mt-3" />
            <div className="mt-auto space-y-3 pt-4">
              <DifficultyMix counts={plan.difficultyCounts} />
              {progress}
              {ctaLink}
            </div>
          </>
        )}
      </div>
    </Card>
  );
}
