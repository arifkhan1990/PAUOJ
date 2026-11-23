import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { ToastProvider } from "@/components/providers/toast-provider";
import { PlanActions } from "./plan-actions";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));

function render(
  overrides: Partial<{
    signedIn: boolean;
    enrolled: boolean;
    completed: boolean;
  }> = {},
) {
  return renderToStaticMarkup(
    createElement(
      ToastProvider,
      null,
      createElement(PlanActions, {
        slug: "getting-started",
        signedIn: true,
        enrolled: false,
        completed: false,
        ...overrides,
      }),
    ),
  );
}

function text(html: string): string {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

describe("PlanActions", () => {
  it("asks guests to sign in without offering Start plan", () => {
    const html = render({ signedIn: false });
    const plain = text(html);

    expect(plain).toContain("Sign in to track progress");
    expect(plain).not.toContain("Start plan");
    expect(html).toContain('href="/login?next=/lists/getting-started"');
  });

  it("keeps the incomplete Start plan state unchanged", () => {
    const html = render();
    const plain = text(html);

    expect(plain).toContain("Start plan");
    expect(plain).not.toContain("Review sections");
    expect(plain).not.toContain("Leave plan");
  });

  it("offers Review sections instead of Start plan when completed", () => {
    const html = render({ completed: true });
    const plain = text(html);

    expect(plain).toContain("Review sections");
    expect(html).toContain('href="#plan-sections"');
    expect(plain).not.toContain("Start plan");
    expect(plain).not.toContain("Plan completed");
    expect(plain).not.toContain("Leave plan");
  });

  it("keeps a subtle Leave plan option for enrolled completed plans", () => {
    const html = render({ completed: true, enrolled: true });
    const plain = text(html);

    expect(plain).toContain("Review sections");
    expect(plain).toContain("Leave plan");
    expect(plain).not.toContain("Start plan");
  });
});
