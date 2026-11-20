import { describe, expect, it } from "vitest";
import {
  problemRatingSchema,
  problemResourceSchema,
} from "./problem-extras";

describe("problemRatingSchema", () => {
  it("accepts half-star ratings from 0.5 to 5", () => {
    expect(problemRatingSchema.safeParse({ rating: 0.5 }).success).toBe(true);
    expect(problemRatingSchema.safeParse({ rating: 4.5 }).success).toBe(true);
    expect(problemRatingSchema.safeParse({ rating: 5 }).success).toBe(true);
  });

  it("rejects out-of-range and non-half values", () => {
    expect(problemRatingSchema.safeParse({ rating: 0 }).success).toBe(false);
    expect(problemRatingSchema.safeParse({ rating: 5.5 }).success).toBe(false);
    expect(problemRatingSchema.safeParse({ rating: 4.2 }).success).toBe(false);
  });
});

describe("problemResourceSchema", () => {
  it("accepts http(s) links", () => {
    expect(
      problemResourceSchema.safeParse({
        title: "Editorial",
        url: "https://example.com/editorial",
      }).success,
    ).toBe(true);
  });

  it("rejects non-http links and short titles", () => {
    expect(
      problemResourceSchema.safeParse({
        title: "X",
        url: "https://example.com",
      }).success,
    ).toBe(false);
    expect(
      problemResourceSchema.safeParse({
        title: "Editorial",
        url: "javascript:alert(1)",
      }).success,
    ).toBe(false);
  });
});
