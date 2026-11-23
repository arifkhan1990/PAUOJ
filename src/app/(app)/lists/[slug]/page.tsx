import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight, ListChecks } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";
import { NextProblemStrip } from "@/components/study-plans/next-problem-strip";
import {
  PlanSectionCard,
  PlanSectionChips,
  PlanSectionRail,
} from "@/components/study-plans/plan-sections";
import { StudyPlanHeader } from "@/components/study-plans/study-plan-header";
import { buttonVariants } from "@/components/ui/button";
import { getCurrentUser } from "@/server/auth/session";
import { getStudyList } from "@/server/services/study-lists";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

function metaDescription(description: string): string {
  const compact = description.replace(/\s+/g, " ").trim();
  return compact.length > 160 ? `${compact.slice(0, 157)}…` : compact;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const user = await getCurrentUser();
  const plan = await getStudyList(slug, user);
  if (!plan) return { title: "Study plan" };
  return {
    title: `${plan.title} · Study plans`,
    description: metaDescription(plan.description),
  };
}

export default async function StudyListPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const user = await getCurrentUser();
  const plan = await getStudyList(slug, user);
  if (!plan) notFound();

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
      <nav aria-label="Breadcrumb">
        <ol className="flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground">
          <li className="shrink-0">
            <Link
              href="/lists"
              className="inline-flex min-h-11 items-center rounded-sm transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background lg:min-h-0"
            >
              Study plans
            </Link>
          </li>
          <li aria-hidden="true" className="shrink-0">
            <ChevronRight className="size-3.5" />
          </li>
          <li className="min-w-0">
            <span aria-current="page" className="block truncate text-foreground">
              {plan.title}
            </span>
          </li>
        </ol>
      </nav>

      <StudyPlanHeader plan={plan} signedIn={Boolean(user)} className="mt-4" />

      {plan.sections.length === 0 ? (
        <EmptyState
          className="mt-8"
          icon={ListChecks}
          title="This plan has no problems yet"
          description="An admin is still filling in the sections. Check back soon, or browse another plan."
          action={
            <Link href="/lists" className={buttonVariants({ variant: "outline" })}>
              Browse other plans
            </Link>
          }
        />
      ) : (
        <div
          className={cn(
            "mt-6",
            plan.sections.length >= 2 &&
              "lg:grid lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-start lg:gap-6",
          )}
        >
          <div id="plan-sections" className="min-w-0 scroll-mt-24">
            {plan.completed ? null : (
              <NextProblemStrip nextProblem={plan.nextProblem} />
            )}

            <PlanSectionChips sections={plan.sections} className="mt-4" />

            <div className="mt-4 space-y-4">
              {plan.sections.map((section, index) => (
                <PlanSectionCard
                  key={section.id ?? "general"}
                  section={section}
                  index={index}
                  signedIn={Boolean(user)}
                  planSlug={plan.slug}
                />
              ))}
            </div>
          </div>

          {plan.sections.length >= 2 ? (
            <PlanSectionRail sections={plan.sections} />
          ) : null}
        </div>
      )}
    </div>
  );
}
