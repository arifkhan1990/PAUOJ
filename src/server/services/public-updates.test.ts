import { describe, expect, it } from "vitest";
import { safeInternalHref } from "./public-updates";

describe("safeInternalHref", () => {
  it("keeps same-origin absolute paths", () => {
    expect(safeInternalHref("/contests/x")).toBe("/contests/x");
    expect(safeInternalHref("/")).toBe("/");
    expect(safeInternalHref("/learn/dp?tab=notes#top")).toBe(
      "/learn/dp?tab=notes#top",
    );
    expect(safeInternalHref(`/${"a".repeat(499)}`)).toHaveLength(500);
  });

  it("drops empty and missing hrefs", () => {
    expect(safeInternalHref(null)).toBeNull();
    expect(safeInternalHref("")).toBeNull();
  });

  it("rejects protocol-relative and absolute URLs", () => {
    expect(safeInternalHref("//evil.com")).toBeNull();
    expect(safeInternalHref("///evil.com")).toBeNull();
    expect(safeInternalHref("https://evil.com")).toBeNull();
    expect(safeInternalHref("http://evil.com/path")).toBeNull();
    expect(safeInternalHref("javascript:alert(1)")).toBeNull();
  });

  it("rejects backslashes and control characters", () => {
    expect(safeInternalHref("\\evil")).toBeNull();
    expect(safeInternalHref("/a\\b")).toBeNull();
    expect(safeInternalHref("/a\u0000b")).toBeNull();
    expect(safeInternalHref("/a\nb")).toBeNull();
    expect(safeInternalHref("/a\u007fb")).toBeNull();
    expect(safeInternalHref(" /contests/x")).toBeNull();
  });

  it("rejects hrefs longer than 500 characters", () => {
    expect(safeInternalHref(`/${"a".repeat(500)}`)).toBeNull();
  });
});
