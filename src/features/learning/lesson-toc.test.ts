import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { LessonToc } from "@/features/learning/lesson-toc";
import { resolveActiveSection } from "@/lib/use-active-section";

const IDS = ["concept", "guided", "tiered", "extra", "checkpoint"];
const ITEMS = [
  { id: "concept", label: "Concept note" },
  { id: "guided", label: "Guided practice" },
  { id: "tiered", label: "Tiered practice" },
  { id: "extra", label: "Extra practice" },
  { id: "checkpoint", label: "Checkpoint" },
];

function render(items = ITEMS, label?: string) {
  return renderToStaticMarkup(
    createElement(LessonToc, { items, ...(label ? { label } : {}) }),
  );
}

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
  it("renders a labelled nav with every section anchor in order", () => {
    const html = render();
    const hrefs = [...html.matchAll(/href="#([^"]+)"/g)].map((match) => match[1]);

    expect(html).toContain('aria-label="In this lesson"');
    expect(hrefs).toEqual(IDS);
    expect(html).toContain("Concept note");
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
