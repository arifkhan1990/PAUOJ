import { describe, expect, it } from "vitest";
import { runStatusForOutcome } from "./run-status";

describe("runStatusForOutcome", () => {
  it("relabels a clean run as EXECUTED instead of ACCEPTED", () => {
    expect(runStatusForOutcome("ACCEPTED")).toBe("EXECUTED");
  });

  it("passes failure verdicts through unchanged", () => {
    expect(runStatusForOutcome("WRONG_ANSWER")).toBe("WRONG_ANSWER");
    expect(runStatusForOutcome("TIME_LIMIT_EXCEEDED")).toBe(
      "TIME_LIMIT_EXCEEDED",
    );
    expect(runStatusForOutcome("COMPILATION_ERROR")).toBe("COMPILATION_ERROR");
    expect(runStatusForOutcome("RUNTIME_ERROR")).toBe("RUNTIME_ERROR");
    expect(runStatusForOutcome("MEMORY_LIMIT_EXCEEDED")).toBe(
      "MEMORY_LIMIT_EXCEEDED",
    );
    expect(runStatusForOutcome("OUTPUT_LIMIT_EXCEEDED")).toBe(
      "OUTPUT_LIMIT_EXCEEDED",
    );
    expect(runStatusForOutcome("SYSTEM_ERROR")).toBe("SYSTEM_ERROR");
  });

  it("keeps pending statuses as they are", () => {
    expect(runStatusForOutcome("QUEUED")).toBe("QUEUED");
    expect(runStatusForOutcome("JUDGING")).toBe("JUDGING");
  });
});
