import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  Compass,
  FileCode2,
  Layers3,
  ListChecks,
  Sparkles,
  Tag,
} from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { StudyListSummary } from "@/lib/study-list-types";
import { cn } from "@/lib/utils";

type CatalogStat = {
  label: string;
  value: number;
  hint: string;
  icon: LucideIcon;
};

function catalogStats(plans: readonly StudyListSummary[]): CatalogStat[] {
  const problemCount = plans.reduce((sum, plan) => sum + plan.problemCount, 0);
  const topicCount = new Set(
    plans.flatMap((plan) => plan.topics.map((topic) => topic.toLowerCase())),
  ).size;
  const levelCount = new Set(plans.map((plan) => plan.level)).size;

  return [
    {
      label: "Published plans",
      value: plans.length,
      hint: "Public and ready to start",
      icon: ListChecks,
    },
    {
      label: "Problems",
      value: problemCount,
      hint: "Across every plan",
      icon: FileCode2,
    },
    {
      label: "Topic tags",
      value: topicCount,
      hint: "Common tags across plans",
      icon: Tag,
    },
    {
      label: "Levels",
      value: levelCount,
      hint: "Beginner to advanced",
      icon: Layers3,
    },
  ];
}

export function CatalogHero({ showCatalogLink = true }: { showCatalogLink?: boolean }) {
  return (
    <section
      aria-labelledby="study-plans-title"
      className="relative overflow-hidden rounded-xl border border-border bg-card"
    >
      <div
        className="grid-pattern pointer-events-none absolute inset-0 opacity-30 [mask-image:radial-gradient(ellipse_75%_65%_at_50%_0%,black,transparent)]"
        aria-hidden="true"
      />
      <div
        className="hero-glow pointer-events-none absolute inset-0"
        aria-hidden="true"
      />
      <div className="relative px-5 py-8 sm:px-8 sm:py-10 lg:px-10">
        <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">
          <Compass className="size-3.5" aria-hidden="true" />
          Curated practice
        </p>
        <h1
          id="study-plans-title"
          className="mt-3 text-3xl font-semibold tracking-tight text-balance sm:text-4xl"
        >
          Study plans
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
          Ordered problem sets with sections, a level and an estimated duration.
          Follow one end to end, or jump to the section you need.
        </p>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
          <Link
            href="/problems"
            className={cn(buttonVariants({ size: "lg" }), "w-full sm:w-auto")}
          >
            <Sparkles className="size-4" aria-hidden="true" />
            Browse all problems
          </Link>
          {showCatalogLink ? (
            <a
              href="#catalog-plans-title"
              className={cn(
                buttonVariants({ variant: "outline", size: "lg" }),
                "w-full sm:w-auto",
              )}
            >
              See every plan
            </a>
          ) : null}
        </div>
      </div>
    </section>
  );
}

export function CatalogStats({ plans }: { plans: StudyListSummary[] }) {
  const stats = catalogStats(plans);

  return (
    <Card className="mt-6 overflow-hidden p-0">
      <dl className="grid grid-cols-2 gap-px bg-border md:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="bg-card px-4 py-4 sm:px-5">
              <dt className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                <Icon className="size-3.5 shrink-0" aria-hidden="true" />
                {stat.label}
              </dt>
              <dd className="mt-1.5 text-2xl font-semibold tabular-nums">
                {stat.value}
                <span className="mt-0.5 block text-xs font-normal leading-snug text-muted-foreground">
                  {stat.hint}
                </span>
              </dd>
            </div>
          );
        })}
      </dl>
    </Card>
  );
}
