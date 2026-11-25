import { describe, expect, it } from "vitest";
import {
  compareJudgeOutput,
  normalizeJudgeOutput,
} from "./compare-output";

describe("normalizeJudgeOutput", () => {
  it("normalizes line endings and trailing whitespace like the harness", () => {
    expect(normalizeJudgeOutput("1\r\n2\r3  \n\n")).toBe("1\n2\n3");
    expect(normalizeJudgeOutput("\n\n")).toBe("");
  });
});

describe("compareJudgeOutput", () => {
  it("compares exact output after normalization", () => {
    expect(compareJudgeOutput("300\n", "300", "EXACT", 1e-6)).toBe(true);
    expect(compareJudgeOutput("300", "301", "EXACT", 1e-6)).toBe(false);
  });

  it("compares token streams", () => {
    expect(compareJudgeOutput("1  2\n3", "1 2 3", "TOKEN", 1e-6)).toBe(true);
    expect(compareJudgeOutput("1 2", "1 3", "TOKEN", 1e-6)).toBe(false);
  });

  it("compares floats with tolerance", () => {
    expect(compareJudgeOutput("1.0000001 2.5", "1 2.5", "FLOAT", 1e-6)).toBe(true);
    expect(compareJudgeOutput("1.1", "1", "FLOAT", 1e-6)).toBe(false);
    expect(compareJudgeOutput("abc", "1", "FLOAT", 1e-6)).toBe(false);
  });

  it("returns unknown for a custom checker", () => {
    expect(compareJudgeOutput("a", "a", "CUSTOM", 1e-6)).toBeNull();
  });
});
