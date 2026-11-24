import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Building2, Trophy } from "lucide-react";
import { ContestCard } from "@/components/contests/contest-card";
import { ContestFilters } from "@/components/contests/contest-filters";
import { ContestHubHero } from "@/components/contests/contest-hub-hero";
import { ContestSpotlight } from "@/components/contests/contest-spotlight";
import { ContestTrustStrip } from "@/components/contests/contest-trust-strip";
import { EmptyState } from "@/components/shared/empty-state";
import { Pagination } from "@/components/shared/pagination";
import { buttonVariants } from "@/components/ui/button";
import { getCurrentUser } from "@/server/auth/session";
import { contestStatusCounts, listContests } from "@/server/services/contests";
import {
  CONTEST_DIVISION_LABEL,
  CONTEST_STATUS_META,
  groupContestsByStatus,
  type ContestListStatusFilter,
} from "@/lib/contests";
import { CONTEST_FORMAT_LABEL } from "@/lib/contest-ops";
import { firstValue, readPage, type SearchParams } from "@/lib/pagination";
import { DEFAULT_PAGE_SIZE } from "@/lib/constants";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Contests",
  description:
    "Live and upcoming programming contests at PrimeAsia University: solo sprints, team rounds and the official monthly contest.",
};

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<ContestListStatusFilter, string> = {
  ALL: "All",
  RUNNING: "Live",
  UPCOMING: "Upcoming",
  ENDED: "Ended",
};

