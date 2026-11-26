import { describe, expect, it } from "vitest";
import { referenceFromApproval } from "./problem-reference-approval";

describe("referenceFromApproval", () => {
  it("accepts a python solution and trims the source", () => {
    expect(
      referenceFromApproval({
        solutionLanguage: "python",
        solutionSource: "  print(input())\n",
      }),
    ).toEqual({ language: "python", source: "print(input())" });
  });

  it("normalizes the language case-insensitively", () => {
    expect(
      referenceFromApproval({
        solutionLanguage: " CPP ",
        solutionSource: "int main() { return 0; }",
      }),
    ).toEqual({
      language: "cpp",
      source: "int main() { return 0; }",
    });
  });

  it("keeps inner whitespace but drops a whitespace-only source", () => {
    expect(
      referenceFromApproval({
        solutionLanguage: "cpp",
        solutionSource: "int  main() {\n  return 0;\n}",
      }),
    ).toEqual({
      language: "cpp",
      source: "int  main() {\n  return 0;\n}",
    });
    expect(
      referenceFromApproval({
        solutionLanguage: "cpp",
        solutionSource: "   \n\t ",
      }),
    ).toBeNull();
  });

  it("rejects an empty source", () => {
    expect(
      referenceFromApproval({
        solutionLanguage: "python",
        solutionSource: "",
      }),
    ).toBeNull();
  });

  it("rejects an unknown or script-lab language", () => {
    expect(
      referenceFromApproval({
        solutionLanguage: "rust",
        solutionSource: "fn main() {}",
      }),
    ).toBeNull();
    expect(
      referenceFromApproval({
        solutionLanguage: "sql-script",
        solutionSource: "select 1;",
      }),
    ).toBeNull();
  });
});
