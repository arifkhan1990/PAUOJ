import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { ConfirmDialog } from "./confirm-dialog";

function render(
  overrides: Partial<{
    open: boolean;
    pending: boolean;
    destructive: boolean;
    confirmLabel: string;
  }> = {},
) {
  return renderToStaticMarkup(
    createElement(ConfirmDialog, {
      open: false,
      title: "Delete this note?",
      description: "The note will be removed from this problem.",
      onConfirm: vi.fn(),
      onCancel: vi.fn(),
      ...overrides,
    }),
  );
}

function text(html: string): string {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

describe("ConfirmDialog", () => {
  it("renders an accessible native dialog with a labelled title and description", () => {
    const html = render();

    expect(html).toContain("<dialog");
    expect(html).toContain("aria-labelledby=");
    expect(html).toContain("aria-describedby=");
    expect(/<dialog[^>]*\sopen[\s>]/.test(html)).toBe(false);
    expect(text(html)).toContain("Delete this note?");
  });

  it("offers Cancel before the destructive action", () => {
    const html = render({ open: true, confirmLabel: "Delete note" });
    const plain = text(html);

    expect(plain).toContain("Cancel");
    expect(plain).toContain("Delete note");
    expect(plain.indexOf("Cancel")).toBeLessThan(plain.indexOf("Delete note"));
    expect(html).toContain('type="button"');
  });

  it("shows a pending label and disables both buttons while deleting", () => {
    const html = render({ open: true, pending: true });
    const plain = text(html);

    expect(plain).toContain("Deleting…");
    expect(html).toContain('aria-busy="true"');
    expect(html.match(/disabled=""/g)?.length ?? 0).toBe(2);
  });

  it("keeps the confirm button non-destructive when asked", () => {
    const html = render({ open: true, destructive: false, confirmLabel: "Confirm" });

    expect(text(html)).toContain("Confirm");
    expect(html).not.toContain("bg-destructive");
  });
});