export default async function ContestsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const requestedPage = readPage(params);
  const pageSize = DEFAULT_PAGE_SIZE;

  const rawFilter = firstValue(params.filter);
  const filter: ContestListStatusFilter =
    rawFilter === "RUNNING" || rawFilter === "UPCOMING" || rawFilter === "ENDED"
      ? rawFilter
      : "ALL";

  const rawDivision = firstValue(params.division);
  const division = (["OPEN", "DIV1", "DIV2", "DIV3", "DIV4"] as const).find(
    (value) => value === rawDivision,
  );

  const rawFormat = firstValue(params.format);
  const format =
    rawFormat === "SINGLE" || rawFormat === "GROUP" ? rawFormat : undefined;

  const user = await getCurrentUser();
  const userId = user?.id ?? null;

  const [counts, scopedCounts, requestedPageResult, runningPage, upcomingPage] =
    await Promise.all([
      contestStatusCounts(),
      division || format
        ? contestStatusCounts({ division, format })
        : Promise.resolve(null),
      listContests({
        page: { page: requestedPage, pageSize },
        filter,
        division,
        format,
        userId,
      }),
      listContests({
        page: { page: 1, pageSize: 1 },
        filter: "RUNNING",
        userId,
      }),
      listContests({
        page: { page: 1, pageSize: 1 },
        filter: "UPCOMING",
        userId,
      }),
    ]);

  const tabCounts = scopedCounts ?? counts;
  const totalPages = Math.max(
    1,
    Math.ceil(requestedPageResult.total / pageSize),
  );
  // A hand-edited or stale ?page= beyond the last page must not render the
  // "no contests announced" empty state; show the last real page instead.
  const page = Math.min(requestedPage, totalPages);
  const contestPage =
    page === requestedPage
      ? requestedPageResult
      : await listContests({
          page: { page, pageSize },
          filter,
          division,
          format,
          userId,
        });
  const nextContest = runningPage.items[0] ?? upcomingPage.items[0] ?? null;

  const hasFilters = filter !== "ALL" || Boolean(division) || Boolean(format);
  const activeFilters = [
    filter !== "ALL" ? STATUS_LABEL[filter] : null,
    format ? CONTEST_FORMAT_LABEL[format] : null,
    division ? CONTEST_DIVISION_LABEL[division] : null,
  ].filter((value): value is string => Boolean(value));

  // The spotlight is the hub's default-view module. Keep it out of focused
  // status views and hide it when the viewer filtered it out by format or
  // division, so a filtered page never advertises an unrelated round.
  const showSpotlight =
    Boolean(nextContest) &&
    filter === "ALL" &&
    (!format || nextContest?.format === format) &&
    (!division || nextContest?.division === division);

  // On the default first page the spotlight already shows the next round;
  // skip that exact row so the list does not read as a duplicate.
  const skipId =
    showSpotlight && page === 1 && nextContest ? nextContest.id : null;
  const visibleItems =
    skipId && contestPage.items.length > 1
      ? contestPage.items.filter((item) => item.id !== skipId)
      : contestPage.items;
  const skippedSpotlightRow = visibleItems.length < contestPage.items.length;
  const groups = groupContestsByStatus(visibleItems);
  const filtered = filter !== "ALL";
  const listTitle = filtered ? `${STATUS_LABEL[filter]} contests` : "All contests";
  const listHint = hasFilters
    ? `Filtered by ${activeFilters.join(" · ")} · Asia/Dhaka times`
    : "Asia/Dhaka times · Live and upcoming first";

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-10 lg:px-8">
      <ContestHubHero counts={counts} />

      {nextContest && showSpotlight ? (
        <section aria-labelledby="next-up-heading" className="mt-8">
          <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
            <h2
              id="next-up-heading"
              className="text-lg font-semibold tracking-tight"
            >
              Next up
            </h2>
            <p className="text-xs text-muted-foreground">
              Live now, or the next upcoming round
            </p>
          </div>
          <ContestSpotlight contest={nextContest} />
        </section>
      ) : null}

      <div className="mt-8">
        <ContestFilters
          filter={filter}
          division={division}
          format={format}
          hasFilters={hasFilters}
          counts={tabCounts}
        />
      </div>

      <section aria-labelledby="all-contests-heading" className="mt-7">
        <div className="flex flex-wrap items-end justify-between gap-2 border-b border-border pb-3">
          <div className="flex flex-wrap items-baseline gap-2">
            <h2
              id="all-contests-heading"
              className="text-lg font-semibold tracking-tight"
            >
              {listTitle}
            </h2>
            <span className="font-mono text-sm tabular-nums text-muted-foreground">
              {contestPage.total}
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            {skippedSpotlightRow ? "Next round featured above · " : null}
            {listHint}
          </p>
        </div>

        <div className="mt-4">
          {contestPage.items.length === 0 ? (
            <EmptyState
              title={
                hasFilters
                  ? "No contests match those filters"
                  : "No contests announced yet"
              }
              description={
                hasFilters
                  ? "Try another status, format or division, or host the round you want to see."
                  : "Host the first round or practise while you wait for the next announcement."
              }
              icon={Trophy}
              action={
                <div className="flex flex-wrap justify-center gap-2">
                  {hasFilters ? (
                    <Link
                      href="/contests"
                      className={cn(
                        buttonVariants({ variant: "outline" }),
                        "h-11",
                      )}
                    >
                      Clear filters
                    </Link>
                  ) : null}
                  <Link
                    href="/contests/host"
                    className={cn(
                      buttonVariants({
                        variant: hasFilters ? "outline" : "default",
                      }),
                      "h-11",
                    )}
                  >
                    Host a contest
                  </Link>
                  <Link
                    href="/problems"
                    className={cn(
                      buttonVariants({ variant: "outline" }),
                      "h-11",
                    )}
                  >
                    Practice
                  </Link>
                </div>
              }
            />
          ) : (
            groups.map((group) => (
              <div
                key={group.status}
                className="mt-5 first:mt-0"
                data-contest-group={group.status}
              >
                {filtered ? null : (
                  <div className="mb-2.5 flex items-center gap-2">
                    <span
                      aria-hidden="true"
                      className={cn(
                        "size-1.5 rounded-full motion-reduce:animate-none",
                        CONTEST_STATUS_META[group.status].dotClassName,
                      )}
                    />
                    <h3 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                      {group.label}
                    </h3>
                    <span className="font-mono text-[11px] tabular-nums text-muted-foreground">
                      {group.items.length}
                    </span>
                    <span aria-hidden="true" className="h-px flex-1 bg-border" />
                  </div>
                )}
                <div className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
                  {group.items.map((contest) => (
                    <ContestCard key={contest.id} contest={contest} />
                  ))}
                </div>
              </div>
            ))
          )}
        </div>

        <Pagination
          pathname="/contests"
          searchParams={params}
          page={page}
          totalPages={totalPages}
        />
      </section>

      <section
        aria-labelledby="fair-play-heading"
        className="mt-10 rounded-xl border border-border bg-muted/30 p-5 sm:p-6"
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">
              Fair play
            </p>
            <h2
              id="fair-play-heading"
              className="mt-1 text-lg font-semibold tracking-tight"
            >
              Built for honest competition
            </h2>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
              Fresh problems, sealed editorials, watermarked statements and a
              crew that cannot compete.
            </p>
          </div>
          <Link
            href="/contests/host"
            className="group inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-sm text-sm font-semibold text-primary transition-colors hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card"
          >
            <Building2 className="size-4" aria-hidden="true" />
            Host a round
            <ArrowRight
              className="size-4 transition-transform motion-safe:group-hover:translate-x-0.5"
              aria-hidden="true"
            />
          </Link>
        </div>
        <ContestTrustStrip className="mt-5" />
      </section>
    </div>
  );
}
