import { describe, expect, it } from "vitest";
import {
  forgotPasswordSchema,
  profileSchema,
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

describe("profileSchema detail fields", () => {
  const base = { displayName: "Arif Khan" };

  it("leaves omitted fields undefined so stored values are preserved", () => {
    const parsed = profileSchema.parse(base);
    expect(parsed.address).toBeUndefined();
    expect(parsed.phone).toBeUndefined();
    expect(parsed.currentStatus).toBeUndefined();
    expect(parsed.companyName).toBeUndefined();
    expect(parsed.jobTitle).toBeUndefined();
    expect(parsed.skills).toBeUndefined();
    expect(parsed.tshirtSize).toBeUndefined();
  });

  it("clears blank text, enums and skills", () => {
    const parsed = profileSchema.parse({
      ...base,
      address: "   ",
      phone: "",
      currentStatus: "",
      companyName: "",
      jobTitle: "",
      skills: [],
      tshirtSize: "",
    });
    expect(parsed.address).toBeNull();
    expect(parsed.phone).toBeNull();
    expect(parsed.currentStatus).toBeNull();
    expect(parsed.companyName).toBeNull();
    expect(parsed.jobTitle).toBeNull();
    expect(parsed.skills).toEqual([]);
    expect(parsed.tshirtSize).toBeNull();
  });

  it("normalizes a Bangladeshi phone and trimmed skills", () => {
    const parsed = profileSchema.parse({
      ...base,
      phone: "01712-345678",
      skills: ["  React ", "react", "Node  JS"],
    });
    expect(parsed.phone).toBe("+8801712345678");
    expect(parsed.skills).toEqual(["React", "Node JS"]);
  });

  it("rejects an invalid phone with an issue on the phone field", () => {
    const result = profileSchema.safeParse({ ...base, phone: "01712abc678" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.path).toEqual(["phone"]);
    }
  });

  it("rejects more than 12 skills", () => {
    const skills = Array.from({ length: 13 }, (_, index) => `skill-${index}`);
    expect(profileSchema.safeParse({ ...base, skills }).success).toBe(false);
  });

  it("rejects a skill longer than 30 characters", () => {
    expect(
      profileSchema.safeParse({ ...base, skills: ["x".repeat(31)] }).success,
    ).toBe(false);
  });

  it("rejects an address or company name over the limit", () => {
    expect(
      profileSchema.safeParse({ ...base, address: "a".repeat(201) }).success,
    ).toBe(false);
    expect(
      profileSchema.safeParse({ ...base, companyName: "c".repeat(121) })
        .success,
    ).toBe(false);
  });

  it("rejects unknown status and t-shirt values", () => {
    expect(
      profileSchema.safeParse({ ...base, currentStatus: "RETIRED" }).success,
    ).toBe(false);
    expect(
      profileSchema.safeParse({ ...base, tshirtSize: "4XL" }).success,
    ).toBe(false);
  });
});
