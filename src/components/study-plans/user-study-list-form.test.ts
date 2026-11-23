import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { ToastProvider } from "@/components/providers/toast-provider";
import type { AdminStudyListDetail, ProblemOption } from "@/lib/types";
import { UserStudyListForm } from "./user-study-list-form";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

function text(html: string): string {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function render(
  initial: AdminStudyListDetail | null,
  options: ProblemOption[] = [],
) {
  return renderToStaticMarkup(
    createElement(
      ToastProvider,
      null,
      createElement(UserStudyListForm, { initial, options }),
    ),
  );
}

function detail(
  overrides: Partial<AdminStudyListDetail> = {},
): AdminStudyListDetail {
  return {
    id: "plan-id",
    slug: "my-arrays-plan",
    title: "My arrays plan",
    description: "Practice array invariants before the contest.",
    level: "BEGINNER",
    estimatedMinutes: null,
    isFeatured: false,
    isPublic: false,
    sections: [],
    ...overrides,
  };
}

describe("UserStudyListForm", () => {
  it("renders create mode with the plan title field and CTA", () => {
    const html = render(null);

    expect(html).toContain('id="user-plan-title"');
    expect(html).toContain('id="user-plan-description"');
    expect(text(html)).toContain("Create plan");
    expect(text(html)).not.toContain("Save changes");
    expect(text(html)).toContain("0 problems · 1 section");
    expect(text(html)).toContain("No problems yet");
  });

  it("always explains that learner plans are private and quota-limited", () => {
    const plain = text(render(null));

    expect(plain).toContain("Private plan — only you can see it.");
    expect(plain).toContain("You can keep up to 10 plans.");
  });

  it("prefills edit mode and swaps the CTA to Save changes", () => {
    const html = render(detail());
    const plain = text(html);

    expect(html).toContain('value="My arrays plan"');
    expect(html).toContain('value="my-arrays-plan"');
    expect(plain).toContain("Practice array invariants before the contest.");
    expect(plain).toContain("Save changes");
    expect(plain).not.toContain("Create plan");
  });

  it("links Cancel back to the plan being edited", () => {
    const html = render(detail());

    expect(html).toContain('href="/lists/my-arrays-plan"');
  });

  it("keeps the private notice when editing an existing plan", () => {
    const plain = text(render(detail()));

    expect(plain).toContain("Private plan — only you can see it.");
    expect(plain).toContain("You can keep up to 10 plans.");
  });
});
