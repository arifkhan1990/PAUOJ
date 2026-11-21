import { describe, expect, it } from "vitest";
import {
  problemReviewActionSchema,
  type ProblemReviewApproveInput,
  type ProblemReviewRespondInput,
  type ProblemReviewResolveInput,
} from "./problem-review";

const HOLD_ID = "8f4e2c1a-9b3d-4f5a-8c7e-1d2b3a4c5d6e";
const OTHER_HOLD_ID = "1a2b3c4d-5e6f-4a7b-8c9d-0e1f2a3b4c5d";
const SOLUTION = "int main() { return 0; }\n";
const EDITORIAL = "Sum both numbers and print the total value in O(1).";
const COMMENT = "Please add a second hidden test before publishing.";

const VALID_APPROVE = {
  action: "approve",
  solutionLanguage: "cpp",
  solutionSource: SOLUTION,
} as const;

const sampleTest = {
  input: "1 2\n",
  expectedOutput: "3\n",
  isSample: true,
};
const hiddenTest = {
  input: "5 7\n",
  expectedOutput: "12\n",
  isSample: false,
};

function approve(input: Record<string, unknown> = {}): ProblemReviewApproveInput {
  const parsed = problemReviewActionSchema.parse({ ...VALID_APPROVE, ...input });
  if (parsed.action !== "approve") {
    throw new Error(`expected an approve action, received ${parsed.action}`);
  }
  return parsed;
}

function approveSucceeds(input: Record<string, unknown> = {}): boolean {
  return problemReviewActionSchema.safeParse({ ...VALID_APPROVE, ...input })
    .success;
}

function respond(input: Record<string, unknown>): boolean {
  return problemReviewActionSchema.safeParse({
    action: "respond",
    holdId: HOLD_ID,
    response: COMMENT,
    ...input,
  }).success;
}

function resolve(input: Record<string, unknown>): boolean {
  return problemReviewActionSchema.safeParse({
    action: "resolve",
    holdId: HOLD_ID,
    ...input,
  }).success;
}

function resolveInput(input: Record<string, unknown> = {}): ProblemReviewResolveInput {
  const parsed = problemReviewActionSchema.parse({
    action: "resolve",
    holdId: HOLD_ID,
    ...input,
  });
  if (parsed.action !== "resolve") {
    throw new Error(`expected a resolve action, received ${parsed.action}`);
  }
  return parsed;
}

function reopen(input: Record<string, unknown>): boolean {
  return problemReviewActionSchema.safeParse({
    action: "reopen",
    holdId: HOLD_ID,
    note: COMMENT,
    ...input,
  }).success;
}

function errorPaths(input: unknown): string[] {
  const result = problemReviewActionSchema.safeParse(input);
  return result.success
    ? []
    : result.error.issues.map((issue) => issue.path.join("."));
}

