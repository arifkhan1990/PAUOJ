import { describe, expect, it } from "vitest";
import type {
  ProblemReviewApprovalStatus,
  ProblemReviewHoldStatus,
} from "@/lib/problem-review-types";
import {
  REQUIRED_PUBLICATION_APPROVALS,
  canEditProblemContent,
  canHoldProblem,
  canPublishProblem,
  canReopenHold,
  canResolveHold,
  canRespondToHold,
  canReviewProblem,
  canSubmitProblemForReview,
  countActiveApprovals,
  countBlockingHolds,
  evaluatePublicationGates,
  isProblemAuthor,
  isStaffRole,
} from "./problem-review-policy";

const SOLUTION = "int main() { return 0; }\n";
const EDITORIAL = "Sum both numbers and print the total value in O(1).";

type GateInput = Parameters<typeof evaluatePublicationGates>[0];
type Hold = { status: ProblemReviewHoldStatus };
type SubmitInput = Parameters<typeof canSubmitProblemForReview>[0];
type ReviewInput = Parameters<typeof canReviewProblem>[0];
type HoldInput = Parameters<typeof canHoldProblem>[0];
type PublishInput = Parameters<typeof canPublishProblem>[0];
type RespondInput = Parameters<typeof canRespondToHold>[0];
type ResolveInput = Parameters<typeof canResolveHold>[0];

const ADMIN = { viewerId: "admin", viewerRole: "ADMIN" } as const;
const CODER = { viewerId: "coder", viewerRole: "USER" } as const;
const NOT_DRAFT = ["IN_REVIEW", "CHANGES_REQUESTED", "PUBLISHED"] as const;
const NOT_IN_REVIEW = ["DRAFT", "CHANGES_REQUESTED", "PUBLISHED"] as const;

const active = (solutionSource: string | null = SOLUTION) => ({
  status: "ACTIVE" as ProblemReviewApprovalStatus,
  solutionSource,
});
const superseded = (solutionSource: string | null = SOLUTION) => ({
  status: "SUPERSEDED" as ProblemReviewApprovalStatus,
  solutionSource,
});
const hold = (status: ProblemReviewHoldStatus): Hold => ({ status });

function at<T>(base: T, over: Partial<T> = {}): T {
  return { ...base, ...over };
}

function gates(over: Partial<GateInput> = {}): GateInput {
  return {
    approvals: [active(), active()],
    holds: [],
    editorial: EDITORIAL,
    reviewerTests: 1,
    ...over,
  };
}

