import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ContestIntegrityShield } from "./contest-integrity-shield";

const WATERMARK = "Arif Khan (@arifk) · monthly-nov-2026 · 2026-11-15";

function render(props: {
  watermark: string | null;
  focusMode?: boolean;
}): string {
  return renderToStaticMarkup(
    // This suite is plain .ts (vitest includes src/**/*.test.ts), so JSX is
    // unavailable and children must travel through props.
    // eslint-disable-next-line react/no-children-prop
    createElement(ContestIntegrityShield, {
      contestSlug: "monthly-nov-2026",
      contestTitle: "Monthly November",
      problemId: null,
      children: createElement("p", null, "The quick brown fox statement."),
      ...props,
    }),
  );
}

describe("ContestIntegrityShield markup", () => {
  it("renders children with a repeated aria-hidden watermark overlay", () => {
    const markup = render({ watermark: WATERMARK });
    expect(markup).toContain("The quick brown fox statement.");
    const hits = markup.split("Arif Khan (@arifk)").length - 1;
    expect(hits).toBeGreaterThanOrEqual(6);
    expect(markup).toContain('aria-hidden="true"');
    expect(markup).toContain("pointer-events-none");
    expect(markup).toContain("select-none");
    // Diagonal overlay, kept visible for print/photographs (no print:hidden).
    expect(markup).toContain("-rotate-[24deg]");
  });

  it("shows the visible integrity notice with the focus mode control", () => {
    const markup = render({ watermark: WATERMARK });
    expect(markup).toContain("Contest integrity");
    expect(markup).toContain("watermarked");
    expect(markup).toContain("logged");
    expect(markup).toContain("Screenshots are traceable, not impossible");
    expect(markup).toContain("crew cannot compete");
    expect(markup).toContain("Enter contest focus mode (fullscreen)");
  });

  it("hides the overlay but keeps the notice for crew/admin views (no watermark)", () => {
    const markup = render({ watermark: null, focusMode: false });
    expect(markup).toContain("Contest integrity");
    expect(markup).not.toContain("Arif Khan");
    expect(markup).not.toContain("pointer-events-none");
    expect(markup).not.toContain("Focus mode");
  });
});