describe("problemReviewActionSchema approve", () => {
  it("accepts a full payload with solution, note, editorial and tests", () => {
    const parsed = approve({
      note: "  Verified against the official tests.  ",
      editorial: EDITORIAL,
      tests: [sampleTest, hiddenTest],
    });

    expect(parsed.solutionLanguage).toBe("cpp");
    expect(parsed.solutionSource).toBe(SOLUTION.trim());
    expect(parsed.note).toBe("Verified against the official tests.");
    expect(parsed.editorial).toBe(EDITORIAL);
    expect(parsed.tests).toEqual([sampleTest, hiddenTest]);
  });

  it("accepts a minimal payload and defaults tests to an empty array", () => {
    const parsed = approve();

    expect(parsed.tests).toEqual([]);
    expect(parsed.note ?? "").toBe("");
    expect(parsed.editorial ?? "").toBe("");
  });

  it("requires a non-empty reference solution", () => {
    expect(
      problemReviewActionSchema.safeParse({
        action: "approve",
        solutionLanguage: "cpp",
      }).success,
    ).toBe(false);
    expect(approveSucceeds({ solutionSource: "" })).toBe(false);
    expect(approveSucceeds({ solutionSource: "   \n\t " })).toBe(false);
    expect(approveSucceeds({ solutionSource: 12345 })).toBe(false);
    expect(errorPaths({ ...VALID_APPROVE, solutionSource: "" })).toContain(
      "solutionSource",
    );
  });

  it("requires a supported solution language", () => {
    expect(
      problemReviewActionSchema.safeParse({
        action: "approve",
        solutionSource: SOLUTION,
      }).success,
    ).toBe(false);
    expect(approveSucceeds({ solutionLanguage: "rust" })).toBe(false);
    expect(approveSucceeds({ solutionLanguage: "CPP" })).toBe(false);
    expect(approveSucceeds({ solutionLanguage: "" })).toBe(false);
    expect(approveSucceeds({ solutionLanguage: 42 })).toBe(false);
  });

  it("keeps solution source at the 64 KB boundary", () => {
    expect(approveSucceeds({ solutionSource: "a".repeat(65_536) })).toBe(true);
    expect(approveSucceeds({ solutionSource: "a".repeat(65_537) })).toBe(false);
  });

  it("rejects an editorial shorter than 40 characters when provided", () => {
    expect(approveSucceeds({ editorial: "a".repeat(39) })).toBe(false);
    expect(approveSucceeds({ editorial: "a".repeat(40) })).toBe(true);
    expect(approveSucceeds({ editorial: "Use a loop." })).toBe(false);
    expect(errorPaths({ ...VALID_APPROVE, editorial: "Too short" })).toContain(
      "editorial",
    );
  });

  it("treats an empty editorial as not provided", () => {
    expect(approveSucceeds({ editorial: "" })).toBe(true);
    // Whitespace-only input is not normalised to "" because the literal
    // fallback matches the raw value, so it fails the 40 character rule.
    expect(approveSucceeds({ editorial: "   " })).toBe(false);
  });

  it("rejects a null editorial instead of treating it as absent", () => {
    expect(approveSucceeds({ editorial: null })).toBe(false);
  });

  it("accepts up to 20 tests and rejects 21", () => {
    const tests = (count: number) =>
      Array.from({ length: count }, () => ({ ...sampleTest }));

    expect(approveSucceeds({ tests: [] })).toBe(true);
    expect(approveSucceeds({ tests: tests(20) })).toBe(true);
    expect(approveSucceeds({ tests: tests(21) })).toBe(false);
  });

  it("rejects malformed test objects", () => {
    expect(
      approveSucceeds({ tests: [{ expectedOutput: "3\n", isSample: true }] }),
    ).toBe(false);
    expect(approveSucceeds({ tests: [{ input: 1, expectedOutput: "3\n" }] })).toBe(
      false,
    );
    expect(approveSucceeds({ tests: null })).toBe(false);
    expect(
      approveSucceeds({ tests: [{ ...sampleTest, isSample: "yes" }] }),
    ).toBe(false);
  });

  it("defaults a missing isSample flag to false", () => {
    const parsed = approve({ tests: [hiddenTest] });

    expect(parsed.tests[0]?.isSample).toBe(false);
  });

  it("keeps the note optional but limited to 2000 characters", () => {
    expect(approveSucceeds({ note: "" })).toBe(true);
    expect(approveSucceeds({ note: "a".repeat(2_000) })).toBe(true);
    expect(approveSucceeds({ note: "a".repeat(2_001) })).toBe(false);
    expect(approveSucceeds({ note: null })).toBe(false);
  });
});

describe("problemReviewActionSchema hold", () => {
  it("requires a comment of at least 10 characters", () => {
    expect(
      problemReviewActionSchema.safeParse({ action: "hold", note: COMMENT })
        .success,
    ).toBe(true);
    expect(
      problemReviewActionSchema.safeParse({
        action: "hold",
        note: "abcdefghij",
      }).success,
    ).toBe(true);
    expect(
      problemReviewActionSchema.safeParse({ action: "hold", note: "abcdefghi" })
        .success,
    ).toBe(false);
    expect(
      problemReviewActionSchema.safeParse({ action: "hold", note: "    " })
        .success,
    ).toBe(false);
    expect(problemReviewActionSchema.safeParse({ action: "hold" }).success).toBe(
      false,
    );
  });

  it("measures the minimum length after trimming", () => {
    expect(
      problemReviewActionSchema.safeParse({
        action: "hold",
        note: "    abcdefghij    ",
      }).success,
    ).toBe(true);
  });
});

