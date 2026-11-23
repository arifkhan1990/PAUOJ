import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { ToastProvider } from "@/components/providers/toast-provider";
import type {
  StudyListProblem,
  StudyListSectionView,
} from "@/lib/study-list-types";
import {
  PlanSectionCard,
  PlanSectionChips,
  PlanSectionRail,
  sectionAnchorId,
} from "./plan-sections";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));

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
    note: null,
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
    createElement(PlanSectionCard, {
      section: sectionValue,
      index,
      signedIn: false,
      planSlug: "arrays-plan",
    }),
  );
}

function renderSignedIn(sectionValue: StudyListSectionView) {
  return renderToStaticMarkup(
    createElement(
      ToastProvider,
      null,
      createElement(PlanSectionCard, {
        section: sectionValue,
        index: 0,
        signedIn: true,
        planSlug: "arrays-plan",
      }),
    ),
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
    const html = render(section({ solvedCount: 2, problemCount: 5 }));
    const plain = text(html);

    expect(html).toContain('id="section-arrays"');
    expect(html).toContain('aria-labelledby="section-arrays-title"');
    expect(plain).toContain("01");
    expect(plain).toContain("Arrays");
    expect(plain).toContain("Store and index values efficiently.");
    expect(plain).toContain("2 of 5 solved");
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
          problem({
            slug: "attempted-one",
            title: "Attempted one",
            attempted: true,
            position: 2,
          }),
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

  it("uses an accessible progress ring instead of a thin bar", () => {
    const html = render(section({ solvedCount: 3, problemCount: 4 }));

    expect(html).toContain('role="img"');
    expect(html).toContain('aria-label="Arrays: 3 of 4 problems solved"');
    expect(html).toContain("stroke-dasharray");
    expect(html).not.toContain('role="progressbar"');
    expect(html).not.toContain("aria-valuenow");
  });

  it("renders the empty-section message instead of a list", () => {
    const html = render(section({ problemCount: 0, problems: [] }));

    expect(text(html)).toContain("No problems in this section yet.");
    expect(html).not.toContain("<ul");
    expect(text(html)).toContain("0 of 0 solved");
  });
});

describe("PlanSectionCard note visibility", () => {
  it("hides every private-note control from guests", () => {
    const html = render(
      section({
        problems: [
          problem({ note: null }),
          problem({ slug: "with-note", title: "With note", note: "secret" }),
        ],
      }),
    );

    expect(html).not.toContain("Add a private note");
    expect(html).not.toContain("Your note");
    expect(html).not.toContain("secret");
  });

  it("shows an add-note trigger for each problem when signed in", () => {
    const html = renderSignedIn(
      section({
        problems: [
          problem({ slug: "two-sum", title: "Two Sum" }),
          problem({ slug: "three-sum", title: "Three Sum", position: 2 }),
        ],
      }),
    );

    expect(html).toContain("Add a private note for Two Sum");
    expect(html).toContain("Add a private note for Three Sum");
    expect(html).not.toContain("Your note");
    expect(html).not.toContain("<textarea");
  });

  it("keeps the note trigger outside the problem link", () => {
    const html = renderSignedIn(
      section({
        problems: [problem({ slug: "two-sum", title: "Two Sum" })],
      }),
    );
    const linkStart = html.search(/<a [^>]*href="\/problems\/two-sum"/);
    const linkEnd = html.indexOf("</a>", linkStart);
    const noteTrigger = html.indexOf(
      'aria-label="Add a private note for Two Sum"',
    );

    expect(linkStart).toBeGreaterThan(-1);
    expect(linkEnd).toBeGreaterThan(linkStart);
    expect(noteTrigger).toBeGreaterThan(linkEnd);
  });

  it("previews only the viewer's saved note when signed in", () => {
    const html = renderSignedIn(
      section({
        problems: [
          problem({
            slug: "two-sum",
            title: "Two Sum",
            note: "Hash map complement.",
          }),
          problem({ slug: "three-sum", title: "Three Sum", position: 2 }),
        ],
      }),
    );
    const plain = text(html);

    expect(plain).toContain("Your note");
    expect(plain).toContain("Hash map complement.");
    expect(html).toContain('aria-label="Edit note for Two Sum"');
    expect(html).toContain('aria-label="Add a private note for Three Sum"');
    expect(html).not.toContain('aria-label="Add a private note for Two Sum"');
  });
});

describe("PlanSectionChips", () => {
  it("renders horizontally scrollable jump chips for small screens", () => {
    const html = renderToStaticMarkup(
      createElement(PlanSectionChips, {
        sections: [
          section({ id: "arrays", title: "Arrays" }),
          section({ id: null, title: "General", position: 2 }),
        ],
      }),
    );

    expect(html).toContain('aria-label="Sections"');
    expect(html).toContain('href="#section-arrays"');
    expect(html).toContain('href="#section-general"');
    expect(html).toContain("reference-nav-scroll");
    expect(html).toContain("overflow-x-auto");
    expect(text(html)).toContain("Arrays");
    expect(text(html)).toContain("0/3");
  });

  it("renders nothing for a single section", () => {
    const html = renderToStaticMarkup(
      createElement(PlanSectionChips, { sections: [section()] }),
    );
    expect(html).toBe("");
  });
});

describe("PlanSectionRail", () => {
  it("renders a sticky desktop rail with progress per section", () => {
    const html = renderToStaticMarkup(
      createElement(PlanSectionRail, {
        sections: [
          section({ id: "arrays", title: "Arrays", solvedCount: 2 }),
          section({ id: null, title: "General", position: 2 }),
        ],
      }),
    );

    expect(html).toContain('aria-label="Sections"');
    expect(html).toContain("lg:sticky");
    expect(html).toContain('href="#section-arrays"');
    expect(html).toContain('href="#section-general"');
    expect(text(html)).toContain("2 of 3 solved");
  });

  it("renders nothing for a single section", () => {
    const html = renderToStaticMarkup(
      createElement(PlanSectionRail, { sections: [section()] }),
    );
    expect(html).toBe("");
  });
});
