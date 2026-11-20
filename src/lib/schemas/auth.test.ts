import { describe, expect, it } from "vitest";
import {
  forgotPasswordSchema,
  resetPasswordSchema,
  verifyEmailSchema,
} from "./auth";

describe("forgotPasswordSchema", () => {
  it("normalizes email addresses", () => {
    const parsed = forgotPasswordSchema.parse({ email: " USER@Example.COM " });
    expect(parsed.email).toBe("user@example.com");
  });

  it("rejects invalid emails", () => {
    expect(forgotPasswordSchema.safeParse({ email: "nope" }).success).toBe(false);
  });
});

describe("resetPasswordSchema", () => {
  it("requires matching passwords", () => {
    const result = resetPasswordSchema.safeParse({
      token: "a".repeat(32),
      newPassword: "NewSecret123",
      confirmPassword: "Different123",
    });
    expect(result.success).toBe(false);
  });

  it("accepts a valid reset payload", () => {
    const result = resetPasswordSchema.safeParse({
      token: "a".repeat(32),
      newPassword: "NewSecret123",
      confirmPassword: "NewSecret123",
    });
    expect(result.success).toBe(true);
  });
});

describe("verifyEmailSchema", () => {
  it("requires a token", () => {
    expect(verifyEmailSchema.safeParse({ token: "short" }).success).toBe(false);
  });
});
