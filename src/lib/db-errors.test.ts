import { describe, expect, it } from "vitest";
import {
  isMissingMigrationError,
  isUniqueViolation,
  postgresErrorCode,
} from "@/lib/db-errors";

describe("postgresErrorCode", () => {
  it("reads a top-level code", () => {
    expect(postgresErrorCode({ code: "23505" })).toBe("23505");
  });

  it("follows Drizzle's wrapped cause chain", () => {
    const wrapped = {
      name: "DrizzleQueryError",
      message: "Failed query",
      cause: { code: "23505", constraint_name: "lesson_comment_reports_comment_reporter_unique" },
    };
    expect(postgresErrorCode(wrapped)).toBe("23505");
  });

  it("returns undefined for unrelated errors", () => {
    expect(postgresErrorCode(new Error("boom"))).toBeUndefined();
    expect(postgresErrorCode(null)).toBeUndefined();
  });
});

describe("isMissingMigrationError", () => {
  it("detects missing tables and columns, including wrapped errors", () => {
    expect(isMissingMigrationError({ code: "42P01" })).toBe(true);
    expect(isMissingMigrationError({ cause: { code: "42703" } })).toBe(true);
  });

  it("ignores unrelated errors", () => {
    expect(isMissingMigrationError({ code: "23505" })).toBe(false);
    expect(isMissingMigrationError(new Error("boom"))).toBe(false);
    expect(isMissingMigrationError(null)).toBe(false);
  });
});

describe("isUniqueViolation", () => {
  it("matches 23505 at any depth", () => {
    expect(isUniqueViolation({ code: "23505" })).toBe(true);
    expect(isUniqueViolation({ cause: { code: "23505" } })).toBe(true);
    expect(isUniqueViolation({ code: "42P01" })).toBe(false);
  });
});
