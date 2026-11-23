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

function render(props: {
  nextProblem: StudyListNextProblem | null;
  completed: boolean;
  problemCount: number;
}) {
  return renderToStaticMarkup(createElement(NextProblemStrip, props));
}

function text(html: string): string {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

describe("NextProblemStrip", () => {
  it("renders the next problem, difficulty, position, section and link", () => {
    const html = render({ nextProblem, completed: false, problemCount: 3 });
    const plain = text(html);

    expect(plain).toContain("Next up");
    expect(plain).toContain("Two Sum");
    expect(plain).toContain("Medium");
    expect(plain).toContain("Problem 4 · Arrays");
    expect(html).toContain('href="/problems/two-sum"');
    expect(plain).toContain("Solve problem");
  });

  it("omits the section separator when the problem has no section", () => {
    const plain = text(
      render({
        nextProblem: { ...nextProblem, sectionTitle: null },
        completed: false,
        problemCount: 3,
      }),
    );

    expect(plain).toContain("Problem 4");
    expect(plain).not.toContain("·");
  });

  it("renders the completion banner when the plan is completed", () => {
    const html = render({ nextProblem: null, completed: true, problemCount: 7 });
    const plain = text(html);

    expect(plain).toContain("Plan completed");
    expect(plain).toContain("You solved all 7 problems");
    expect(plain).not.toContain("Next up");
    expect(plain).not.toContain("Solve problem");
  });

  it("renders the completion banner even if a stale next problem is passed", () => {
    const plain = text(
      render({ nextProblem, completed: true, problemCount: 3 }),
    );

    expect(plain).toContain("Plan completed");
    expect(plain).not.toContain("Two Sum");
  });

  it("renders nothing when there is no next problem and the plan is open", () => {
    expect(render({ nextProblem: null, completed: false, problemCount: 3 })).toBe(
      "",
    );
  });

  it("handles a zero problem count without NaN text", () => {
    const plain = text(
      render({ nextProblem: null, completed: true, problemCount: 0 }),
    );

    expect(plain).toContain("You solved all 0 problems");
    expect(plain).not.toContain("NaN");
  });
});
