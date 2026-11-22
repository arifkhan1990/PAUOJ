import Link from "next/link";
import { Search, SlidersHorizontal } from "lucide-react";
import { Input } from "@/components/ui/input";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { TagFilterCloud } from "@/components/problems/tag-filter-cloud";
import { buttonVariants } from "@/components/ui/button";
import { DIFFICULTIES, difficultyMeta } from "@/lib/difficulty";
import { buildQueryString, type SearchParams } from "@/lib/pagination";
import type { ProblemTag } from "@/lib/types";
import { cn } from "@/lib/utils";

function filterHref(
  searchParams: SearchParams,
  updates: Record<string, string | number | undefined | null>,
): string {
  const query = buildQueryString(searchParams, { ...updates, page: 1 });
  return query ? `/problems?${query}` : "/problems";
}

export function ProblemFilters({
  searchParams,
  q,
  difficulty,
  tag,
  tags,
  category,
  subcategory,
  company,
  facets,
}: {
  searchParams: SearchParams;
  q?: string;
  difficulty?: string;
  tag?: string;
  tags: ProblemTag[];
  category?: string;
  subcategory?: string;
  company?: string;
  facets: { categories: string[]; subcategories: string[]; companies: string[] };
}) {
  const hasFilters = Boolean(
    q || difficulty || tag || category || subcategory || company,
  );
  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <form
          action="/problems"
          method="get"
          className="relative w-full max-w-md"
          role="search"
        >
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            name="q"
            defaultValue={q}
            placeholder="Search problems by title or slug…"
            className="pl-9 pr-20"
            aria-label="Search problems"
          />
          {difficulty ? (
            <input type="hidden" name="difficulty" value={difficulty} />
          ) : null}
          {tag ? <input type="hidden" name="tag" value={tag} /> : null}
          <button
            type="submit"
            className={cn(
              buttonVariants({ size: "sm" }),
              "absolute right-1 top-1/2 -translate-y-1/2",
            )}
          >
            Search
          </button>
        </form>
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="mr-1 inline-flex items-center gap-1 text-xs font-medium text-muted-foreground">
            <SlidersHorizontal className="size-3.5" /> Difficulty
          </span>
          <Link
            href={filterHref(searchParams, { difficulty: undefined })}
            className={cn(
              buttonVariants({
                variant: !difficulty ? "default" : "outline",
                size: "sm",
              }),
            )}
          >
            All
          </Link>
          {DIFFICULTIES.map((value) => (
            <Link
              key={value}
              href={filterHref(searchParams, { difficulty: value })}
              className={cn(
                buttonVariants({
                  variant: difficulty === value ? "default" : "outline",
                  size: "sm",
                }),
              )}
            >
              {difficultyMeta(value).label}
            </Link>
          ))}
        </div>
      </div>

      <form
        action="/problems"
        method="get"
        className="flex flex-wrap items-end gap-2 rounded-lg border border-border bg-card p-3"
      >
        {q ? <input type="hidden" name="q" value={q} /> : null}
        {difficulty ? (
          <input type="hidden" name="difficulty" value={difficulty} />
        ) : null}
        {tag ? <input type="hidden" name="tag" value={tag} /> : null}
        <div className="min-w-40 flex-1">
          <label htmlFor="category" className="mb-1 block text-[11px] font-medium text-muted-foreground">
            Category
          </label>
          <SearchableSelect
            id="category"
            name="category"
            defaultValue={category ?? ""}
            aria-label="Category"
            className="h-8 text-xs"
            options={[
              { value: "", label: "All categories" },
              ...facets.categories.map((value) => ({ value, label: value })),
            ]}
          />
        </div>
        <div className="min-w-40 flex-1">
          <label htmlFor="subcategory" className="mb-1 block text-[11px] font-medium text-muted-foreground">
            Subcategory
          </label>
          <SearchableSelect
            id="subcategory"
            name="subcategory"
            defaultValue={subcategory ?? ""}
            aria-label="Subcategory"
            className="h-8 text-xs"
            options={[
              { value: "", label: "All subcategories" },
              ...facets.subcategories.map((value) => ({ value, label: value })),
            ]}
          />
        </div>
        <div className="min-w-40 flex-1">
          <label htmlFor="company" className="mb-1 block text-[11px] font-medium text-muted-foreground">
            Company
          </label>
          <SearchableSelect
            id="company"
            name="company"
            defaultValue={company ?? ""}
            aria-label="Company"
            className="h-8 text-xs"
            options={[
              { value: "", label: "All companies" },
              ...facets.companies.map((value) => ({ value, label: value })),
            ]}
          />
        </div>
        <button type="submit" className={cn(buttonVariants({ size: "sm" }), "h-8")}>
          Apply
        </button>
      </form>

      <TagFilterCloud
        tags={tags.map((item) => ({
          name: item.name,
          slug: item.slug,
          href: filterHref(searchParams, {
            tag: tag === item.slug ? undefined : item.slug,
          }),
          active: tag === item.slug,
        }))}
        clearHref={hasFilters ? "/problems" : null}
      />
    </div>
  );
}