describe("evaluatePublicationGates", () => {
  it("is ready with two active approvals, editorial, a reviewer test and no holds", () => {
    expect(REQUIRED_PUBLICATION_APPROVALS).toBe(2);
    expect(evaluatePublicationGates(gates())).toEqual({
      approvalCount: 2,
      requiredApprovals: 2,
      editorialReady: true,
      reviewerTestsReady: true,
      solutionReady: true,
      holdsClear: true,
      ready: true,
      missing: [],
    });
  });

  it("names how many approvals are still missing", () => {
    const none = evaluatePublicationGates(gates({ approvals: [] }));
    expect(none.approvalCount).toBe(0);
    expect(none.ready).toBe(false);
    expect(none.missing[0]).toBe("2 more setter approvals");
    expect(none.solutionReady).toBe(false);

    const one = evaluatePublicationGates(gates({ approvals: [active()] }));
    expect(one.approvalCount).toBe(1);
    expect(one.ready).toBe(false);
    expect(one.missing[0]).toBe("1 more setter approval");
    expect(one.solutionReady).toBe(true);
    expect(one.missing).not.toContain("a reference solution from a reviewer");
  });

  it("ignores SUPERSEDED approvals, including their solutions", () => {
    const mixed = evaluatePublicationGates(
      gates({ approvals: [active(), superseded(), superseded()] }),
    );
    expect(mixed.approvalCount).toBe(1);
    expect(mixed.ready).toBe(false);
    expect(mixed.missing).toContain("1 more setter approval");

    const supersededSolution = evaluatePublicationGates(
      gates({ approvals: [active(null), active(""), superseded()] }),
    );
    expect(supersededSolution.approvalCount).toBe(2);
    expect(supersededSolution.solutionReady).toBe(false);
    expect(supersededSolution.missing).toContain("a reference solution from a reviewer");
  });

  it("blocks when the editorial is missing, empty or whitespace", () => {
    for (const editorial of [null, "", "   ", "\n\t "]) {
      const result = evaluatePublicationGates(gates({ editorial }));
      expect(result.editorialReady).toBe(false);
      expect(result.ready).toBe(false);
      expect(result.missing).toContain("an editorial");
    }
  });

  it("blocks without at least one reviewer-added test", () => {
    for (const reviewerTests of [0, -1]) {
      const result = evaluatePublicationGates(gates({ reviewerTests }));
      expect(result.reviewerTestsReady).toBe(false);
      expect(result.ready).toBe(false);
      expect(result.missing).toContain("at least one reviewer-added test case");
    }
    expect(evaluatePublicationGates(gates({ reviewerTests: 1 })).reviewerTestsReady).toBe(true);
  });

  it("blocks when no active approval carries a reference solution", () => {
    for (const solutionSource of [null, "", "   ", undefined]) {
      const result = evaluatePublicationGates(
        gates({ approvals: [active(null), { status: "ACTIVE", solutionSource }] }),
      );
      expect(result.solutionReady).toBe(false);
      expect(result.ready).toBe(false);
      expect(result.missing).toContain("a reference solution from a reviewer");
    }
  });

  it("blocks on OPEN and ADDRESSED holds but not RESOLVED ones", () => {
    for (const status of ["OPEN", "ADDRESSED"] as const) {
      const result = evaluatePublicationGates(gates({ holds: [hold(status)] }));
      expect(result.holdsClear).toBe(false);
      expect(result.ready).toBe(false);
      expect(result.approvalCount).toBe(2);
      expect(result.missing.filter((item) => item === "resolving every open hold")).toHaveLength(1);
    }

    const resolved = evaluatePublicationGates(gates({ holds: [hold("RESOLVED"), hold("RESOLVED")] }));
    expect(resolved.holdsClear).toBe(true);
    expect(resolved.ready).toBe(true);
  });

  it("stays ready beyond the required approvals and keeps ready in sync with missing", () => {
    const extra = evaluatePublicationGates(gates({ approvals: [active(), active(), active()] }));
    expect(extra.approvalCount).toBe(3);
    expect(extra.missing).toEqual([]);
    expect(extra.ready).toBe(true);

    const inputs = [
      gates(),
      gates({ approvals: [] }),
      gates({ editorial: null }),
      gates({ reviewerTests: 0 }),
      gates({ holds: [hold("OPEN")] }),
    ];
    for (const input of inputs) {
      const result = evaluatePublicationGates(input);
      expect(result.ready).toBe(result.missing.length === 0);
    }
  });
});

const SUBMIT: SubmitInput = { viewerId: "author", viewerRole: "TEACHER", authorId: "author", status: "DRAFT" };

describe("canSubmitProblemForReview", () => {
  it("allows the author and admins to submit a draft", () => {
    expect(canSubmitProblemForReview(SUBMIT)).toBe(true);
    expect(canSubmitProblemForReview(at(SUBMIT, { viewerRole: "USER" }))).toBe(true);
    expect(canSubmitProblemForReview(at(SUBMIT, ADMIN))).toBe(true);
    expect(canSubmitProblemForReview(at(SUBMIT, { ...ADMIN, authorId: null }))).toBe(true);
  });

  it("rejects other setters, coders, orphaned problems and non-draft states", () => {
    expect(canSubmitProblemForReview(at(SUBMIT, { viewerId: "other" }))).toBe(false);
    expect(canSubmitProblemForReview(at(SUBMIT, CODER))).toBe(false);
    expect(canSubmitProblemForReview(at(SUBMIT, { authorId: null }))).toBe(false);
    for (const status of NOT_DRAFT) {
      expect(canSubmitProblemForReview(at(SUBMIT, { status }))).toBe(false);
      expect(canSubmitProblemForReview(at(SUBMIT, { ...ADMIN, status }))).toBe(false);
    }
  });
});

const EDIT = {
  viewerId: "author",
  viewerRole: "TEACHER" as const,
  authorId: "author",
  status: "DRAFT" as const,
};

describe("canEditProblemContent", () => {
  it("allows the author and admins before review or while fixing a hold", () => {
    expect(canEditProblemContent(EDIT)).toBe(true);
    expect(canEditProblemContent({ ...EDIT, status: "CHANGES_REQUESTED" })).toBe(
      true,
    );
    expect(
      canEditProblemContent({
        ...EDIT,
        viewerId: "admin",
        viewerRole: "ADMIN",
        authorId: "author",
      }),
    ).toBe(true);
    expect(
      canEditProblemContent({
        ...EDIT,
        viewerId: "coder",
        viewerRole: "USER",
        authorId: "coder",
      }),
    ).toBe(true);
  });

  it("locks content while in review or published, even for admins", () => {
    for (const status of ["IN_REVIEW", "PUBLISHED"] as const) {
      expect(canEditProblemContent({ ...EDIT, status })).toBe(false);
      expect(
        canEditProblemContent({
          ...EDIT,
          status,
          viewerId: "admin",
          viewerRole: "ADMIN",
        }),
      ).toBe(false);
    }
  });

  it("rejects other teachers and coders who do not own the problem", () => {
    expect(canEditProblemContent({ ...EDIT, viewerId: "other" })).toBe(false);
    expect(
      canEditProblemContent({
        ...EDIT,
        viewerId: "coder",
        viewerRole: "USER",
        authorId: "author",
      }),
    ).toBe(false);
  });
});

