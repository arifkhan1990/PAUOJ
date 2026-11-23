import type { StudyListLevel, StudyListSummary } from "@/lib/study-list-types";
import { STUDY_LIST_LEVELS } from "@/lib/study-list";

export type CatalogSort = "recommended" | "shortest" | "progress";

export const CATALOG_ALL_LEVELS = "all";

export const CATALOG_SORT_OPTIONS: ReadonlyArray<{
  value: CatalogSort;
  label: string;
}> = [
  { value: "recommended", label: "Recommended" },
  { value: "shortest", label: "Shortest" },
  { value: "progress", label: "Most progress" },
];

export type CatalogFilters = {
  query: string;
  level: StudyListLevel | typeof CATALOG_ALL_LEVELS;
  sort: CatalogSort;
};

const LEVEL_VALUES = new Set<string>(
  STUDY_LIST_LEVELS.map((entry) => entry.value),
);

/** Narrows the string value emitted by the custom select back to a level. */
export function normalizeLevelFilter(
  value: string,
): StudyListLevel | typeof CATALOG_ALL_LEVELS {
  return LEVEL_VALUES.has(value)
    ? (value as StudyListLevel)
    : CATALOG_ALL_LEVELS;
}

export function normalizeCatalogSort(value: string): CatalogSort {
  return CATALOG_SORT_OPTIONS.some((option) => option.value === value)
    ? (value as CatalogSort)
    : "recommended";
}

export function filterStudyPlans(
  plans: readonly StudyListSummary[],
  filters: Pick<CatalogFilters, "query" | "level">,
): StudyListSummary[] {
  const query = filters.query.trim().toLowerCase();
  return plans.filter((plan) => {
    if (filters.level !== CATALOG_ALL_LEVELS && plan.level !== filters.level) {
      return false;
    }
    if (!query) return true;
    return [plan.title, plan.description, ...plan.topics].some((value) =>
      value.toLowerCase().includes(query),
    );
  });
}

function compareTitles(left: StudyListSummary, right: StudyListSummary) {
  return left.title.localeCompare(right.title, undefined, {
    sensitivity: "base",
  });
}

export function sortStudyPlans(
  plans: readonly StudyListSummary[],
  sort: CatalogSort,
): StudyListSummary[] {
  const copy = [...plans];
  if (sort === "shortest") {
    return copy.sort(
      (left, right) =>
        left.durationMinutes - right.durationMinutes ||
        compareTitles(left, right),
    );
  }
  if (sort === "progress") {
    return copy.sort(
      (left, right) =>
        right.progressPercent - left.progressPercent ||
        compareTitles(left, right),
    );
  }
  return copy.sort(
    (left, right) =>
      Number(right.isFeatured) - Number(left.isFeatured) ||
      compareTitles(left, right),
  );
}

export function applyCatalogFilters(
  plans: readonly StudyListSummary[],
  filters: CatalogFilters,
): StudyListSummary[] {
  return sortStudyPlans(
    filterStudyPlans(plans, { query: filters.query, level: filters.level }),
    filters.sort,
  );
}
