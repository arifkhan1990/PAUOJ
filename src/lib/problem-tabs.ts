export const PROBLEM_TABS = [
  "description",
  "rankboard",
  "submissions",
  "discussion",
  "editorial",
  "resources",
] as const;

export type ProblemTab = (typeof PROBLEM_TABS)[number];

export function parseProblemTab(value: string | undefined): ProblemTab {
  return (PROBLEM_TABS as readonly string[]).includes(value ?? "")
    ? (value as ProblemTab)
    : "description";
}

export function problemTabHref(slug: string, tab: ProblemTab): string {
  return tab === "description"
    ? `/problems/${slug}`
    : `/problems/${slug}?tab=${tab}`;
}
