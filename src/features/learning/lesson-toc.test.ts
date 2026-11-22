import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import {
  LessonToc,
  flattenTocIds,
  type LessonTocItem,
} from "@/features/learning/lesson-toc";
import { resolveActiveSection } from "@/lib/use-active-section";

const IDS = ["concept", "guided", "tiered", "extra", "checkpoint"];
const ITEMS: LessonTocItem[] = [
  { id: "concept", label: "Concept note" },
  { id: "guided", label: "Guided practice" },
  {
    id: "tiered",
    label: "Tiered practice",
    children: [
      { id: "tiered-easy", label: "Easy" },
      { id: "tiered-medium", label: "Medium" },
      { id: "tiered-hard", label: "Hard" },
    ],
  },
  { id: "extra", label: "Extra practice" },
  { id: "checkpoint", label: "Checkpoint" },
];

function render(items = ITEMS, label?: string) {
  return renderToStaticMarkup(
    createElement(LessonToc, { items, ...(label ? { label } : {}) }),
  );
}

describe("flattenTocIds", () => {
  it("lists parent sections before their submenu children", () => {
    expect(flattenTocIds(ITEMS)).toEqual([
      "concept",
      "guided",
      "tiered",
      "tiered-easy",
      "tiered-medium",
      "tiered-hard",
      "extra",
      "checkpoint",
    ]);
  });

  it("handles empty input", () => {
    expect(flattenTocIds([])).toEqual([]);
  });
});

describe("resolveActiveSection", () => {
  it("keeps the first section active at the top of the page", () => {
    expect(resolveActiveSection(IDS, [400, 900, 1400, 1900, 2400], 120, false)).toBe(
      "concept",
    );
  });

  it("activates the last section that crossed the reading offset", () => {
    expect(resolveActiveSection(IDS, [-600, 40, 700, 1200, 1700], 120, false)).toBe(
      "guided",
    );
    expect(resolveActiveSection(IDS, [-900, -300, -40, 500, 900], 120, false)).toBe(
      "tiered",
    );
  });

  it("forces the last section when the page is scrolled to the bottom", () => {
    expect(resolveActiveSection(IDS, [-900, -300, -40, 500, 900], 120, true)).toBe(
      "checkpoint",
    );
  });

  it("ignores sections that are not on the page", () => {
    expect(resolveActiveSection(IDS, [null, 60, null, 800, 1200], 120, false)).toBe(
      "guided",
    );
  });

  it("handles an empty section list", () => {
    expect(resolveActiveSection([], [], 120, false)).toBe("");
  });
});

describe("LessonToc server rendering", () => {
  it("renders a labelled nav with every section and submenu anchor in order", () => {
    const html = render();
    const hrefs = [...html.matchAll(/href="#([^"]+)"/g)].map((match) => match[1]);

    expect(html).toContain('aria-label="In this lesson"');
    expect(hrefs).toEqual(flattenTocIds(ITEMS));
    expect(html).toContain("Concept note");
    expect(html).toContain("Tiered practice");
    expect(html).toContain("Medium");
  });

  it("nests submenu items inside their parent list item", () => {
    const html = render();
    const tiered = html.indexOf('href="#tiered"');
    const easy = html.indexOf('href="#tiered-easy"');
    const extra = html.indexOf('href="#extra"');

    expect(tiered).toBeGreaterThan(-1);
    expect(easy).toBeGreaterThan(tiered);
    expect(extra).toBeGreaterThan(easy);
    expect(html.match(/<ul/g)?.length ?? 0).toBeGreaterThan(1);
  });

  it("marks exactly one item as current, and only the first on first paint", () => {
    const html = render();
    const current = [...html.matchAll(/aria-current="location"/g)];
    expect(current).toHaveLength(1);

    const firstAnchor = html.indexOf('href="#concept"');
    const currentAnchor = html.indexOf('aria-current="location"');
    const secondAnchor = html.indexOf('href="#guided"');
    expect(currentAnchor).toBeGreaterThan(firstAnchor);
    expect(currentAnchor).toBeLessThan(secondAnchor);
  });

  it("accepts a custom accessible label", () => {
    expect(render(undefined, "Lesson outline")).toContain(
      'aria-label="Lesson outline"',
    );
  });
});
