import { describe, expect, it } from "vitest";
import {
  LIVE_PRIORITY,
  PRACTICE_PRIORITY,
  submissionPriority,
} from "./queue";

describe("submissionPriority", () => {
  it("prioritizes live contest submissions", () => {
    expect(
      submissionPriority({
        contestId: "c1",
        assessmentId: null,
        virtualContestId: null,
      }),
    ).toBe(LIVE_PRIORITY);
  });

  it("prioritizes live assessment submissions", () => {
    expect(
      submissionPriority({
        contestId: null,
        assessmentId: "a1",
        virtualContestId: null,
      }),
    ).toBe(LIVE_PRIORITY);
  });

  it("keeps practice submissions in the practice tier", () => {
    expect(
      submissionPriority({
        contestId: null,
        assessmentId: null,
        virtualContestId: null,
      }),
    ).toBe(PRACTICE_PRIORITY);
  });

  it("keeps virtual contest submissions in the practice tier", () => {
    expect(
      submissionPriority({
        contestId: "c1",
        assessmentId: null,
        virtualContestId: "v1",
      }),
    ).toBe(PRACTICE_PRIORITY);
  });

  it("keeps the live tier strictly higher than practice", () => {
    expect(LIVE_PRIORITY).toBeLessThan(PRACTICE_PRIORITY);
  });
});
