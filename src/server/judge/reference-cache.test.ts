import { describe, expect, it } from "vitest";
import { referenceCacheKey } from "./reference-cache";

const reference = {
  language: "sql",
  source: "SELECT 1;",
  sqlScript: false,
};

describe("referenceCacheKey", () => {
  it("is deterministic for the same reference and input", () => {
    expect(referenceCacheKey(reference, "1 2\n")).toBe(
      referenceCacheKey({ ...reference }, "1 2\n"),
    );
  });

  it("is a namespaced sha256 key", () => {
    expect(referenceCacheKey(reference, "")).toMatch(
      /^pauoj:reference-output:[0-9a-f]{64}$/,
    );
  });

  it("changes with the stdin", () => {
    expect(referenceCacheKey(reference, "1 2\n")).not.toBe(
      referenceCacheKey(reference, "1 3\n"),
    );
  });

  it("changes with the reference source", () => {
    expect(referenceCacheKey(reference, "x")).not.toBe(
      referenceCacheKey({ ...reference, source: "SELECT 2;" }, "x"),
    );
  });

  it("changes with the reference language", () => {
    expect(referenceCacheKey(reference, "x")).not.toBe(
      referenceCacheKey({ ...reference, language: "python" }, "x"),
    );
  });

  it("changes with the script mode", () => {
    expect(referenceCacheKey(reference, "x")).not.toBe(
      referenceCacheKey({ ...reference, sqlScript: true }, "x"),
    );
  });
});
