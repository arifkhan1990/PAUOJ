import { describe, expect, it } from "vitest";
import { submissionNoteInputSchema } from "./submission";

describe("submissionNoteInputSchema", () => {
  it("trims and accepts a normal note", () => {
    const parsed = submissionNoteInputSchema.parse({
      body: "  off by one in the binary search  ",
    });
    expect(parsed.body).toBe("off by one in the binary search");
  });

  it("rejects empty and oversized notes", () => {
    expect(submissionNoteInputSchema.safeParse({ body: "   " }).success).toBe(
      false,
    );
    expect(
      submissionNoteInputSchema.safeParse({ body: "x".repeat(2_001) }).success,
    ).toBe(false);
  });

  it("accepts the maximum length after trimming", () => {
    const body = `  ${"x".repeat(2_000)}  `;
    expect(submissionNoteInputSchema.parse({ body }).body).toHaveLength(2_000);
  });
});
