import { describe, expect, it } from "vitest";
import {
  findMatchingSample,
  normalizeRunText,
  outputsMatch,
  resolveRunComparison,
  shouldShowNoOutputNotice,
} from "./run-sample";

describe("normalizeRunText", () => {
  it("converts CRLF and lone CR to LF", () => {
    expect(normalizeRunText("1\r\n2\r3\r\n")).toBe("1\n2\n3");
  });

  it("strips trailing spaces and tabs per line", () => {
    expect(normalizeRunText("a  \nb\t\n  c \t \n")).toBe("a\nb\n  c");
  });

  it("drops trailing blank lines but keeps inner ones", () => {
    expect(normalizeRunText("a\n\nb\n\n\n")).toBe("a\n\nb");
    expect(normalizeRunText("\n\n")).toBe("");
  });

  it("leaves leading blank lines alone", () => {
    expect(normalizeRunText("\n\nx")).toBe("\n\nx");
  });
});

describe("outputsMatch", () => {
  it("ignores line-ending and trailing-whitespace differences", () => {
    expect(outputsMatch("300\r\n", "300\n")).toBe(true);
    expect(outputsMatch("a  \nb\n\n", "a\nb")).toBe(true);
  });

  it("rejects empty output when the expected output is not empty", () => {
    expect(outputsMatch("", "300")).toBe(false);
    expect(outputsMatch("300", "")).toBe(false);
    expect(outputsMatch("", "")).toBe(true);
  });

  it("rejects a different answer", () => {
    expect(outputsMatch("250", "300")).toBe(false);
  });
});

describe("findMatchingSample", () => {
  const samples = [
    { input: "5\n50 75 100 25 50\n", output: "300" },
    { input: "1\n7\n", output: "7" },
  ];

  it("matches on normalized input", () => {
    const match = findMatchingSample(samples, "5\r\n50 75 100 25 50   \r\n\r\n");
    expect(match?.index).toBe(0);
    expect(match?.sample.output).toBe("300");
  });

  it("returns null when no sample input matches", () => {
    expect(findMatchingSample(samples, "3\n1 2 3\n")).toBeNull();
  });

  it("can match an empty sample input", () => {
    const match = findMatchingSample([{ input: "", output: "0" }], "\n\n");
    expect(match?.index).toBe(0);
  });
});

describe("resolveRunComparison", () => {
  const samples = [{ input: "1\n7\n", output: "7" }];

  it("lets an official sample win over the server expected output", () => {
    const comparison = resolveRunComparison({
      samples,
      stdin: "1\n7\n",
      stdout: "7\n",
      expectedOutput: "999",
      matchesExpected: false,
    });
    expect(comparison).toEqual({ kind: "sample", expected: "7", matches: true });
  });

  it("still reports a differing sample even when the reference output is missing", () => {
    const comparison = resolveRunComparison({
      samples,
      stdin: "1\n7\n",
      stdout: "8",
      expectedOutput: null,
      matchesExpected: null,
    });
    expect(comparison).toEqual({ kind: "sample", expected: "7", matches: false });
  });

  it("uses the reference output for a non-sample input", () => {
    const base = {
      samples,
      stdin: "3\n1 2 3\n",
      stdout: "6",
      expectedOutput: "6",
    };
    expect(resolveRunComparison({ ...base, matchesExpected: true })).toEqual({
      kind: "reference",
      expected: "6",
      matches: true,
    });
    expect(resolveRunComparison({ ...base, matchesExpected: false })).toEqual({
      kind: "reference",
      expected: "6",
      matches: false,
    });
    expect(resolveRunComparison({ ...base, matchesExpected: null })).toEqual({
      kind: "reference",
      expected: "6",
      matches: null,
    });
    expect(resolveRunComparison({ ...base, matchesExpected: undefined })).toEqual({
      kind: "reference",
      expected: "6",
      matches: null,
    });
  });

  it("treats an empty reference output as present, not missing", () => {
    const comparison = resolveRunComparison({
      samples,
      stdin: "3\n1 2 3\n",
      stdout: "",
      expectedOutput: "",
      matchesExpected: true,
    });
    expect(comparison).toEqual({ kind: "reference", expected: "", matches: true });
  });

  it("returns none when neither a sample nor a reference output exists", () => {
    expect(
      resolveRunComparison({
        samples,
        stdin: "3\n1 2 3\n",
        stdout: "6",
        expectedOutput: null,
      }),
    ).toEqual({ kind: "none", expected: null, matches: null });
    expect(
      resolveRunComparison({ samples: [], stdin: "", stdout: "6" }),
    ).toEqual({ kind: "none", expected: null, matches: null });
  });

  it("marks empty stdout as differing from a non-empty expected output", () => {
    expect(
      resolveRunComparison({
        samples,
        stdin: "3\n1 2 3\n",
        stdout: "",
        expectedOutput: "6",
        matchesExpected: false,
      }).matches,
    ).toBe(false);
    expect(
      resolveRunComparison({
        samples: [{ input: "0\n", output: "6" }],
        stdin: "0\n",
        stdout: "",
      }).matches,
    ).toBe(false);
  });
});

describe("shouldShowNoOutputNotice", () => {
  const base = { finished: true, stdout: "", stderr: "" };

  it("shows only for a clean empty custom run", () => {
    expect(shouldShowNoOutputNotice({ ...base, status: "EXECUTED" })).toBe(true);
    expect(shouldShowNoOutputNotice({ ...base, status: "ACCEPTED" })).toBe(true);
    expect(shouldShowNoOutputNotice({ ...base, status: "EXECUTED", stdout: "hi" })).toBe(false);
    expect(shouldShowNoOutputNotice({ ...base, status: "EXECUTED", stderr: "warn" })).toBe(false);
    expect(shouldShowNoOutputNotice({ ...base, status: "EXECUTED", finished: false })).toBe(false);
  });

  it("hides the note for failed runs even with empty output", () => {
    for (const status of [
      "COMPILATION_ERROR",
      "RUNTIME_ERROR",
      "TIME_LIMIT_EXCEEDED",
      "MEMORY_LIMIT_EXCEEDED",
      "OUTPUT_LIMIT_EXCEEDED",
      "SYSTEM_ERROR",
    ]) {
      expect(shouldShowNoOutputNotice({ ...base, status })).toBe(false);
    }
  });
});
