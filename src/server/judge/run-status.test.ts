import { describe, expect, it } from "vitest";
import {
  normalizeStoredRunResult,
  runStatusForOutcome,
} from "./run-status";

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

describe("normalizeStoredRunResult", () => {
  const base = {
    id: "8b623327-abcb-4f33-9396-a86092d961fb",
    stdout: "",
    stderr: "",
    compileOutput: "",
    runtimeMs: 8,
    memoryKb: 10100,
    finished: true,
  };

  it("upgrades a legacy cached ACCEPTED result to EXECUTED", () => {
    expect(normalizeStoredRunResult({ ...base, status: "ACCEPTED" }).status).toBe(
      "EXECUTED",
    );
  });

  it("leaves new and failed run statuses untouched", () => {
    expect(normalizeStoredRunResult({ ...base, status: "EXECUTED" }).status).toBe(
      "EXECUTED",
    );
    expect(
      normalizeStoredRunResult({ ...base, status: "WRONG_ANSWER" }).status,
    ).toBe("WRONG_ANSWER");
    expect(
      normalizeStoredRunResult({ ...base, status: "COMPILATION_ERROR" }).status,
    ).toBe("COMPILATION_ERROR");
  });
});
