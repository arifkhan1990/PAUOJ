import { describe, expect, it } from "vitest";
import { verdictMeta } from "./verdicts";

describe("verdictMeta", () => {
  it("renders a custom run as neutral Ran, not a judge error", () => {
    const meta = verdictMeta("EXECUTED");
    expect(meta.label).toBe("Ran");
    expect(meta.short).toBe("Ran");
    expect(meta.description).toContain("not judged");
  });

  it("keeps submission verdict metadata unchanged", () => {
    expect(verdictMeta("ACCEPTED").short).toBe("AC");
    expect(verdictMeta("WRONG_ANSWER").short).toBe("WA");
    expect(verdictMeta("UNKNOWN").short).toBe("IE");
  });
});
