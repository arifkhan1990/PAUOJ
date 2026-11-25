import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { RelatedProblemItem } from "@/lib/types";
import { MoreChallenges } from "./more-challenges";

const problems: RelatedProblemItem[] = [
  {
    slug: "longest-substring",
    title: "Longest Substring Without Repeating Characters",
    difficulty: "MEDIUM",
    points: 120,
    sharedTags: 2,
  },
  {
    slug: "two-sum",
    title: "Two Sum",
    difficulty: "EASY",
    points: 50,
    sharedTags: 1,
  },
  {
    slug: "median-of-streams",
    title: "Median of a Data Stream",
    difficulty: "HARD",
    points: 300,
    sharedTags: 1,
  },
];

function render(items: RelatedProblemItem[]) {
  return renderToStaticMarkup(createElement(MoreChallenges, { problems: items }));
}

function text(html: string): string {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

describe("MoreChallenges", () => {
  it("renders nothing when there are no related problems", () => {
    expect(render([])).toBe("");
  });

  it("links every related problem to its problem page", () => {
    const html = render(problems);

    expect(text(html)).toContain("More challenges");
    for (const problem of problems) {
      expect(html).toContain(`href="/problems/${problem.slug}"`);
      expect(text(html)).toContain(problem.title);
    }
    expect(html.match(/<a\b/g)).toHaveLength(problems.length);
  });

  it("colors the difficulty dot and announces the difficulty", () => {
    const html = render(problems);

    expect(html).toContain("bg-amber-500");
    expect(html).toContain("bg-emerald-500");
    expect(html).toContain("bg-rose-500");
    expect(text(html)).toContain("Medium difficulty");
    expect(text(html)).toContain("Easy difficulty");
    expect(text(html)).toContain("Hard difficulty");
  });

  it("keeps pills touch-friendly and safe for long titles", () => {
    const html = render(problems);

    expect(html).toContain("rounded-full");
    expect(html).toContain("min-h-11");
    expect(html).toContain("max-w-full");
    expect(html).toContain("truncate");
    expect(html).toContain("flex-wrap");
  });
});
