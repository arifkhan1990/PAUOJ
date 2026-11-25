import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { ToastProvider } from "@/components/providers/toast-provider";
import { SubmissionNote } from "./submission-note";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));

const NOTE = "Watch the off-by-one when the window shrinks.";

function render(note: string | null) {
  return renderToStaticMarkup(
    createElement(
      ToastProvider,
      null,
      createElement(SubmissionNote, {
        submissionId: "sub_123",
        initialNote: note,
      }),
    ),
  );
}

function text(html: string): string {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function buttonWithText(html: string, label: string): string {
  const buttons = [
    ...html.matchAll(/<button\b([^>]*)>([\s\S]*?)<\/button>/g),
  ].map((match) => match[0]);
  const found = buttons.find((button) => text(button).includes(label));
  expect(found, `expected a "${label}" button`).toBeDefined();
  return found!;
}

describe("SubmissionNote", () => {
  it("offers an empty private editor for a submission without a note", () => {
    const html = render(null);
    const plain = text(html);

    expect(plain).toContain("Your notes");
    expect(plain).toContain("Only you can see this");
    expect(html).toContain('placeholder="Write your notes here"');
    expect(html).toContain('maxLength="2000"');
    expect(plain).toContain("0/2000");
    expect(plain).not.toContain("Delete");
  });

  it("disables Save until the draft is non-empty and changed", () => {
    const html = render(null);
    const save = buttonWithText(html, "Save");

    expect(save).toContain('disabled=""');
    expect(save).toContain("min-h-11");
  });

  it("loads an existing note into the editor with its character count", () => {
    const html = render(NOTE);
    const plain = text(html);

    expect(html).toContain(NOTE);
    expect(plain).toContain(`${NOTE.length}/2000`);
    expect(plain).toContain("Delete");
    expect(plain).toContain("Delete this note?");
  });

  it("keeps Save disabled for an unchanged note", () => {
    const html = render(NOTE);

    expect(buttonWithText(html, "Save")).toContain('disabled=""');
  });

  it("labels the editor for assistive technology", () => {
    const html = render(null);

    expect(html).toContain("Your private notes for this submission");
    expect(html).toContain('aria-invalid="false"');
  });
});
