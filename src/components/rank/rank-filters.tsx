import Link from "next/link";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { buttonVariants } from "@/components/ui/button";
import {
  RANK_SOLVED_BRACKETS,
  RANK_SOLVED_LABEL,
  RANK_SORT_OPTIONS,
  facetSelectOptions,
  hasActiveRankFilters,
  rankFilterChips,
  type RankFilterChip,
  type RankFilterState,
} from "@/lib/rank-filters";
import {
  RATING_SORT_OPTIONS,
  hasActiveRatingFilters,
  rankBoardResetHref,
  ratingFilterChips,
  ratingTierOptions,
  type RatingFilterChip,
  type RatingFilterState,
} from "@/lib/rating-rank";
import type { RatingFacets } from "@/lib/rating-rank-types";
import type { SelectOption } from "@/lib/select-options";
import type { RankFacets } from "@/lib/types";
import { cn } from "@/lib/utils";

const controlLabel = "mb-1.5 block text-xs font-medium text-muted-foreground";
const controlClass = "h-11 md:h-10";

const solvedOptions: SelectOption[] = [
  { value: "", label: RANK_SOLVED_LABEL.any },
  ...RANK_SOLVED_BRACKETS.filter((bracket) => bracket !== "any").map(
    (bracket) => ({ value: bracket, label: RANK_SOLVED_LABEL[bracket] }),
  ),
];

const ratingSortOptions: SelectOption[] = RATING_SORT_OPTIONS.map((option) => ({
  value: option.value,
  label: option.label,
}));

const pointSortOptions: SelectOption[] = RANK_SORT_OPTIONS.map((option) => ({
  value: option.value,
  label: option.label,
}));

type FacetList = {
  institutions: readonly { value: string; count: number }[];
  countries: readonly { value: string; count: number }[];
};

type FiltersFormProps = {
  pageSize: number;
  q: string;
  institution: string;
  country: string;
  sort: string;
  sortOptions: SelectOption[];
  boardHidden: boolean;
  specific: {
    id: string;
    name: string;
    label: string;
    ariaLabel: string;
    placeholder: string;
    value: string;
    options: SelectOption[];
  };
  facets: FacetList;
  chips: readonly (RankFilterChip | RatingFilterChip)[];
  filtered: boolean;
  resultCopy: string;
  resetHref: string;
};

function RankFiltersForm({
  pageSize,
  q,
  institution,
  country,
  sort,
  sortOptions,
  boardHidden,
  specific,
  facets,
  chips,
  filtered,
  resultCopy,
  resetHref,
}: FiltersFormProps) {
  return (
    <section aria-label="Filter ranking" className="mt-8">
      <form
        action="/rank"
        method="get"
        role="search"
        className="rounded-lg border border-border bg-card p-4 shadow-xs"
      >
        <input type="hidden" name="pageSize" value={pageSize} />
        {boardHidden ? <input type="hidden" name="board" value="rating" /> : null}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <Label htmlFor="rank-q" className={controlLabel}>
              Search
            </Label>
            <div className="relative">
              <Search
                aria-hidden="true"
                className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              />
              <Input
                key={q}
                id="rank-q"
                name="q"
                type="search"
                defaultValue={q}
                maxLength={100}
                autoComplete="off"
                placeholder="Search name, username or institution…"
                className={cn(controlClass, "pl-9")}
              />
            </div>
          </div>

          <div className="lg:col-span-2">
            <Label htmlFor="rank-institution" className={controlLabel}>
              Institution
            </Label>
            <SearchableSelect
              id="rank-institution"
              name="institution"
              defaultValue={institution}
              aria-label="Institution"
              placeholder="All institutions"
              searchPlaceholder="Search institutions…"
              className={controlClass}
              options={facetSelectOptions(
                facets.institutions,
                "All institutions",
                institution,
              )}
            />
          </div>

          <div className="lg:col-span-2">
            <Label htmlFor="rank-country" className={controlLabel}>
              Country
            </Label>
            <SearchableSelect
              id="rank-country"
              name="country"
              defaultValue={country}
              aria-label="Country"
              placeholder="All countries"
              searchPlaceholder="Search countries…"
              className={controlClass}
              options={facetSelectOptions(
                facets.countries,
                "All countries",
                country,
              )}
            />
          </div>

          <div className="lg:col-span-2">
            <Label htmlFor={specific.id} className={controlLabel}>
              {specific.label}
            </Label>
            <SearchableSelect
              id={specific.id}
              name={specific.name}
              defaultValue={specific.value}
              aria-label={specific.ariaLabel}
              placeholder={specific.placeholder}
              className={controlClass}
              options={specific.options}
            />
          </div>

          <div className="lg:col-span-2">
            <Label htmlFor="rank-sort" className={controlLabel}>
              Sort by
            </Label>
            <SearchableSelect
              id="rank-sort"
              name="sort"
              defaultValue={sort}
              aria-label="Sort by"
              className={controlClass}
              options={sortOptions}
            />
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-end gap-2">
          <Link
            href={resetHref}
            className={cn(
              buttonVariants({ variant: "outline" }),
              "h-11 md:h-10",
            )}
          >
            Reset
          </Link>
          <button
            type="submit"
            className={cn(buttonVariants(), "h-11 md:h-10")}
          >
            Apply filters
          </button>
        </div>
      </form>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          {chips.map((chip) => (
            <Link
              key={chip.key}
              href={chip.href}
              aria-label={`Remove ${chip.label}`}
              className="inline-flex min-h-11 items-center gap-1.5 rounded-full border border-border bg-muted/60 px-2.5 py-1 text-xs font-medium transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring sm:min-h-8"
            >
              <span>{chip.label}</span>
              <X aria-hidden="true" className="size-3.5 text-muted-foreground" />
            </Link>
          ))}
          {filtered ? (
            <Link
              href={resetHref}
              className="inline-flex min-h-11 items-center text-xs font-medium text-primary underline-offset-4 hover:underline sm:min-h-0"
            >
              Clear all
            </Link>
          ) : null}
        </div>
        <p className="text-sm text-muted-foreground" role="status">
          {resultCopy}
        </p>
      </div>
    </section>
  );
}

