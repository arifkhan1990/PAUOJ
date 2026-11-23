import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { StudyDifficultyCounts } from "@/lib/study-list-types";
import { DifficultySplit } from "./difficulty-split";

function render(counts: StudyDifficultyCounts) {
  return renderToStaticMarkup(createElement(DifficultySplit, { counts }));
}

function text(html: string): string {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

const counts = (
  overrides: Partial<StudyDifficultyCounts> = {},
): StudyDifficultyCounts => ({
  EASY: 0,
  MEDIUM: 0,
  HARD: 0,
  EXPERT: 0,
  ...overrides,
});

describe("DifficultySplit", () => {
  it("renders every legend count when all tiers are populated", () => {
    const html = render(counts({ EASY: 6, MEDIUM: 4, HARD: 2, EXPERT: 1 }));
    const plain = text(html);

    expect(plain).toContain("Easy 6");
    expect(plain).toContain("Medium 4");
    expect(plain).toContain("Hard 2");
    expect(plain).toContain("Expert 1");
  });

  it("hides Expert while its count is zero", () => {
    const plain = text(render(counts({ EASY: 3, MEDIUM: 2, HARD: 1 })));

    expect(plain).toContain("Easy 3");
    expect(plain).not.toContain("Expert");
  });

  it("shows Expert as soon as one expert problem exists", () => {
    const plain = text(render(counts({ EASY: 1, EXPERT: 2 })));

    expect(plain).toContain("Expert 2");
  });

  it("still renders Easy, Medium and Hard at zero counts", () => {
    const html = render(counts());
    const plain = text(html);

    expect(plain).toContain("Easy 0");
    expect(plain).toContain("Medium 0");
    expect(plain).toContain("Hard 0");
    expect(plain).not.toContain("Expert");
  });

  it("renders no bar segments when the plan has no problems", () => {
    const html = render(counts());

    expect(html).toContain('aria-hidden="true"');
    expect(html).not.toContain("flex-grow");
  });

  it("renders one bar segment per non-zero tier", () => {
    const html = render(counts({ EASY: 2, MEDIUM: 1, HARD: 0, EXPERT: 0 }));
    const bar = html.slice(0, html.indexOf("<ul"));

    expect((bar.match(/flex-grow/g) ?? []).length).toBe(2);
    expect(bar).toContain("bg-emerald-500");
    expect(bar).toContain("bg-amber-500");
    expect(bar).not.toContain("bg-rose-500");
  });

  it("keeps the legend readable without colour", () => {
    const html = render(counts({ EASY: 1 }));

    expect(html).toContain("<ul");
    expect(html).toContain("Easy");
    // Bar is decorative only; the legend carries the data.
    expect(html).toContain('aria-hidden="true"');
  });
});
