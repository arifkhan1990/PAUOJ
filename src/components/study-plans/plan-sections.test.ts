import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type {
  StudyListProblem,
  StudyListSectionView,
} from "@/lib/study-list-types";
import { PlanSectionCard, PlanSectionNav, sectionAnchorId } from "./plan-sections";

function problem(overrides: Partial<StudyListProblem> = {}): StudyListProblem {
  return {
    slug: "problem-one",
    title: "Problem one",
    difficulty: "EASY",
    points: 100,
    position: 1,
    sectionId: "arrays",
    sectionTitle: "Arrays",
    solved: false,
    attempted: false,
    ...overrides,
  };
}

function section(
  overrides: Partial<StudyListSectionView> = {},
): StudyListSectionView {
  return {
    id: "arrays",
    title: "Arrays",
    description: "Store and index values efficiently.",
    position: 1,
    problemCount: 3,
    solvedCount: 0,
    problems: [],
    ...overrides,
  };
}

function render(sectionValue: StudyListSectionView, index = 0) {
  return renderToStaticMarkup(
    createElement(PlanSectionCard, { section: sectionValue, index }),
  );
}

function text(html: string): string {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

describe("sectionAnchorId", () => {
  it("namespaces real section ids and falls back to general", () => {
    expect(sectionAnchorId("arrays")).toBe("section-arrays");
    expect(sectionAnchorId(null)).toBe("section-general");
  });
});

describe("PlanSectionCard", () => {
  it("renders the title, index, description and solved count", () => {
    const html = render(
      section({ solvedCount: 2, problemCount: 5 }),
    );
    const plain = text(html);

    expect(html).toContain('id="section-arrays"');
    expect(html).toContain('aria-labelledby="section-arrays-title"');
    expect(plain).toContain("01");
    expect(plain).toContain("Arrays");
    expect(plain).toContain("Store and index values efficiently.");
    expect(plain).toContain("2/5 solved");
  });

  it("uses the general anchor for legacy sections with a null id", () => {
    const html = render(
      section({ id: null, title: "General", description: "" }),
    );

    expect(html).toContain('id="section-general"');
    expect(html).not.toContain('id="section-null"');
    expect(text(html)).toContain("01");
    expect(text(html)).toContain("General");
  });

  it("shows explicit Solved / Attempted / Not started labels", () => {
    const html = render(
      section({
        problemCount: 3,
        solvedCount: 1,
        problems: [
          problem({ slug: "solved-one", title: "Solved one", solved: true }),
          problem({ slug: "attempted-one", title: "Attempted one", attempted: true, position: 2 }),
          problem({ slug: "fresh-one", title: "Fresh one", position: 3 }),
        ],
      }),
    );
    const plain = text(html);

    expect(plain).toContain("Solved one");
    expect(plain).toContain("Attempted one");
    expect(plain).toContain("Fresh one");
    expect(plain).toContain("Solved");
    expect(plain).toContain("Attempted");
    expect(plain).toContain("Not started");
    expect(html).toContain('href="/problems/solved-one"');
    expect(html).toContain("100 pts");
  });

  it("prefers Solved over Attempted when both flags are set", () => {
    const html = render(
      section({
        problems: [
          problem({ solved: true, attempted: true, difficulty: "HARD" }),
        ],
      }),
    );
    const plain = text(html);

    expect(plain).toContain("Solved");
    expect(plain).not.toContain("Attempted");
    expect(plain).toContain("Hard");
  });

  it("shows a progress bar with aria values", () => {
    const html = render(section({ solvedCount: 3, problemCount: 4 }));

    expect(html).toContain('role="progressbar"');
    expect(html).toContain('aria-valuenow="75"');
    expect(html).toContain('aria-valuetext="3 of 4 problems solved"');
    expect(html).toContain("width:75%");
  });

  it("renders the empty-section message instead of a list", () => {
    const html = render(section({ problemCount: 0, problems: [] }));

    expect(text(html)).toContain("No problems in this section yet.");
    expect(html).not.toContain("<ul");
    expect(text(html)).toContain("0/0 solved");
  });
});

describe("PlanSectionNav", () => {
  it("renders jump links for two or more sections", () => {
    const html = renderToStaticMarkup(
      createElement(PlanSectionNav, {
        sections: [
          section({ id: "arrays", title: "Arrays" }),
          section({ id: null, title: "General", position: 2 }),
        ],
      }),
    );
    const plain = text(html);

    expect(plain).toContain("Jump to");
    expect(html).toContain('href="#section-arrays"');
    expect(html).toContain('href="#section-general"');
    expect(html).toContain('aria-label="Jump to a section"');
  });

  it("renders nothing for a single section", () => {
    const html = renderToStaticMarkup(
      createElement(PlanSectionNav, { sections: [section()] }),
    );
    expect(html).toBe("");
  });
});
