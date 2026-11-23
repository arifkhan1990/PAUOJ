import type { Metadata } from "next";
import Link from "next/link";
import { ListChecks } from "lucide-react";
import { CatalogBrowser } from "@/components/study-plans/catalog-browser";
import { CatalogHero, CatalogStats } from "@/components/study-plans/catalog-hero";
import { StudyPlanCard } from "@/components/study-plans/study-plan-card";
import { EmptyState } from "@/components/shared/empty-state";
import { buttonVariants } from "@/components/ui/button";
import { getCurrentUser } from "@/server/auth/session";
import { listStudyLists } from "@/server/services/study-lists";

export const metadata: Metadata = {
  title: "Study plans",
  description:
    "Curated problem sets with sections, levels and estimated durations. Track progress and continue with the next unsolved problem.",
};

export const dynamic = "force-dynamic";

export default async function StudyListsPage() {
  const user = await getCurrentUser();
  const plans = await listStudyLists(user);
  const myPlans = user ? plans.filter((plan) => plan.enrolled) : [];

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <CatalogHero showCatalogLink={plans.length > 0} />

      {plans.length === 0 ? (
        <EmptyState
          className="mt-6"
          title="No study plans yet"
          description="Curated plans will appear here once an admin publishes one. In the meantime, the problem archive is open."
          icon={ListChecks}
          action={
            <Link href="/problems" className={buttonVariants()}>
              Browse problems
            </Link>
          }
        />
      ) : (
        <>
          <CatalogStats plans={plans} />

          {myPlans.length > 0 ? (
            <section aria-labelledby="my-plans-title" className="mt-10">
              <div className="flex flex-col gap-1 border-b border-border pb-3">
                <p className="font-mono text-[10.5px] font-medium uppercase tracking-[0.2em] text-primary">
                  In progress
                </p>
                <h2
                  id="my-plans-title"
                  className="text-xl font-semibold tracking-tight sm:text-2xl"
                >
                  My plans
                </h2>
                <p className="text-sm text-muted-foreground">
                  Pick up where you left off.
                </p>
              </div>
              <ul
                role="list"
                className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3"
              >
                {myPlans.map((plan) => (
                  <li key={plan.id}>
                    <StudyPlanCard plan={plan} signedIn compact />
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          <CatalogBrowser plans={plans} signedIn={Boolean(user)} />
        </>
      )}
    </div>
  );
}
