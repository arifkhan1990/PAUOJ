import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { LearningBadge } from "@/lib/learning/types";
import { LearningBadges } from "./learning-badges";

function badge(
  overrides: Partial<LearningBadge> & Pick<LearningBadge, "moduleSlug">,
): LearningBadge {
  return {
    moduleOrder: 1,
    moduleTitle: "Basic Programming & Math",
    badgeSlug: "foundation-coder",
    badgeName: "Foundation Coder",
    description: "Completed the first module checkpoint.",
    earned: false,
    earnedAt: null,
    href: `/learn/${overrides.moduleSlug}`,
    ...overrides,
  };
}

function render(badges: LearningBadge[]) {
  return renderToStaticMarkup(createElement(LearningBadges, { badges }));
}

describe("LearningBadges", () => {
  it("renders nothing when no checkpoint badge is earned", () => {
    expect(render([])).toBe("");
    expect(
      render([
        badge({ moduleSlug: "basic-programming-math" }),
        badge({ moduleSlug: "data-structures" }),
      ]),
    ).toBe("");
  });

  it("shows only earned badges, never locked ones", () => {
    const html = render([
      badge({
        moduleSlug: "basic-programming-math",
        earned: true,
        earnedAt: "2026-11-17T10:00:00.000Z",
      }),
      badge({
        moduleSlug: "data-structures",
        moduleOrder: 2,
        moduleTitle: "Basic Data Structures",
        badgeName: "Data Structures Builder",
      }),
    ]);

    expect(html).toContain("Learning badges");
    expect(html).toContain("Foundation Coder");
    expect(html).toContain("1/2 earned");
    expect(html).not.toContain("Data Structures Builder");
    expect(html).not.toContain("Locked");
    expect(html).toContain("Earned");
    expect((html.match(/<li/g) ?? []).length).toBe(1);
  });
});
