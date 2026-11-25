import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { PresenceInfo } from "@/lib/follow-types";
import { PresenceIndicator, presenceText } from "./presence-indicator";

function render(
  presence: PresenceInfo,
  variant?: "default" | "compact",
): string {
  return renderToStaticMarkup(
    createElement(PresenceIndicator, { presence, variant }),
  );
}

describe("presenceText", () => {
  it("prefers the server label and falls back when it is missing", () => {
    expect(presenceText({ state: "ONLINE", label: "Online now" })).toBe(
      "Online now",
    );
    expect(presenceText({ state: "RECENT", label: "Last active 3h ago" })).toBe(
      "Last active 3h ago",
    );
    expect(presenceText({ state: "RECENT", label: null })).toBe(
      "Last active recently",
    );
    expect(presenceText({ state: "OFFLINE", label: null })).toBe(
      "No recent activity",
    );
    expect(presenceText({ state: "HIDDEN", label: null })).toBeNull();
  });

  it("trims an empty server label before falling back", () => {
    expect(presenceText({ state: "RECENT", label: "   " })).toBe(
      "Last active recently",
    );
  });
});

describe("PresenceIndicator", () => {
  it("renders a green dot plus a readable online pill", () => {
    const html = render({ state: "ONLINE", label: "Online now" });
    expect(html).toContain("Online now");
    expect(html).toContain("bg-emerald-600");
    expect(html).toContain("text-emerald-900");
    expect(html).toContain("rounded-full");
    expect(html).toContain('class="sr-only"');
  });

  it("keeps the dot muted for recent and offline states", () => {
    const recent = render({ state: "RECENT", label: "Last active 3h ago" });
    const offline = render({ state: "OFFLINE", label: "No recent activity" });
    expect(recent).toContain("Last active 3h ago");
    expect(offline).toContain("No recent activity");
    expect(recent).not.toContain("bg-emerald-600");
    expect(offline).not.toContain("bg-emerald-600");
    expect(recent).toContain("bg-muted-foreground/60");
  });

  it("renders nothing when presence is hidden", () => {
    expect(render({ state: "HIDDEN", label: null })).toBe("");
  });

  it("uses the compact list treatment for list rows", () => {
    const html = render(
      { state: "OFFLINE", label: "No recent activity" },
      "compact",
    );
    expect(html).toContain("size-1.5");
    expect(html).toContain("text-[11px]");
    expect(html).not.toContain("rounded-full border px-2");
  });
});
