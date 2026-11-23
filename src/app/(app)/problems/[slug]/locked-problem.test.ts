import { describe, expect, it } from "vitest";
import { ApiError } from "@/server/api/errors";
import { lockedProblemFrom } from "./locked-problem";

describe("lockedProblemFrom", () => {
  it("maps a premium problem lock to its module details", () => {
    const error = new ApiError(
      "PREMIUM_LOCKED",
      "Premium module",
      403,
      {
        slug: "sql-adv-vendor-scorecard",
        title: "Vendor scorecard",
        moduleSlug: "advanced-sql",
      },
    );
    expect(lockedProblemFrom(error)).toEqual({
      kind: "premium",
      slug: "sql-adv-vendor-scorecard",
      title: "Vendor scorecard",
      moduleSlug: "advanced-sql",
    });
  });

  it("maps contest and assessment locks and ignores other errors", () => {
    expect(
      lockedProblemFrom(
        new ApiError("CONTEST_LOCKED", "Locked", 403, {
          slug: "spring",
          title: "Spring contest",
        }),
      ),
    ).toEqual({ kind: "contest", slug: "spring", title: "Spring contest", moduleSlug: undefined });
    expect(lockedProblemFrom(new Error("nope"))).toBeNull();
  });
});
