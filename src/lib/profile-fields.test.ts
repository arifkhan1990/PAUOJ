import { describe, expect, it } from "vitest";
import {
  normalizeSkills,
  parsePhone,
  TSHIRT_SIZE_LABELS,
  TSHIRT_SIZE_OPTIONS,
  TSHIRT_SIZE_VALUES,
  USER_STATUS_LABELS,
  USER_STATUS_OPTIONS,
  USER_STATUS_VALUES,
} from "./profile-fields";

describe("parsePhone", () => {
  it("treats blank input as cleared", () => {
    expect(parsePhone("")).toEqual({ ok: true, value: null });
    expect(parsePhone("   ")).toEqual({ ok: true, value: null });
  });

  it("normalizes Bangladeshi local numbers", () => {
    expect(parsePhone("01712345678")).toEqual({
      ok: true,
      value: "+8801712345678",
    });
    expect(parsePhone("01712-345678")).toEqual({
      ok: true,
      value: "+8801712345678",
    });
  });

  it("normalizes Bangladeshi numbers with the country code", () => {
    expect(parsePhone("8801712345678")).toEqual({
      ok: true,
      value: "+8801712345678",
    });
    expect(parsePhone("+8801712345678")).toEqual({
      ok: true,
      value: "+8801712345678",
    });
  });

  it("accepts international numbers and strips separators", () => {
    expect(parsePhone("+1 (415) 555-2671")).toEqual({
      ok: true,
      value: "+14155552671",
    });
    expect(parsePhone("+44 20.7946.0958")).toEqual({
      ok: true,
      value: "+442079460958",
    });
  });

  it("rejects letters", () => {
    const result = parsePhone("01712abc678");
    expect(result.ok).toBe(false);
  });

  it("rejects numbers without a country code that are not Bangladeshi", () => {
    const result = parsePhone("4155552671");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.message).toMatch(/Bangladeshi|country code/);
  });

  it("rejects too short or too long numbers", () => {
    expect(parsePhone("+1234").ok).toBe(false);
    expect(parsePhone("+1234567890123456").ok).toBe(false);
    expect(parsePhone("0123456789").ok).toBe(false);
  });

  it("rejects input longer than 20 characters", () => {
    const result = parsePhone("+880 1712 345 678 9999");
    expect(result.ok).toBe(false);
  });
});

describe("normalizeSkills", () => {
  it("trims, collapses whitespace and strips control characters", () => {
    expect(normalizeSkills(["  React  Native ", "Node\u0000JS"])).toEqual([
      "React Native",
      "Node JS",
    ]);
  });

  it("dedupes case-insensitively, keeping first casing and order", () => {
    expect(normalizeSkills(["React", "react", "Node", "REACT", "Go"])).toEqual([
      "React",
      "Node",
      "Go",
    ]);
  });

  it("drops blank entries", () => {
    expect(normalizeSkills(["", "   ", "SQL"])).toEqual(["SQL"]);
  });

  it("caps the list at 12 skills", () => {
    const values = Array.from({ length: 15 }, (_, index) => `skill-${index}`);
    expect(normalizeSkills(values)).toHaveLength(12);
  });
});

describe("profile field options", () => {
  it("maps every status to a label and option", () => {
    expect(USER_STATUS_VALUES).toEqual([
      "STUDENT",
      "EMPLOYED",
      "FREELANCER",
      "JOB_SEEKER",
      "OTHER",
    ]);
    expect(USER_STATUS_OPTIONS).toHaveLength(USER_STATUS_VALUES.length);
    for (const value of USER_STATUS_VALUES) {
      expect(USER_STATUS_LABELS[value]).toBeTruthy();
      expect(USER_STATUS_OPTIONS).toContainEqual({
        value,
        label: USER_STATUS_LABELS[value],
      });
    }
  });

  it("maps every t-shirt size to a label and option", () => {
    expect(TSHIRT_SIZE_VALUES).toEqual([
      "XS",
      "S",
      "M",
      "L",
      "XL",
      "XXL",
      "XXXL",
    ]);
    expect(TSHIRT_SIZE_OPTIONS).toHaveLength(TSHIRT_SIZE_VALUES.length);
    for (const value of TSHIRT_SIZE_VALUES) {
      expect(TSHIRT_SIZE_LABELS[value]).toBeTruthy();
      expect(TSHIRT_SIZE_OPTIONS).toContainEqual({
        value,
        label: TSHIRT_SIZE_LABELS[value],
      });
    }
  });
});
