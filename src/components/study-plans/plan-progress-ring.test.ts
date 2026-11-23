import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { PlanProgressRing } from "./plan-progress-ring";

function render(props: {
  percent: number;
  solved: number;
  total: number;
  size?: "sm" | "md" | "lg";
  label?: string;
}) {
  return renderToStaticMarkup(createElement(PlanProgressRing, props));
}

function text(html: string): string {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .replace(/\s%/g, "%")
    .trim();
}

describe("PlanProgressRing", () => {
  it("renders the zero state with an accessible label", () => {
    const html = render({ percent: 0, solved: 0, total: 10 });

    expect(html).toContain('role="img"');
    expect(html).toContain('aria-label="0 of 10 problems solved (0%)"');
    expect(html).not.toContain("stroke-dasharray");
    expect(text(html)).toBe("0%");
  });

  it("renders a partial ring with the percentage in the centre", () => {
    const html = render({ percent: 50, solved: 5, total: 10 });

    expect(html).toContain('aria-label="5 of 10 problems solved (50%)"');
    expect(html).toContain("stroke-dasharray");
    expect(html).toContain("stroke-primary");
    expect(html).not.toContain("stroke-success");
    expect(text(html)).toBe("50%");
  });

  it("renders a success check at 100 percent", () => {
    const html = render({ percent: 100, solved: 10, total: 10 });

    expect(html).toContain('aria-label="10 of 10 problems solved (100%)"');
    expect(html).toContain("stroke-success");
    expect(html).toContain("lucide-check");
    expect(text(html)).toBe("");
  });

  it("clamps out-of-range values and keeps an explicit custom label", () => {
    const html = render({
      percent: 140,
      solved: 4,
      total: 4,
      label: "Arrays: 4 of 4 problems solved",
    });

    expect(html).toContain('aria-label="Arrays: 4 of 4 problems solved"');
    expect(html).toContain("stroke-success");
  });

  it("uses the requested size", () => {
    const html = render({ percent: 25, solved: 1, total: 4, size: "sm" });

    expect(html).toContain("width:40px");
    expect(html).toContain("height:40px");
  });
});
