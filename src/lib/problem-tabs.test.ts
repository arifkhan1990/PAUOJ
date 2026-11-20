import { describe, expect, it } from "vitest";
import { parseProblemTab, problemTabHref } from "./problem-tabs";

describe("parseProblemTab", () => {
  it("accepts known tabs and falls back to description", () => {
    expect(parseProblemTab("rankboard")).toBe("rankboard");
    expect(parseProblemTab("submissions")).toBe("submissions");
    expect(parseProblemTab("discussion")).toBe("discussion");
    expect(parseProblemTab("stats")).toBe("description");
    expect(parseProblemTab("forum")).toBe("description");
    expect(parseProblemTab(undefined)).toBe("description");
  });
});

describe("problemTabHref", () => {
  it("keeps the description URL clean and names the other tabs", () => {
    expect(problemTabHref("two-sum", "description")).toBe("/problems/two-sum");
    expect(problemTabHref("two-sum", "submissions")).toBe(
      "/problems/two-sum?tab=submissions",
    );
  });
});
