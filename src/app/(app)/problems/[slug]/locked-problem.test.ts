import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ApiError } from "@/server/api/errors";
import { lockedProblemFrom } from "./locked-problem";
import { LockedProblemView } from "./locked-problem-view";

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

  it("maps the crew 403 to a crew lock with the role and contest slug", () => {
    const error = new ApiError(
      "CONTEST_CREW_LOCKED",
      "Contest crew cannot open this problem while the round is running.",
      403,
      {
        contestSlug: "monthly-nov-2026",
        title: "Monthly November",
        role: "SETTER",
      },
    );
    expect(lockedProblemFrom(error)).toEqual({
      kind: "crew",
      slug: "monthly-nov-2026",
      title: "Monthly November",
      role: "SETTER",
    });
    // Malformed crew details (no contest slug) must not render a lock view.
    expect(
      lockedProblemFrom(
        new ApiError("CONTEST_CREW_LOCKED", "Crew", 403, { title: "T" }),
      ),
    ).toBeNull();
  });
});

describe("LockedProblemView", () => {
  it("renders the crew blocked state with a link back to the contest", () => {
    const markup = renderToStaticMarkup(
      createElement(LockedProblemView, {
        locked: {
          kind: "crew",
          slug: "monthly-nov-2026",
          title: "Monthly November",
          role: "SETTER",
        },
        isSignedIn: true,
      }),
    );
    expect(markup).toContain("Contest crew access blocked");
    expect(markup).toContain("problem setter");
    expect(markup).toContain("Monthly November");
    expect(markup).toContain('href="/contests/monthly-nov-2026"');
    expect(markup).not.toContain("Register for the contest");
  });

  it("keeps the regular contest lock for non-crew viewers", () => {
    const markup = renderToStaticMarkup(
      createElement(LockedProblemView, {
        locked: {
          kind: "contest",
          slug: "monthly-nov-2026",
          title: "Monthly November",
        },
        isSignedIn: false,
      }),
    );
    expect(markup).toContain("This problem is locked");
    expect(markup).toContain("Register for the contest");
    expect(markup).toContain("Sign in first");
  });
});