const REVIEW: ReviewInput = {
  viewerId: "reviewer",
  viewerRole: "TEACHER",
  authorId: "author",
  status: "IN_REVIEW",
  activeHoldCount: 0,
  approvedThisCycle: false,
};

describe("canReviewProblem", () => {
  it("allows non-author teachers and admins while in review", () => {
    expect(canReviewProblem(REVIEW)).toBe(true);
    expect(canReviewProblem(at(REVIEW, ADMIN))).toBe(true);
    expect(canReviewProblem(at(REVIEW, { authorId: null }))).toBe(true);
  });

  it("rejects self review, even for admins, and coders", () => {
    expect(canReviewProblem(at(REVIEW, { viewerId: "author" }))).toBe(false);
    expect(canReviewProblem(at(REVIEW, { ...ADMIN, viewerId: "author" }))).toBe(false);
    expect(canReviewProblem(at(REVIEW, CODER))).toBe(false);
  });

  it("rejects reviewers while a hold is open", () => {
    expect(canReviewProblem(at(REVIEW, { activeHoldCount: 1 }))).toBe(false);
    expect(canReviewProblem(at(REVIEW, { activeHoldCount: 2 }))).toBe(false);
  });

  it("rejects reviewers who already approved and problems not in review", () => {
    expect(canReviewProblem(at(REVIEW, { approvedThisCycle: true }))).toBe(false);
    for (const status of NOT_IN_REVIEW) {
      expect(canReviewProblem(at(REVIEW, { status }))).toBe(false);
    }
  });
});

const HOLD: HoldInput = {
  viewerId: "reviewer",
  viewerRole: "TEACHER",
  authorId: "author",
  status: "IN_REVIEW",
  hasActiveHoldByViewer: false,
};

describe("canHoldProblem", () => {
  it("allows non-author teachers and admins while in review", () => {
    expect(canHoldProblem(HOLD)).toBe(true);
    expect(canHoldProblem(at(HOLD, ADMIN))).toBe(true);
  });

  it("rejects self holds, coders, the author and a second hold by the same reviewer", () => {
    expect(canHoldProblem(at(HOLD, { viewerId: "author" }))).toBe(false);
    expect(canHoldProblem(at(HOLD, { ...ADMIN, viewerId: "author" }))).toBe(false);
    expect(canHoldProblem(at(HOLD, CODER))).toBe(false);
    expect(canHoldProblem(at(HOLD, { hasActiveHoldByViewer: true }))).toBe(false);
  });

  it("rejects problems that are not in review", () => {
    for (const status of NOT_IN_REVIEW) {
      expect(canHoldProblem(at(HOLD, { status }))).toBe(false);
    }
  });
});

const PUBLISH: PublishInput = {
  viewerId: "author",
  viewerRole: "TEACHER",
  authorId: "author",
  status: "IN_REVIEW",
  gatesReady: true,
};

describe("canPublishProblem", () => {
  it("allows the author and admins when the gates pass", () => {
    expect(canPublishProblem(PUBLISH)).toBe(true);
    expect(canPublishProblem(at(PUBLISH, { viewerRole: "USER" }))).toBe(true);
    expect(canPublishProblem(at(PUBLISH, { ...ADMIN, authorId: null }))).toBe(true);
  });

  it("rejects other setters and coders who do not own the problem", () => {
    expect(canPublishProblem(at(PUBLISH, { viewerId: "other" }))).toBe(false);
    expect(canPublishProblem(at(PUBLISH, CODER))).toBe(false);
  });

  it("rejects closed gates and problems outside IN_REVIEW, even for admins", () => {
    expect(canPublishProblem(at(PUBLISH, { gatesReady: false }))).toBe(false);
    expect(canPublishProblem(at(PUBLISH, { ...ADMIN, gatesReady: false }))).toBe(false);
    for (const status of NOT_IN_REVIEW) {
      expect(canPublishProblem(at(PUBLISH, { status }))).toBe(false);
      expect(canPublishProblem(at(PUBLISH, { ...ADMIN, status }))).toBe(false);
    }
  });
});

