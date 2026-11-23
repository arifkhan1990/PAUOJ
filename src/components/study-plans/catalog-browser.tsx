"use client";

import { useDeferredValue, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { Search, SearchX } from "lucide-react";
import {
  CATALOG_ALL_LEVELS,
  CATALOG_SORT_OPTIONS,
  applyCatalogFilters,
  normalizeCatalogSort,
  normalizeLevelFilter,
  type CatalogSort,
} from "@/components/study-plans/catalog-filter";
import { StudyPlanCard } from "@/components/study-plans/study-plan-card";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { STUDY_LIST_LEVELS } from "@/lib/study-list";
import type { StudyListLevel, StudyListSummary } from "@/lib/study-list-types";
import type { SelectOption } from "@/lib/select-options";

const LEVEL_OPTIONS: SelectOption[] = [
  { value: CATALOG_ALL_LEVELS, label: "All levels" },
  ...STUDY_LIST_LEVELS.map((level) => ({
    value: level.value,
    label: level.label,
    description: level.description,
  })),
];

const SORT_OPTIONS: SelectOption[] = CATALOG_SORT_OPTIONS.map((option) => ({
  value: option.value,
  label: option.label,
}));

const LEVEL_LABELS = new Map<string, string>(
  STUDY_LIST_LEVELS.map((level) => [level.value, level.label]),
);

function FieldLabel({
  htmlFor,
  children,
}: {
  htmlFor?: string;
  children: ReactNode;
}) {
  if (htmlFor) {
    return (
      <Label
        htmlFor={htmlFor}
        className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground"
      >
        {children}
      </Label>
    );
  }
  return (
    <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
      {children}
    </span>
  );
}

export function CatalogBrowser({
  plans,
  signedIn,
}: {
  plans: StudyListSummary[];
  signedIn: boolean;
}) {
  const [query, setQuery] = useState("");
  const [level, setLevel] = useState<StudyListLevel | typeof CATALOG_ALL_LEVELS>(
    CATALOG_ALL_LEVELS,
  );
  const [sort, setSort] = useState<CatalogSort>("recommended");
  const deferredQuery = useDeferredValue(query);

  const visiblePlans = useMemo(
    () => applyCatalogFilters(plans, { query: deferredQuery, level, sort }),
    [deferredQuery, level, plans, sort],
  );

  const isFiltered = query.trim().length > 0 || level !== CATALOG_ALL_LEVELS;
  const countLabel = isFiltered
    ? `${visiblePlans.length} of ${plans.length} plans match your filters`
    : `${plans.length} ${plans.length === 1 ? "plan" : "plans"}`;

  const reset = () => {
    setQuery("");
    setLevel(CATALOG_ALL_LEVELS);
    setSort("recommended");
  };

  return (
    <section aria-labelledby="catalog-plans-title" className="mt-10">
      <div className="flex flex-col gap-1 border-b border-border pb-3">
        <h2
          id="catalog-plans-title"
          className="scroll-mt-24 text-xl font-semibold tracking-tight sm:text-2xl"
        >
          All plans
        </h2>
        <p className="text-sm text-muted-foreground">
          Filter by level or length, then start wherever you are.
        </p>
      </div>

      <Card className="mt-4 p-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_11rem_11rem]">
          <div className="min-w-0 sm:col-span-2 lg:col-span-1">
            <FieldLabel htmlFor="catalog-search">Search</FieldLabel>
            <div className="relative mt-1.5">
              <Search
                aria-hidden="true"
                className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              />
              <Input
                id="catalog-search"
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Title, description or topic"
                className="h-11 pl-9"
              />
            </div>
          </div>

          <div className="min-w-0">
            <FieldLabel>Level</FieldLabel>
            <div className="mt-1.5">
              <SearchableSelect
                aria-label="Filter plans by level"
                placeholder="All levels"
                options={LEVEL_OPTIONS}
                value={level}
                className="h-11"
                onValueChange={(value) =>
                  setLevel(normalizeLevelFilter(value))
                }
              />
            </div>
          </div>

          <div className="min-w-0">
            <FieldLabel>Sort by</FieldLabel>
            <div className="mt-1.5">
              <SearchableSelect
                aria-label="Sort plans"
                placeholder="Recommended"
                options={SORT_OPTIONS}
                value={sort}
                className="h-11"
                onValueChange={(value) => setSort(normalizeCatalogSort(value))}
              />
            </div>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3">
          <p
            aria-live="polite"
            className="text-xs text-muted-foreground"
          >
            {countLabel}
            {level !== CATALOG_ALL_LEVELS
              ? ` · ${LEVEL_LABELS.get(level) ?? level}`
              : ""}
          </p>
          {isFiltered ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="min-h-11"
              onClick={reset}
            >
              Clear filters
            </Button>
          ) : null}
        </div>
      </Card>

      {visiblePlans.length === 0 ? (
        <EmptyState
          className="mt-6"
          icon={SearchX}
          title="No plans match your filters"
          description={
            plans.length === 0
              ? "Published study plans will appear here."
              : "Try a different level or clear the search to see every plan."
          }
          action={
            <Button
              type="button"
              variant="outline"
              className="min-h-11"
              onClick={reset}
            >
              Clear filters
            </Button>
          }
        />
      ) : (
        <ul
          role="list"
          className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3"
        >
          {visiblePlans.map((plan) => (
            <li key={plan.id}>
              <StudyPlanCard plan={plan} signedIn={signedIn} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
