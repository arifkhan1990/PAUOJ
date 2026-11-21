import { describe, expect, it } from "vitest";
import { canStartProblemRereview } from "./problem-review-policy";

const PUBLISHED = {
  viewerId: "author",
  viewerRole: "TEACHER" as const,
  authorId: "author",
  status: "PUBLISHED" as const,
};

describe("canStartProblemRereview", () => {
  it("allows the author and admins on a published problem", () => {
    expect(canStartProblemRereview(PUBLISHED)).toBe(true);
    expect(
      canStartProblemRereview({
        ...PUBLISHED,
        viewerId: "admin",
        viewerRole: "ADMIN",
      }),
    ).toBe(true);
  });

  it("rejects other setters, coders and non-published states", () => {
    expect(
      canStartProblemRereview({ ...PUBLISHED, viewerId: "other" }),
    ).toBe(false);
    expect(
      canStartProblemRereview({
        ...PUBLISHED,
        viewerId: "coder",
        viewerRole: "USER",
        authorId: "author",
      }),
    ).toBe(false);
    for (const status of [
      "DRAFT",
      "IN_REVIEW",
      "CHANGES_REQUESTED",
    ] as const) {
      expect(canStartProblemRereview({ ...PUBLISHED, status })).toBe(false);
    }
  });
});