describe("problemReviewActionSchema respond", () => {
  it("requires a hold id and a comment of at least 10 characters", () => {
    expect(respond({})).toBe(true);
    expect(respond({ response: "abcdefghi" })).toBe(false);
    expect(respond({ response: "     " })).toBe(false);
    expect(respond({ response: undefined })).toBe(false);
  });

  it("rejects a missing or malformed hold id", () => {
    expect(respond({ holdId: undefined })).toBe(false);
    expect(respond({ holdId: "" })).toBe(false);
    expect(respond({ holdId: "not-a-uuid" })).toBe(false);
    expect(
      problemReviewActionSchema.safeParse({
        action: "respond",
        holdId: HOLD_ID,
      }).success,
    ).toBe(false);
  });

  it("accepts a trimmed response payload", () => {
    const parsed = problemReviewActionSchema.parse({
      action: "respond",
      holdId: OTHER_HOLD_ID,
      response: `  ${COMMENT}  `,
    });

    expect(parsed.action).toBe("respond");
    expect(
      (parsed as ProblemReviewRespondInput).response,
    ).toBe(COMMENT);
    expect((parsed as ProblemReviewRespondInput).holdId).toBe(OTHER_HOLD_ID);
  });
});

describe("problemReviewActionSchema resolve", () => {
  it("requires a hold id but no note", () => {
    expect(resolve({})).toBe(true);
    expect(resolve({ note: "" })).toBe(true);
    expect(resolve({ note: "Fixed the missing test." })).toBe(true);
    expect(resolve({ holdId: undefined })).toBe(false);
    expect(resolve({ holdId: "nope" })).toBe(false);
  });

  it("returns the optional note trimmed", () => {
    expect(resolveInput({ note: "  Fixed the missing test.  " }).note).toBe(
      "Fixed the missing test.",
    );
  });
});

describe("problemReviewActionSchema reopen", () => {
  it("requires a hold id and a comment of at least 10 characters", () => {
    expect(reopen({})).toBe(true);
    expect(reopen({ note: "abcdefghi" })).toBe(false);
    expect(reopen({ note: undefined })).toBe(false);
    expect(reopen({ holdId: undefined })).toBe(false);
    expect(reopen({ holdId: "12345" })).toBe(false);
  });
});

describe("problemReviewActionSchema actions", () => {
  it("accepts submit, publish and every hold action", () => {
    for (const action of [
      { action: "submit" },
      { action: "publish" },
      { action: "hold", note: COMMENT },
      { action: "respond", holdId: HOLD_ID, response: COMMENT },
      { action: "resolve", holdId: HOLD_ID },
      { action: "reopen", holdId: HOLD_ID, note: COMMENT },
      { action: "reopen_publication", note: COMMENT },
    ]) {
      expect(problemReviewActionSchema.safeParse(action).success).toBe(true);
    }
  });

  it("requires a comment before withdrawing a published problem", () => {
    expect(
      problemReviewActionSchema.safeParse({
        action: "reopen_publication",
        note: "abcdefghi",
      }).success,
    ).toBe(false);
    expect(
      problemReviewActionSchema.safeParse({
        action: "reopen_publication",
        note: COMMENT,
      }).success,
    ).toBe(true);
  });

  it("rejects unknown, missing and mismatched actions", () => {
    expect(
      problemReviewActionSchema.safeParse({ action: "reject", note: COMMENT })
        .success,
    ).toBe(false);
    expect(
      problemReviewActionSchema.safeParse({ action: "delete" }).success,
    ).toBe(false);
    expect(problemReviewActionSchema.safeParse({ action: "APPROVE" }).success).toBe(
      false,
    );
    expect(problemReviewActionSchema.safeParse({ action: "" }).success).toBe(
      false,
    );
    expect(problemReviewActionSchema.safeParse({}).success).toBe(false);
    expect(problemReviewActionSchema.safeParse(null).success).toBe(false);
  });
});
