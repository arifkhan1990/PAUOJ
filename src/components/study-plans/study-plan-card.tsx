import Link from "next/link";
import type { ReactNode } from "react";
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
  Star,
  UserRoundCheck,
} from "lucide-react";
import { DifficultyMix } from "@/components/study-plans/difficulty-mix";
import { StudyPlanCardProgress } from "@/components/study-plans/study-plan-card-progress";
import { TopicChips } from "@/components/study-plans/topic-chips";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  formatStudyDuration,
  studyListLevelMeta,
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

function StatusLabel({
  icon: Icon,
  iconClassName,
  children,
}: {
  icon: typeof Lock;
  iconClassName?: string;
  children: ReactNode;
}) {
  return (
    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground">
      <Icon className={cn("size-3.5", iconClassName)} aria-hidden="true" />
      {children}
    </span>
  );
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
  const cta = planCta(plan);
  const CtaIcon = cta.icon;

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
    <Card
      className={cn(
        "group relative flex h-full flex-col overflow-hidden rounded-xl transition-[translate,border-color,box-shadow] duration-200 ease-out",
        "hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md",
        "focus-within:-translate-y-0.5 focus-within:border-primary/30 focus-within:shadow-md",
        "motion-reduce:translate-none motion-reduce:transition-none",
      )}
    >
      {plan.isFeatured ? (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-primary/0 via-primary/70 to-primary/0"
        />
      ) : null}

      <div className="flex items-start justify-between gap-3 px-5 pt-4">
        <div className="flex min-w-0 flex-wrap items-center gap-x-2.5 gap-y-1.5">
          <span className="inline-flex items-center rounded-md border border-border/80 bg-background/40 px-1.5 py-0.5 font-mono text-[10.5px] font-medium uppercase tracking-wide text-muted-foreground">
            {level.label}
          </span>
          {plan.isFeatured ? (
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-accent">
              <Star className="size-3 fill-current" aria-hidden="true" />
              Featured
            </span>
          ) : null}
          {plan.isPublic ? null : (
            <StatusLabel icon={Lock}>Private</StatusLabel>
          )}
          {plan.isOwned ? (
            <StatusLabel icon={UserRoundCheck}>Your plan</StatusLabel>
          ) : null}
          {plan.enrolled ? (
            <StatusLabel icon={CheckCircle2} iconClassName="text-success">
              Enrolled
            </StatusLabel>
          ) : null}
        </div>
        {plan.isOwned ? (
          <Link
            href={`/lists/${plan.slug}/edit`}
            className={cn(
              buttonVariants({ variant: "ghost", size: "sm" }),
              "-my-1 shrink-0 min-h-11 lg:min-h-8",
            )}
          >
            <Pencil aria-hidden="true" />
            Edit
            <span className="sr-only"> — {plan.title}</span>
          </Link>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col px-5 pb-4 pt-3">
        <h3 className="break-words text-base font-semibold leading-snug tracking-tight">
          <Link
            href={`/lists/${plan.slug}`}
            className="flex min-h-11 items-center rounded-sm transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background lg:min-h-6"
          >
            {plan.title}
          </Link>
        </h3>

        {compact ? null : (
          <p className="mt-1 line-clamp-2 break-words text-sm leading-relaxed text-muted-foreground">
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
          plan.enrolled && plan.nextProblem ? (
            <p className="mt-3 truncate text-[11px] text-muted-foreground">
              <span className="font-medium text-foreground">Next:</span>{" "}
              {plan.nextProblem.title}
            </p>
          ) : null
        ) : (
          <>
            <TopicChips topics={plan.topics} limit={3} className="mt-3" />
            <DifficultyMix counts={plan.difficultyCounts} className="mt-2.5" />
          </>
        )}
      </div>

      <div className="mt-auto border-t border-border bg-muted/20 px-5 py-4">
        <StudyPlanCardProgress
          solved={plan.solvedCount}
          total={plan.problemCount}
          signedIn={signedIn}
        />
        <div className="mt-3">{ctaLink}</div>
      </div>
    </Card>
  );
}
