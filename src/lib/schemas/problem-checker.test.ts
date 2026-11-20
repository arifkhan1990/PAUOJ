import { describe, expect, it } from "vitest";
import { problemInputSchema } from "./problem";

const base = {
  title: "Custom checker problem",
  statement: "Print any integer between one and ten inclusive.",
  difficulty: "EASY",
  points: 100,
  timeLimitMs: 1000,
  memoryLimitMb: 256,
  isPublic: true,
  tags: ["Implementation"],
  checkerType: "EXACT",
  checkerSource: "",
  floatTolerance: 0.000001,
  tests: [
    { input: "1\n", expectedOutput: "1\n", isSample: true },
    { input: "2\n", expectedOutput: "2\n", isSample: false },
  ],
};

describe("problemInputSchema checkers", () => {
  it("accepts exact and float checkers", () => {
    expect(problemInputSchema.safeParse(base).success).toBe(true);
    expect(
      problemInputSchema.safeParse({
        ...base,
        checkerType: "FLOAT",
        floatTolerance: 0.0001,
      }).success,
    ).toBe(true);
  });

  it("requires a script for a custom checker", () => {
    expect(
      problemInputSchema.safeParse({
        ...base,
        checkerType: "CUSTOM",
        checkerSource: "",
      }).success,
    ).toBe(false);
    expect(
      problemInputSchema.safeParse({
        ...base,
        checkerType: "CUSTOM",
        checkerSource:
          "import sys\nactual = open(sys.argv[3]).read().strip()\nsys.exit(0 if actual.isdigit() else 1)\n",
      }).success,
    ).toBe(true);
  });
});