const RESPOND: RespondInput = {
  viewerId: "author",
  viewerRole: "TEACHER",
  authorId: "author",
  status: "CHANGES_REQUESTED",
  holdStatus: "OPEN",
};

describe("canRespondToHold", () => {
  it("allows the author and admins to answer an open hold", () => {
    expect(canRespondToHold(RESPOND)).toBe(true);
    expect(canRespondToHold(at(RESPOND, { ...ADMIN, authorId: null }))).toBe(true);
  });

  it("rejects other setters and coders", () => {
    expect(canRespondToHold(at(RESPOND, { viewerId: "other" }))).toBe(false);
    expect(canRespondToHold(at(RESPOND, CODER))).toBe(false);
  });

  it("rejects addressed, resolved and non-CHANGES_REQUESTED problems", () => {
    expect(canRespondToHold(at(RESPOND, { holdStatus: "ADDRESSED" }))).toBe(false);
    expect(canRespondToHold(at(RESPOND, { holdStatus: "RESOLVED" }))).toBe(false);
    for (const status of ["DRAFT", "IN_REVIEW", "PUBLISHED"] as const) {
      expect(canRespondToHold(at(RESPOND, { status }))).toBe(false);
    }
  });
});

const RESOLVE: ResolveInput = { viewerId: "reviewer", viewerRole: "TEACHER", reviewerId: "reviewer", holdStatus: "ADDRESSED" };

describe("canResolveHold and canReopenHold", () => {
  it("allows the hold raiser and admins on an addressed hold", () => {
    expect(canResolveHold(RESOLVE)).toBe(true);
    expect(canReopenHold(RESOLVE)).toBe(true);
    expect(canResolveHold(at(RESOLVE, ADMIN))).toBe(true);
    expect(canResolveHold(at(RESOLVE, { ...ADMIN, reviewerId: null }))).toBe(true);
  });

  it("rejects other reviewers, coders and holds with no reviewer", () => {
    for (const canAct of [canResolveHold, canReopenHold]) {
      expect(canAct(at(RESOLVE, { viewerId: "other" }))).toBe(false);
      expect(canAct(at(RESOLVE, CODER))).toBe(false);
      expect(canAct(at(RESOLVE, { reviewerId: null }))).toBe(false);
    }
  });

  it("rejects holds that are still open or already resolved", () => {
    for (const canAct of [canResolveHold, canReopenHold]) {
      expect(canAct(at(RESOLVE, { holdStatus: "OPEN" }))).toBe(false);
      expect(canAct(at(RESOLVE, { holdStatus: "RESOLVED" }))).toBe(false);
    }
  });

  it("mirrors the resolve permissions", () => {
    const variants: ResolveInput[] = [
      RESOLVE,
      at(RESOLVE, { viewerId: "other" }),
      at(RESOLVE, ADMIN),
      at(RESOLVE, { holdStatus: "OPEN" }),
      at(RESOLVE, { holdStatus: "RESOLVED" }),
      at(RESOLVE, { reviewerId: null }),
      at(RESOLVE, CODER),
    ];
    for (const variant of variants) {
      expect(canReopenHold(variant)).toBe(canResolveHold(variant));
    }
  });
});

describe("counter helpers", () => {
  it("counts only ACTIVE approvals", () => {
    expect(countActiveApprovals([])).toBe(0);
    expect(countActiveApprovals([superseded()])).toBe(0);
    expect(countActiveApprovals([active(), superseded(), active()])).toBe(2);
  });

  it("counts OPEN and ADDRESSED holds as blocking", () => {
    expect(countBlockingHolds([])).toBe(0);
    expect(countBlockingHolds([hold("RESOLVED")])).toBe(0);
    expect(countBlockingHolds([hold("OPEN")])).toBe(1);
    expect(countBlockingHolds([hold("OPEN"), hold("ADDRESSED"), hold("RESOLVED")])).toBe(2);
  });

  it("classifies staff roles and author matches", () => {
    expect(isStaffRole("TEACHER")).toBe(true);
    expect(isStaffRole("ADMIN")).toBe(true);
    expect(isStaffRole("USER")).toBe(false);
    expect(isProblemAuthor("author", "author")).toBe(true);
    expect(isProblemAuthor("someone", "author")).toBe(false);
    expect(isProblemAuthor("author", null)).toBe(false);
    expect(isProblemAuthor("", null)).toBe(false);
  });
});
