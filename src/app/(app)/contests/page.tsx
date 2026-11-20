import type { Metadata } from "next";
import Link from "next/link";
import { Trophy } from "lucide-react";
import { ContestCard } from "@/components/contests/contest-card";
import { EmptyState } from "@/components/shared/empty-state";
import { Pagination } from "@/components/shared/pagination";
import { PageHeader } from "@/components/shared/page-header";
import { buttonVariants } from "@/components/ui/button";
import { getCurrentUser } from "@/server/auth/session";
import { listContests, type ContestFilter } from "@/server/services/contests";
import { CONTEST_DIVISION_LABEL } from "@/lib/contests";
import type { ContestDivision } from "@/lib/types";
import { firstValue, readPage, type SearchParams } from "@/lib/pagination";
import { DEFAULT_PAGE_SIZE } from "@/lib/constants";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Contests",
  description: "Live and upcoming programming contests at PrimeAsia University.",
};

export const dynamic = "force-dynamic";

const filters: { value: ContestFilter; label: string }[] = [
  { value: "ALL", label: "All" },
  { value: "RUNNING", label: "Live" },
  { value: "UPCOMING", label: "Upcoming" },
  { value: "ENDED", label: "Ended" },
];

export default async function ContestsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const page = readPage(params);
  const pageSize = DEFAULT_PAGE_SIZE;
  const rawFilter = firstValue(params.filter);
  const filter =
    filters.find((item) => item.value === rawFilter)?.value ?? "ALL";
  const rawDivision = firstValue(params.division);
  const division = (
    ["OPEN", "DIV1", "DIV2", "DIV3", "DIV4"] as const
  ).find((value) => value === rawDivision);
  const user = await getCurrentUser();
  const contestPage = await listContests({
    page: { page, pageSize },
    filter,
    division,
    userId: user?.id ?? null,
  });
  const totalPages = Math.max(1, Math.ceil(contestPage.total / pageSize));

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <PageHeader
        eyebrow="Compete"
        title="Contests"
        description="Register, solve contest-only problems, and watch the live ICPC scoreboard."
        actions={
          <Link href="/rank" className={buttonVariants({ variant: "outline" })}>
            <Trophy className="size-4" /> Leaderboard
          </Link>
        }
      />

      <div className="mt-6 flex flex-wrap gap-1.5">
        {filters.map((item) => (
          <Link
            key={item.value}
            href={
              item.value === "ALL"
                ? "/contests"
                : `/contests?filter=${item.value}`
            }
            className={cn(
              buttonVariants({
                variant: filter === item.value ? "default" : "outline",
                size: "sm",
              }),
            )}
          >
            {item.label}
          </Link>
        ))}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        <span className="mr-1 text-xs font-medium text-muted-foreground">
          Division
        </span>
        <Link
          href={filter === "ALL" ? "/contests" : `/contests?filter=${filter}`}
          className={cn(
            buttonVariants({
              variant: !division ? "default" : "outline",
              size: "sm",
            }),
          )}
        >
          All
        </Link>
        {(Object.keys(CONTEST_DIVISION_LABEL) as ContestDivision[]).map(
          (value) => {
            const search = new URLSearchParams();
            if (filter !== "ALL") search.set("filter", filter);
            search.set("division", value);
            return (
              <Link
                key={value}
                href={`/contests?${search.toString()}`}
                className={cn(
                  buttonVariants({
                    variant: division === value ? "default" : "outline",
                    size: "sm",
                  }),
                )}
              >
                {CONTEST_DIVISION_LABEL[value]}
              </Link>
            );
          },
        )}
      </div>

      <div className="mt-6">
        {contestPage.items.length === 0 ? (
          <EmptyState
            title="No contests here yet"
            description="Check another filter, or come back when the next round is announced."
            icon={Trophy}
            action={
              <Link href="/problems" className={buttonVariants()}>
                Practice instead
              </Link>
            }
          />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {contestPage.items.map((contest) => (
              <ContestCard key={contest.id} contest={contest} />
            ))}
          </div>
        )}
      </div>

      <Pagination
        pathname="/contests"
        searchParams={params}
        page={page}
        totalPages={totalPages}
      />
    </div>
  );
}
