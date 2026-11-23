import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { StudyListSummary } from "@/lib/study-list-types";
import { StudyPlanCard } from "./study-plan-card";

function plan(overrides: Partial<StudyListSummary> = {}): StudyListSummary {
  return {
    id: "plan-id",
    slug: "getting-started",
    title: "Getting started",
    description: "A gentle introduction to the judge.",
    level: "BEGINNER",
    isFeatured: false,
    estimatedMinutes: null,
    durationMinutes: 120,
    problemCount: 10,
    solvedCount: 0,
    attemptedCount: 0,
    progressPercent: 0,
    sectionCount: 2,
    difficultyCounts: { EASY: 4, MEDIUM: 4, HARD: 2, EXPERT: 0 },
    topics: ["arrays", "loops"],
    enrolled: false,
    completed: false,
    nextProblem: null,
    isPublic: true,
    isOwned: false,
    ...overrides,
  };
}

function render(planValue: StudyListSummary, signedIn = true) {
  return renderToStaticMarkup(
    createElement(StudyPlanCard, { plan: planValue, signedIn }),
  );
}

/** Flattens markup to text so labels can be asserted without tag noise. */
function text(html: string): string {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .replace(/\s%/g, "%")
    .trim();
}

/** Number of rendered progress segments (each carries the meter height). */
function segments(html: string): number {
  return (html.match(/h-2/g) ?? []).length;
}

describe("StudyPlanCard", () => {
  it("shows a Start plan CTA when nothing is solved", () => {
    const html = render(
      plan({
        solvedCount: 0,
        nextProblem: {
          slug: "first-problem",
          title: "First problem",
          difficulty: "EASY",
          position: 1,
          sectionTitle: "Basics",
        },
      }),
    );

    expect(text(html)).toContain("Start plan");
    expect(text(html)).not.toContain("Continue");
    expect(html).toContain('href="/lists/getting-started"');
    expect(html).not.toContain('href="/problems/first-problem"');
  });

  it("shows a Continue CTA pointing at the next problem once progress exists", () => {
    const html = render(
      plan({
        solvedCount: 3,
        attemptedCount: 1,
        nextProblem: {
          slug: "two-sum",
          title: "Two Sum",
          difficulty: "MEDIUM",
          position: 4,
          sectionTitle: "Arrays",
        },
      }),
    );

    expect(text(html)).toContain("Continue");
    expect(html).toContain('href="/problems/two-sum"');
    expect(html).toContain('href="/lists/getting-started"'); // title link stays
  });

  it("shows a Review plan CTA when the plan is completed", () => {
    const html = render(
      plan({ solvedCount: 10, completed: true, progressPercent: 100 }),
    );

    expect(text(html)).toContain("Review plan");
    expect(text(html)).not.toContain("Continue");
    expect(html).toContain('href="/lists/getting-started"');
  });

  it("renders level, featured, enrolled, duration and count labels", () => {
    const html = render(
      plan({
        level: "INTERMEDIATE",
        isFeatured: true,
        enrolled: true,
        durationMinutes: 150,
        problemCount: 12,
        sectionCount: 3,
      }),
    );
    const plain = text(html);

    expect(plain).toContain("Intermediate");
    expect(plain).toContain("Featured");
    expect(plain).toContain("Enrolled");
    expect(plain).toContain("12 problems");
    expect(plain).toContain("3 sections");
    expect(plain).toContain("2h 30m");
    expect(plain).toContain("A gentle introduction to the judge.");
  });

  it("falls back to Beginner for an unknown level", () => {
    const html = render(plan({ level: "WIZARD" as StudyListSummary["level"] }));
    expect(text(html)).toContain("Beginner");
  });

  it("renders the difficulty legend and solved progress text", () => {
    const html = render(
      plan({ solvedCount: 2, problemCount: 12, difficultyCounts: { EASY: 6, MEDIUM: 4, HARD: 2, EXPERT: 0 } }),
    );
    const plain = text(html);

    expect(plain).toContain("Easy 6");
    expect(plain).toContain("Medium 4");
    expect(plain).toContain("Hard 2");
    expect(plain).not.toContain("Expert");
    expect(plain).toContain("2 of 12 solved");
    expect(plain).toContain("17%");
  });

  it("uses a segmented meter and no SVG ring on the card", () => {
    const html = render(plan({ solvedCount: 2 }));

    expect(html).toContain('role="progressbar"');
    expect(segments(html)).toBe(10);
    // A ring is an SVG arc; the card must not render one any more.
    expect(html).not.toContain("stroke-dasharray");
    expect(html).not.toContain('role="img"');
  });

  it("marks completed progress with the success meter and label", () => {
    const html = render(
      plan({ solvedCount: 10, completed: true, progressPercent: 100 }),
    );
    const plain = text(html);

    expect(plain).toContain("Completed");
    expect(plain).toContain("100%");
    expect(html).toContain("bg-success");
    expect(html).not.toContain('role="img"');
  });

  it("mutes progress and asks guests to sign in", () => {
    const signedOut = render(plan({ solvedCount: 4 }), false);
    const plain = text(signedOut);

    expect(plain).toContain("Sign in to track progress");
    expect(plain).not.toContain("4 of 10 solved");
    expect(plain).not.toContain("33%");
    expect(plain).not.toContain("40%");
    expect(signedOut).toContain('aria-valuenow="0"');
  });

  it("hides the description in compact mode but keeps progress, next hint and CTA", () => {
    const html = renderToStaticMarkup(
      createElement(StudyPlanCard, {
        plan: plan({
          solvedCount: 2,
          enrolled: true,
          nextProblem: {
            slug: "two-sum",
            title: "Two Sum",
            difficulty: "MEDIUM",
            position: 3,
            sectionTitle: null,
          },
        }),
        signedIn: true,
        compact: true,
      }),
    );
    const plain = text(html);

    expect(plain).not.toContain("A gentle introduction to the judge.");
    expect(plain).toContain("2 of 10 solved");
    expect(plain).toContain("Next: Two Sum");
    expect(plain).toContain("Continue");
    expect(plain).not.toContain("Easy 4");
    expect(plain).not.toContain("Topics");
  });

  it("omits the next-problem hint in compact mode when not enrolled", () => {
    const html = renderToStaticMarkup(
      createElement(StudyPlanCard, {
        plan: plan({
          solvedCount: 2,
          nextProblem: {
            slug: "two-sum",
            title: "Two Sum",
            difficulty: "MEDIUM",
            position: 3,
            sectionTitle: null,
          },
        }),
        signedIn: true,
        compact: true,
      }),
    );

    expect(text(html)).not.toContain("Next: Two Sum");
  });

  it("marks a private owned plan and links the owner to the edit page", () => {
    const html = render(plan({ isPublic: false, isOwned: true }), true);
    const plain = text(html);

    expect(plain).toContain("Private");
    expect(plain).toContain("Your plan");
    expect(html).toContain('href="/lists/getting-started/edit"');
  });
});
