import { describe, expect, it } from "vitest";
import {
  AdminRecoveryError,
  DEFAULT_SEED_PASSWORD,
  assertPromotionAllowed,
  assertRecoveryPassword,
  planAdminRecovery,
} from "./admin-recovery";

describe("assertRecoveryPassword", () => {
  it("rejects the default seed password", () => {
    expect(() => assertRecoveryPassword(DEFAULT_SEED_PASSWORD)).toThrow(
      AdminRecoveryError,
    );
    expect(() => assertRecoveryPassword(DEFAULT_SEED_PASSWORD)).toThrow(
      /default seed password/i,
    );
  });

  it("rejects passwords shorter than 12 characters", () => {
    expect(() => assertRecoveryPassword("Sh0rt!pass")).toThrow(AdminRecoveryError);
    expect(() => assertRecoveryPassword("QaRecover#1")).toThrow(/12 characters/);
  });

  it("rejects blank passwords", () => {
    expect(() => assertRecoveryPassword("")).toThrow(AdminRecoveryError);
    expect(() => assertRecoveryPassword("            ")).toThrow(
      /must not be empty/,
    );
  });

  it("accepts a long password", () => {
    expect(() => assertRecoveryPassword("QaRecover#12345")).not.toThrow();
  });

  it("rejects the seed username or email, case-insensitively", () => {
    const identifiers = {
      username: "Recovery-Operator",
      email: "Recovery-Operator@Example.Test",
    };

    expect(() =>
      assertRecoveryPassword("recovery-operator", identifiers),
    ).toThrow(/username or email/);
    expect(() =>
      assertRecoveryPassword("RECOVERY-OPERATOR@example.test", identifiers),
    ).toThrow(/username or email/);
  });
});

describe("assertPromotionAllowed", () => {
  it("allows an existing admin without --promote", () => {
    expect(() => assertPromotionAllowed("ADMIN", false)).not.toThrow();
  });

  it("refuses a non-admin match without --promote", () => {
    expect(() => assertPromotionAllowed("USER", false)).toThrow(
      /rerun with --promote/,
    );
    expect(() => assertPromotionAllowed("TEACHER", false)).toThrow(
      /TEACHER/,
    );
  });

  it("allows an explicit promotion", () => {
    expect(() => assertPromotionAllowed("USER", true)).not.toThrow();
  });
});

describe("planAdminRecovery", () => {
  it("creates when nothing matches", () => {
    expect(planAdminRecovery([])).toEqual({ kind: "create" });
  });

  it("updates the single matching account", () => {
    const rows = [
      { id: "user-1", username: "admin", email: "admin@pauoj.local" },
    ];

    expect(planAdminRecovery(rows)).toEqual({
      kind: "update",
      userId: "user-1",
    });
  });

  it("updates when the duplicate rows are the same account", () => {
    const row = { id: "user-1", username: "admin", email: "admin@pauoj.local" };

    expect(planAdminRecovery([row, row])).toEqual({
      kind: "update",
      userId: "user-1",
    });
  });

  it("refuses when the identifiers belong to two accounts", () => {
    const plan = planAdminRecovery([
      { id: "user-1", username: "admin", email: "other@example.test" },
      { id: "user-2", username: "someone", email: "admin@pauoj.local" },
    ]);

    expect(plan.kind).toBe("conflict");
  });
});
