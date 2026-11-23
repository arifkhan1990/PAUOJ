import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { StudyPlanCardProgress } from "./study-plan-card-progress";

function render(solved: number, total: number, signedIn = true) {
  return renderToStaticMarkup(
    createElement(StudyPlanCardProgress, { solved, total, signedIn }),
  );
}

function text(html: string): string {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

/** Each progress segment renders one element with the `h-2` height. */
function segments(html: string): number {
  return (html.match(/h-2/g) ?? []).length;
}

function filledPrimary(html: string): number {
  return (html.match(/bg-primary/g) ?? []).length;
}

function filledSuccess(html: string): number {
  return (html.match(/bg-success/g) ?? []).length;
}

describe("StudyPlanCardProgress", () => {
  it("shows Not started and hides the percent at zero progress", () => {
    const html = render(0, 10);
    const plain = text(html);

    expect(plain).toContain("Not started");
    expect(plain).not.toContain("0%");
    expect(segments(html)).toBe(10);
    expect(filledPrimary(html)).toBe(0);
    expect(html).toContain('aria-valuemin="0"');
    expect(html).toContain('aria-valuemax="10"');
    expect(html).toContain('aria-valuenow="0"');
  });

  it("reports solved count and percent for partial progress", () => {
    const html = render(3, 10);
    const plain = text(html);

    expect(plain).toContain("3 of 10 solved");
    expect(plain).toContain("30%");
    expect(segments(html)).toBe(10);
    expect(filledPrimary(html)).toBe(3);
    expect(html).toContain('role="progressbar"');
    expect(html).toContain('aria-valuemax="10"');
    expect(html).toContain('aria-valuenow="3"');
    expect(html).toContain('aria-label="3 of 10 problems solved"');
    expect(html).toContain('aria-valuetext="3 of 10 problems solved"');
  });

  it("marks every segment as success when the plan is complete", () => {
    const html = render(10, 10);
    const plain = text(html);

    expect(plain).toContain("Completed");
    expect(plain).toContain("100%");
    expect(segments(html)).toBe(10);
    expect(filledSuccess(html)).toBe(10);
    expect(filledPrimary(html)).toBe(0);
    expect(html).toContain(
      'aria-valuetext="Completed, 10 of 10 problems solved"',
    );
  });

  it("renders one segment per problem for plans of ten or fewer problems", () => {
    const html = render(2, 5);

    expect(segments(html)).toBe(5);
    expect(filledPrimary(html)).toBe(2);
    expect(text(html)).toContain("2 of 5 solved");
  });

  it("caps long plans at ten proportional segments", () => {
    const html = render(40, 100);

    expect(segments(html)).toBe(10);
    expect(filledPrimary(html)).toBe(4);
    expect(text(html)).toContain("40 of 100 solved");
    expect(text(html)).toContain("40%");
  });

  it("fills at least one segment once a long plan is started", () => {
    const html = render(1, 100);

    expect(segments(html)).toBe(10);
    expect(filledPrimary(html)).toBe(1);
  });

  it("asks guests to sign in and hides their numbers", () => {
    const html = render(4, 10, false);
    const plain = text(html);

    expect(plain).toContain("Sign in to track progress");
    expect(plain).not.toContain("4 of 10 solved");
    expect(plain).not.toContain("40%");
    expect(filledPrimary(html)).toBe(0);
    expect(html).toContain('aria-valuenow="0"');
    expect(html).toContain('aria-valuetext="Sign in to track progress"');
    expect(html).toContain('aria-label="Sign in to track progress"');
  });

  it("never renders an SVG ring", () => {
    const html = render(5, 10);

    expect(html).not.toContain("<svg");
    expect(html).not.toContain("stroke-dasharray");
    expect(html).not.toContain('role="img"');
  });
});
