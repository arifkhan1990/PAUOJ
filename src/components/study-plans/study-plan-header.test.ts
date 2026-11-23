import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { ToastProvider } from "@/components/providers/toast-provider";
import type { StudyListDetail } from "@/lib/study-list-types";
import { StudyPlanHeader } from "./study-plan-header";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));

function detail(overrides: Partial<StudyListDetail> = {}): StudyListDetail {
  return {
    id: "plan-id",
    slug: "getting-started",
    title: "Getting started",
    description: "A short warm-up path.",
    level: "BEGINNER",
    isFeatured: false,
    estimatedMinutes: null,
    durationMinutes: 60,
    problemCount: 4,
    solvedCount: 0,
    attemptedCount: 0,
    progressPercent: 0,
    sectionCount: 2,
    difficultyCounts: { EASY: 3, MEDIUM: 1, HARD: 0, EXPERT: 0 },
    topics: ["Implementation", "Arrays"],
    enrolled: false,
    completed: false,
    nextProblem: null,
    isPublic: true,
    isOwned: false,
    sections: [],
    startedAt: null,
    updatedAt: "2026-11-23T00:00:00.000Z",
    ...overrides,
  };
}

function render(plan: StudyListDetail, signedIn = true) {
  return renderToStaticMarkup(
    createElement(
      ToastProvider,
      null,
      createElement(StudyPlanHeader, { plan, signedIn }),
    ),
  );
}

function text(html: string): string {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .replace(/\s%/g, "%")
    .trim();
}

describe("StudyPlanHeader", () => {
  it("shows an explicit ring and difficulty pills for an in-progress plan", () => {
    const html = render(
      detail({
        solvedCount: 1,
        attemptedCount: 2,
        progressPercent: 25,
        enrolled: true,
      }),
    );
    const plain = text(html);

    expect(plain).toContain("1 of 4 solved");
    expect(html).toContain('aria-label="Getting started: 1 of 4 problems solved"');
    expect(html).toContain('aria-label="Difficulty mix"');
    expect(plain).toContain("Easy 3");
    expect(plain).toContain("Medium 1");
    expect(plain).toContain("Attempted 2");
    expect(plain).toContain("Remaining 3");
  });

  it("drops the thin progress bar in favour of the ring", () => {
    const html = render(detail({ solvedCount: 2, progressPercent: 50 }));

    expect(html).not.toContain('role="progressbar"');
    expect(html).not.toContain("aria-valuenow");
    expect(html).not.toContain("flex-grow");
    expect(html).toContain('role="img"');
    expect(html).toContain("stroke-dasharray");
  });

  it("replaces Start plan with Review sections on a completed plan", () => {
    const html = render(
      detail({ solvedCount: 4, attemptedCount: 4, completed: true }),
    );
    const plain = text(html);

    expect(plain).toContain("Completed");
    expect(plain).toContain("4 of 4 solved");
    expect(plain).toContain("Review sections");
    expect(html).toContain('href="#plan-sections"');
    expect(plain).not.toContain("Start plan");
    expect(plain).not.toContain("Leave plan");
    expect(plain).not.toContain("Plan completed");
  });

  it("offers a subtle Leave plan only when a completed plan is enrolled", () => {
    const html = render(
      detail({ solvedCount: 4, completed: true, enrolled: true }),
    );
    const plain = text(html);

    expect(plain).toContain("Review sections");
    expect(plain).toContain("Leave plan");
    expect(plain).not.toContain("Start plan");
  });

  it("links an enrolled incomplete plan straight to the next problem", () => {
    const html = render(
      detail({
        solvedCount: 1,
        enrolled: true,
        nextProblem: {
          slug: "reverse-array",
          title: "Reverse the Array",
          difficulty: "EASY",
          position: 2,
          sectionTitle: "Arrays",
        },
      }),
    );
    const plain = text(html);

    expect(plain).toContain("Continue");
    expect(html).toContain('href="/problems/reverse-array"');
    expect(plain).toContain("Reverse the Array");
    expect(plain).not.toContain("Start plan");
  });

  it("asks guests to sign in and hides trackable progress", () => {
    const html = render(detail({ solvedCount: 0, attemptedCount: 0 }), false);
    const plain = text(html);

    expect(plain).toContain("Sign in to track progress");
    expect(plain).not.toContain("Start plan");
    expect(plain).not.toContain("Leave plan");
    expect(plain).toContain("0 of 4 solved");
    expect(plain).toContain("Not started");
  });

  it("marks a private owned plan and links its editor", () => {
    const html = render(
      detail({ isPublic: false, isOwned: true, title: "My plan" }),
      true,
    );
    const plain = text(html);

    expect(plain).toContain("Private");
    expect(plain).toContain("Edit plan");
    expect(html).toContain('href="/lists/getting-started/edit"');
    expect(html).not.toContain("Start plan");
  });
});
