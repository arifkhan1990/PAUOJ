import type { Metadata } from "next";
import Link from "next/link";
import { Sparkles, Trophy } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";
import { Pagination } from "@/components/shared/pagination";
import { PageHeader } from "@/components/shared/page-header";
import { RankTable } from "@/components/rank/rank-table";
import { UserAvatar } from "@/components/shared/user-avatar";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { listRank } from "@/server/services/rank";
import { readPage, type SearchParams } from "@/lib/pagination";
import { DEFAULT_PAGE_SIZE } from "@/lib/constants";
import { cn, formatPercent } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Ranking",
  description: "Top programmers on the PrimeAsia University Online Judge.",
};

export const dynamic = "force-dynamic";

const podiumStyles = [
  "border-amber-300 bg-amber-50/60 dark:border-amber-800 dark:bg-amber-950/30",
  "border-slate-300 bg-slate-50/60 dark:border-slate-700 dark:bg-slate-900/40",
  "border-orange-300 bg-orange-50/60 dark:border-orange-800 dark:bg-orange-950/30",
];

export default async function RankPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const page = readPage(params);
  const pageSize = DEFAULT_PAGE_SIZE;
  const { items, total } = await listRank({ page, pageSize });
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const podium = page === 1 ? items.slice(0, 3) : [];

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <PageHeader
        eyebrow="Leaderboard"
        title="Ranking"
        description="Every accepted problem earns points once. Rank is based on total points, then number of solved problems."
        actions={
          <Link href="/problems" className={buttonVariants()}>
            <Sparkles className="size-4" /> Solve a problem
          </Link>
        }
      />

      {podium.length === 3 ? (
        <div className="mt-8 grid gap-3 sm:grid-cols-3">
          {podium.map((row, index) => (
            <Card
              key={row.username}
              className={cn("p-5", podiumStyles[index])}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Rank #{row.rank}
                </span>
                <Trophy
                  className={cn(
                    "size-4",
                    index === 0
                      ? "text-amber-500"
                      : index === 1
                        ? "text-slate-500"
                        : "text-orange-600",
                  )}
                />
              </div>
              <Link
                href={`/users/${row.username}`}
                className="mt-3 flex items-center gap-3 hover:text-primary"
              >
                <UserAvatar
                  name={row.displayName}
                  username={row.username}
                  size="lg"
                />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">
                    {row.displayName}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    @{row.username}
                  </p>
                  {row.institution ? (
                    <p className="truncate text-[11px] text-muted-foreground">
                      {row.institution}
                    </p>
                  ) : null}
                </div>
              </Link>
              <div className="mt-4 flex items-end justify-between">
                <div>
                  <p className="text-2xl font-semibold tabular-nums">
                    {row.points}
                  </p>
                  <p className="text-[11px] text-muted-foreground">points</p>
                </div>
                <div className="text-right text-xs text-muted-foreground">
                  <p>{row.solvedCount} solved</p>
                  <p>{formatPercent(row.acceptanceRate)} accepted</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : null}

      <div className="mt-8">
        {items.length === 0 ? (
          <EmptyState
            title="Nobody on the board yet"
            description="Solve a problem to claim the first spot."
            icon={Trophy}
            action={
              <Link href="/problems" className={buttonVariants()}>
                Browse problems
              </Link>
            }
          />
        ) : (
          <Card className="overflow-hidden p-1">
            <RankTable items={items} />
          </Card>
        )}
      </div>

      <Pagination
        pathname="/rank"
        searchParams={params}
        page={page}
        totalPages={totalPages}
      />

      <div className="mt-8 rounded-lg border border-border bg-muted/30 p-4 text-xs leading-relaxed text-muted-foreground">
        <p className="font-medium text-foreground">How points work</p>
        <p className="mt-1">
          Each problem is worth its listed points. Only your first accepted
          submission counts. Rejected submissions do not remove points, and
          solving the same problem again does not add points. Contest
          submissions count toward both ranking and contest standings.
        </p>
      </div>
    </div>
  );
}
