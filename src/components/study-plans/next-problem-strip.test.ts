import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { StudyListNextProblem } from "@/lib/study-list-types";
import { NextProblemStrip } from "./next-problem-strip";

const nextProblem: StudyListNextProblem = {
  slug: "two-sum",
  title: "Two Sum",
  difficulty: "MEDIUM",
  position: 4,
  sectionTitle: "Arrays",
};

function render(nextProblemValue: StudyListNextProblem | null) {
  return renderToStaticMarkup(
    createElement(NextProblemStrip, { nextProblem: nextProblemValue }),
  );
}

function text(html: string): string {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

describe("NextProblemStrip", () => {
  it("renders the next problem, difficulty, position, section and link", () => {
    const html = render(nextProblem);
    const plain = text(html);

    expect(plain).toContain("Next up");
    expect(plain).toContain("Two Sum");
    expect(plain).toContain("Medium");
    expect(plain).toContain("Problem 4 · Arrays");
    expect(html).toContain('href="/problems/two-sum"');
    expect(plain).toContain("Solve problem");
  });

  it("omits the section separator when the problem has no section", () => {
    const plain = text(render({ ...nextProblem, sectionTitle: null }));

    expect(plain).toContain("Problem 4");
    expect(plain).not.toContain("·");
  });

  it("renders nothing when there is no next problem", () => {
    expect(render(null)).toBe("");
  });
});
