import { describe, expect, it } from "vitest";
import {
  findMatchingSample,
  normalizeRunText,
  outputsMatch,
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
