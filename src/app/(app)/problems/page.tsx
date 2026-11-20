import Link from "next/link";
import type { Metadata } from "next";
import { ListChecks, Plus } from "lucide-react";
import { ProblemFilters } from "@/components/problems/problem-filters";
import { ProblemTags } from "@/components/problems/problem-tags";
import { DifficultyBadge } from "@/components/shared/difficulty-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { Pagination } from "@/components/shared/pagination";
import { PageHeader } from "@/components/shared/page-header";
import { SolveStatus } from "@/components/shared/solve-status";
import { buttonVariants } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getCurrentUser } from "@/server/auth/session";
import { listProblems } from "@/server/services/problems";
import { listProblemFacets, listProblemTags } from "@/server/services/problem-options";
import { DIFFICULTIES } from "@/lib/difficulty";
import { readPage, firstValue, type SearchParams } from "@/lib/pagination";
import { DEFAULT_PAGE_SIZE } from "@/lib/constants";
import { cn, formatPercent } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Problems",
  description: "Browse programming problems and solve them in your browser.",
};

export const dynamic = "force-dynamic";

export default async function ProblemsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const page = readPage(params);
  const pageSize = DEFAULT_PAGE_SIZE;
  const q = firstValue(params.q)?.trim().slice(0, 100) || undefined;
  const rawDifficulty = firstValue(params.difficulty);
  const difficulty = DIFFICULTIES.find((value) => value === rawDifficulty);
  const tag = firstValue(params.tag)?.slice(0, 60) || undefined;
  const category = firstValue(params.category)?.slice(0, 60) || undefined;
  const subcategory = firstValue(params.subcategory)?.slice(0, 60) || undefined;
  const company = firstValue(params.company)?.slice(0, 40) || undefined;
  const user = await getCurrentUser();

  const [problemPage, tags, facets] = await Promise.all([
    listProblems({
      page: { page, pageSize },
      q,
      difficulty,
      tag,
      category,
      subcategory,
      company,
      userId: user?.id ?? null,
      isAdmin: user?.role === "ADMIN",
    }),
    listProblemTags(user?.id ?? null, user?.role === "ADMIN"),
    listProblemFacets(user?.id ?? null, user?.role === "ADMIN"),
  ]);

  const totalPages = Math.max(1, Math.ceil(problemPage.total / pageSize));

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <PageHeader
        eyebrow="Practice"
        title="Problems"
        description={`${problemPage.total} problem${
          problemPage.total === 1 ? "" : "s"
        } ready for you. Filter by difficulty or tag, then open the editor.`}
        actions={
          user?.role === "ADMIN" ? (
            <Link href="/admin/problems/new" className={buttonVariants()}>
              <Plus className="size-4" /> New problem
            </Link>
          ) : undefined
        }
      />

      <div className="py-6">
        <ProblemFilters
          searchParams={params}
          q={q}
          difficulty={difficulty}
          tag={tag}
          tags={tags}
          category={category}
          subcategory={subcategory}
          company={company}
          facets={facets}
        />
      </div>

      {problemPage.items.length === 0 ? (
        <EmptyState
          title="No problems match those filters"
          description="Try a different search term, difficulty or tag."
          icon={ListChecks}
          action={
            <Link href="/problems" className={buttonVariants({ variant: "outline" })}>
              Clear filters
            </Link>
          }
        />
      ) : (
        <>
          <div className="rounded-lg border border-border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">
                    <span className="sr-only">Status</span>
                  </TableHead>
                  <TableHead>Problem</TableHead>
                  <TableHead className="hidden md:table-cell">Tags</TableHead>
                  <TableHead>Difficulty</TableHead>
                  <TableHead className="hidden text-right sm:table-cell">
                    Acceptance
                  </TableHead>
                  <TableHead className="text-right">Points</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {problemPage.items.map((problem) => {
                  const acceptance =
                    problem.submissionCount > 0
                      ? (problem.acceptedCount / problem.submissionCount) * 100
                      : 0;
                  return (
                    <TableRow key={problem.id}>
                      <TableCell>
                        <SolveStatus
                          solved={problem.solvedByMe}
                          attempted={problem.attemptedByMe}
                        />
                      </TableCell>
                      <TableCell className="max-w-[320px]">
                        <Link
                          href={`/problems/${problem.slug}`}
                          className="text-sm font-medium hover:text-primary"
                        >
                          {problem.title}
                        </Link>
                        <p className="mt-0.5 font-mono text-[11px] text-muted-foreground">
                          {problem.slug}
                        </p>
                        <ProblemTags
                          tags={problem.tags}
                          limit={3}
                          className="mt-1.5 md:hidden"
                        />
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <ProblemTags tags={problem.tags} limit={3} />
                      </TableCell>
                      <TableCell>
                        <DifficultyBadge difficulty={problem.difficulty} />
                      </TableCell>
                      <TableCell className="hidden text-right font-mono text-xs tabular-nums sm:table-cell">
                        <span
                          className={cn(
                            acceptance >= 50
                              ? "text-emerald-600 dark:text-emerald-400"
                              : acceptance > 0
                                ? "text-amber-600 dark:text-amber-400"
                                : "text-muted-foreground",
                          )}
                        >
                          {formatPercent(acceptance)}
                        </span>
                        <span className="ml-1 text-muted-foreground">
                          ({problem.acceptedCount}/{problem.submissionCount})
                        </span>
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm font-medium tabular-nums">
                        {problem.points}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
          <Pagination
            pathname="/problems"
            searchParams={params}
            page={page}
            totalPages={totalPages}
          />
        </>
      )}
    </div>
  );
}
