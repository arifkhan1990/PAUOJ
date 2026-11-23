import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { ToastProvider } from "@/components/providers/toast-provider";
import { ProblemNote } from "./problem-note";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));

function render(note: string | null) {
  return renderToStaticMarkup(
    createElement(
      ToastProvider,
      null,
      createElement(ProblemNote, {
        planSlug: "arrays-plan",
        problemSlug: "two-sum",
        problemTitle: "Two Sum",
        note,
      }),
    ),
  );
}

function text(html: string): string {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

describe("ProblemNote", () => {
  it("offers an Add note button when the problem has no note", () => {
    const html = render(null);
    const plain = text(html);

    expect(plain).toContain("Add note");
    expect(plain).not.toContain("Your note");
    expect(html).not.toContain("<textarea");
    expect(html).toContain("Add a private note for Two Sum");
  });

  it("previews an existing note with an edit action", () => {
    const html = render("Store the complement in a hash map.");
    const plain = text(html);

    expect(plain).toContain("Your note");
    expect(plain).toContain("Store the complement in a hash map.");
    expect(plain).toContain("Edit note");
    expect(plain).not.toContain("Add note");
    expect(html).not.toContain("<textarea");
  });
});
