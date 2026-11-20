import type { Metadata } from "next";
import Link from "next/link";
import { ListChecks, Sparkles } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getCurrentUser } from "@/server/auth/session";
import { listStudyLists } from "@/server/services/study-lists";
import { cn, formatPercent } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Study plans",
  description: "Curated problem lists for structured practice.",
};

export const dynamic = "force-dynamic";

export default async function StudyListsPage() {
  const user = await getCurrentUser();
  const lists = await listStudyLists(user);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <PageHeader
        eyebrow="Curated practice"
        title="Study plans"
        description="Follow an ordered problem set and track how many you have solved."
        actions={
          <Link href="/problems" className={buttonVariants()}>
            <Sparkles className="size-4" /> All problems
          </Link>
        }
      />

      {lists.length === 0 ? (
        <EmptyState
          className="mt-6"
          title="No study plans yet"
          description="Curated lists will appear here when an admin publishes one."
          icon={ListChecks}
          action={
            <Link href="/problems" className={buttonVariants()}>
              Browse problems
            </Link>
          }
        />
      ) : (
        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {lists.map((list) => {
            const progress =
              list.problemCount > 0
                ? (list.solvedCount / list.problemCount) * 100
                : 0;
            return (
              <Card key={list.id} className="flex flex-col p-5">
                <div className="flex items-start justify-between gap-2">
                  <h2 className="text-base font-semibold">
                    <Link
                      href={`/lists/${list.slug}`}
                      className="hover:text-primary"
                    >
                      {list.title}
                    </Link>
                  </h2>
                  <span className="rounded border border-border bg-muted/60 px-2 py-0.5 font-mono text-[11px]">
                    {list.problemCount} problems
                  </span>
                </div>
                <p className="mt-2 line-clamp-3 flex-1 text-xs leading-relaxed text-muted-foreground">
                  {list.description}
                </p>
                <div className="mt-4">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">
                      {list.solvedCount} solved
                    </span>
                    <span className="font-mono">{formatPercent(progress, 0)}</span>
                  </div>
                  <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${Math.min(100, progress)}%` }}
                    />
                  </div>
                </div>
                <Link
                  href={`/lists/${list.slug}`}
                  className={cn(
                    buttonVariants({ size: "sm", variant: "outline" }),
                    "mt-4",
                  )}
                >
                  Open plan
                </Link>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
