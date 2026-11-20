import { describe, expect, it } from "vitest";
import {
  contributionDecisionSchema,
  problemContributionInputSchema,
} from "./problem-contribution";

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

describe("problemContributionInputSchema", () => {
  it("accepts statement, test and editorial proposals", () => {
    expect(
      problemContributionInputSchema.safeParse({
        kind: "STATEMENT",
        payload: { statement: "Given two integers, print their sum." },
      }).success,
    ).toBe(true);
    expect(
      problemContributionInputSchema.safeParse({
        kind: "TESTS",
        payload: { tests: [sampleTest, hiddenTest] },
      }).success,
    ).toBe(true);
    expect(
      problemContributionInputSchema.safeParse({
        kind: "EDITORIAL",
        payload: {
          editorial:
            "Read both numbers, add them and print the result in O(1) time.",
        },
      }).success,
    ).toBe(true);
  });

  it("rejects short statements and editorials", () => {
    expect(
      problemContributionInputSchema.safeParse({
        kind: "STATEMENT",
        payload: { statement: "Too short" },
      }).success,
    ).toBe(false);
    expect(
      problemContributionInputSchema.safeParse({
        kind: "EDITORIAL",
        payload: { editorial: "Use a loop." },
      }).success,
    ).toBe(false);
  });

  it("requires both a sample and a hidden test", () => {
    expect(
      problemContributionInputSchema.safeParse({
        kind: "TESTS",
        payload: { tests: [sampleTest] },
      }).success,
    ).toBe(false);
    expect(
      problemContributionInputSchema.safeParse({
        kind: "TESTS",
        payload: { tests: [hiddenTest] },
      }).success,
    ).toBe(false);
  });

  it("rejects unknown proposal kinds", () => {
    expect(
      problemContributionInputSchema.safeParse({
        kind: "TAGS",
        payload: { tags: ["dp"] },
      }).success,
    ).toBe(false);
  });
});

describe("contributionDecisionSchema", () => {
  it("requires a reason when rejecting", () => {
    expect(
      contributionDecisionSchema.safeParse({ action: "reject" }).success,
    ).toBe(false);
    expect(
      contributionDecisionSchema.safeParse({
        action: "reject",
        reviewNote: "The expected output is wrong.",
      }).success,
    ).toBe(true);
  });

  it("allows approving and withdrawing without a note", () => {
    expect(
      contributionDecisionSchema.safeParse({ action: "approve" }).success,
    ).toBe(true);
    expect(
      contributionDecisionSchema.safeParse({ action: "withdraw" }).success,
    ).toBe(true);
  });
});
