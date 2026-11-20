import { describe, expect, it } from "vitest";
import { studyListInputSchema } from "./study-list";

const base = {
  title: "Array foundations",
  description: "A short ordered path through arrays.",
  isPublic: true,
  problemIds: ["00000000-0000-4000-8000-000000000001"],
};

describe("studyListInputSchema", () => {
  it("accepts a valid list", () => {
    expect(studyListInputSchema.safeParse(base).success).toBe(true);
  });

  it("requires at least one problem", () => {
    expect(
      studyListInputSchema.safeParse({ ...base, problemIds: [] }).success,
    ).toBe(false);
  });

  it("rejects invalid slugs", () => {
    expect(
      studyListInputSchema.safeParse({ ...base, slug: "Not Valid" }).success,
    ).toBe(false);
  });
});
