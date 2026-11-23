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
  it("offers an Add note trigger when the problem has no note", () => {
    const html = render(null);
    const plain = text(html);

    expect(plain).toContain("Add note");
    expect(plain).not.toContain("Your note");
    expect(html).not.toContain("<textarea");
    expect(html).toContain("Add a private note for Two Sum");
    expect(html).toContain('aria-expanded="false"');
  });

  it("previews an existing note with an edit action", () => {
    const html = render("Store the complement in a hash map.");
    const plain = text(html);

    expect(plain).toContain("Your note");
    expect(plain).toContain("Store the complement in a hash map.");
    expect(plain).toContain("Edit note");
    expect(plain).not.toContain("Add note");
    expect(html).not.toContain("<textarea");
    expect(html).toContain('aria-label="Edit saved note for Two Sum"');
    expect(html).toContain("line-clamp-2");
  });

  it("keeps the trigger usable outside a problem link", () => {
    const html = render(null);

    expect(html).toContain("<button");
    expect(html).toContain("min-h-11");
    expect(html).toContain("min-w-11");
    expect(html).not.toContain("<a ");
  });
});
