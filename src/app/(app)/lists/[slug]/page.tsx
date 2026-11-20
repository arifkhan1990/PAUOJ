import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CheckCircle2, Circle } from "lucide-react";
import { DifficultyBadge } from "@/components/shared/difficulty-badge";
import { PageHeader } from "@/components/shared/page-header";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getCurrentUser } from "@/server/auth/session";
import { getStudyList } from "@/server/services/study-lists";
import { cn, formatPercent } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  return { title: `Study plan · ${slug}` };
}

export default async function StudyListPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const user = await getCurrentUser();
  const list = await getStudyList(slug, user);
  if (!list) notFound();
  const progress =
    list.problemCount > 0 ? (list.solvedCount / list.problemCount) * 100 : 0;

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <PageHeader
        eyebrow="Study plan"
        title={list.title}
        description={list.description}
        actions={
          <Link href="/lists" className={buttonVariants({ variant: "outline" })}>
            <ArrowLeft className="size-4" /> All plans
          </Link>
        }
      />

      <Card className="mt-5 p-5">
        <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
          <span className="font-medium">
            {list.solvedCount} of {list.problemCount} solved
          </span>
          <span className="font-mono text-xs text-muted-foreground">
            {formatPercent(progress, 0)}
          </span>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary"
            style={{ width: `${Math.min(100, progress)}%` }}
          />
        </div>
      </Card>

      <Card className="mt-4 overflow-hidden">
        <ul className="divide-y divide-border">
          {list.problems.map((problem) => (
            <li key={problem.slug}>
              <Link
                href={`/problems/${problem.slug}`}
                className="flex items-center gap-3 px-5 py-3.5 transition-colors hover:bg-muted/40"
              >
                <span className="w-6 shrink-0 text-center font-mono text-xs text-muted-foreground">
                  {problem.position}
                </span>
                {problem.solved ? (
                  <CheckCircle2 className="size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                ) : (
                  <Circle className="size-4 shrink-0 text-muted-foreground/50" />
                )}
                <div className="min-w-0 flex-1">
                  <p
                    className={cn(
                      "truncate text-sm font-medium",
                      problem.solved && "text-muted-foreground",
                    )}
                  >
                    {problem.title}
                  </p>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                    <DifficultyBadge difficulty={problem.difficulty} />
                    <span className="font-mono">{problem.points} pts</span>
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
