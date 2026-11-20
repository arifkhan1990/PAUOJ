import { describe, expect, it } from "vitest";
import { safeNext } from "./auth-redirect";
import { slugify } from "./utils";

describe("safeNext", () => {
  it("accepts local paths", () => {
    expect(safeNext("/problems/a-plus-b")).toBe("/problems/a-plus-b");
  });

  it("rejects protocol-relative and absolute URLs", () => {
    expect(safeNext("//evil.example")).toBe("/");
    expect(safeNext("https://evil.example")).toBe("/");
    expect(safeNext("/\\evil.example")).toBe("/");
  });

  it("uses the fallback for missing values", () => {
    expect(safeNext(undefined, "/problems")).toBe("/problems");
  });
});

describe("slugify", () => {
  it("creates URL-safe slugs", () => {
    expect(slugify("A + B (Classic)")).toBe("a-b-classic");
    expect(slugify("  Hello   World  ")).toBe("hello-world");
  });
});