function resultCopyFor(total: number, filtered: boolean, noun: string): string {
  if (filtered) {
    return `${total} ${total === 1 ? "coder matches" : "coders match"}`;
  }
  return `${total} ${noun} ${total === 1 ? "coder" : "coders"}`;
}

type RankFiltersProps = { total: number } & (
  | {
      board?: "points";
      filters: RankFilterState;
      facets: Pick<RankFacets, "institutions" | "countries">;
    }
  | {
      board: "rating";
      filters: RatingFilterState;
      facets: Pick<RatingFacets, "institutions" | "countries">;
    }
);

/** One GET form for both boards; only the board-specific field changes. */
export function RankFilters(props: RankFiltersProps) {
  if (props.board === "rating") {
    const { filters, facets, total } = props;
    const filtered = hasActiveRatingFilters(filters);
    return (
      <RankFiltersForm
        pageSize={filters.pageSize}
        q={filters.q}
        institution={filters.institution}
        country={filters.country}
        sort={filters.sort}
        sortOptions={ratingSortOptions}
        boardHidden
        specific={{
          id: "rank-tier",
          name: "tier",
          label: "Rating tier",
          ariaLabel: "Rating tier",
          placeholder: "Any rating",
          value: filters.tier === "any" ? "" : filters.tier,
          options: ratingTierOptions(),
        }}
        facets={facets}
        chips={ratingFilterChips(filters)}
        filtered={filtered}
        resultCopy={resultCopyFor(total, filtered, "rated")}
        resetHref={rankBoardResetHref("rating")}
      />
    );
  }

  const { filters, facets, total } = props;
  const filtered = hasActiveRankFilters(filters);
  return (
    <RankFiltersForm
      pageSize={filters.pageSize}
      q={filters.q}
      institution={filters.institution}
      country={filters.country}
      sort={filters.sort}
      sortOptions={pointSortOptions}
      boardHidden={false}
      specific={{
        id: "rank-solved",
        name: "solved",
        label: "Solved",
        ariaLabel: "Problems solved",
        placeholder: "Any solved",
        value: filters.solved === "any" ? "" : filters.solved,
        options: solvedOptions,
      }}
      facets={facets}
      chips={rankFilterChips(filters)}
      filtered={filtered}
      resultCopy={resultCopyFor(total, filtered, "ranked")}
      resetHref={rankBoardResetHref("points")}
    />
  );
}
