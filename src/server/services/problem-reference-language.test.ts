import { describe, expect, it } from "vitest";
import { normalizeReferenceLanguage } from "./problem-reference-language";

describe("normalizeReferenceLanguage", () => {
  it("accepts judge languages case-insensitively", () => {
    expect(normalizeReferenceLanguage("python")).toBe("python");
    expect(normalizeReferenceLanguage(" CPP ")).toBe("cpp");
    expect(normalizeReferenceLanguage("sql")).toBe("sql");
  });

  it("rejects unknown, empty and script-lab markers", () => {
    expect(normalizeReferenceLanguage("")).toBeNull();
    expect(normalizeReferenceLanguage(null)).toBeNull();
    expect(normalizeReferenceLanguage("rust")).toBeNull();
    expect(normalizeReferenceLanguage("sql-script")).toBeNull();
  });
});
