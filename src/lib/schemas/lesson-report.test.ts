import { describe, expect, it } from "vitest";
import { reportCommentSchema } from "@/lib/schemas/lesson-report";

describe("reportCommentSchema", () => {
  it("accepts a trimmed reason", () => {
    expect(reportCommentSchema.parse({ reason: "  spam link  " })).toEqual({
      reason: "spam link",
    });
  });

  it("rejects short or empty reasons", () => {
    expect(reportCommentSchema.safeParse({ reason: "hi" }).success).toBe(false);
    expect(reportCommentSchema.safeParse({ reason: "    " }).success).toBe(false);
  });

  it("rejects reasons over 300 characters", () => {
    expect(
      reportCommentSchema.safeParse({ reason: "x".repeat(301) }).success,
    ).toBe(false);
  });
});
