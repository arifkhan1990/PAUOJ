import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { LessonProgressDonut } from "@/components/learning/lesson-progress-donut";

function render(solved: number, total: number, percent: number) {
  return renderToStaticMarkup(
    createElement(LessonProgressDonut, { solved, total, percent }),
  );
}

describe("LessonProgressDonut", () => {
  it("shows the percentage, solved counts and an accessible label", () => {
    const html = render(3, 12, 25);
    expect(html).toContain("25%");
    expect(html).toContain("3/12");
    expect(html).toContain("Lesson progress:");
    expect(html).toContain("stroke-primary");
    expect(html).toContain("stroke-dasharray");
  });

  it("stays neutral at zero", () => {
    const html = render(0, 12, 0);
    expect(html).toContain("0%");
    expect(html).toContain("0/12");
    expect(html).toContain("stroke-primary");
  });

  it("turns the ring green when every problem is solved", () => {
    const html = render(12, 12, 100);
    expect(html).toContain("100%");
    expect(html).toContain("stroke-emerald-500");
  });

  it("clamps out-of-range percentages", () => {
    expect(render(0, 0, -20)).toContain("0%");
    expect(render(5, 5, 140)).toContain("100%");
  });
});
