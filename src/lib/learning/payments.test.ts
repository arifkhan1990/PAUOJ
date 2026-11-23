import { describe, expect, it } from "vitest";
import {
  ADVANCED_SQL,
  BUNDLE_PRICE_BDT,
  MODULE_PRICE_BDT,
  PAID_MODULES,
  isValidTrxId,
  modulesForProduct,
  normalizeTrxId,
  priceForProduct,
} from "@/lib/learning/payments";

describe("pricing", () => {
  it("charges the module price and the bundle price", () => {
    expect(priceForProduct("MODULE", PAID_MODULES[0].slug)).toBe(
      MODULE_PRICE_BDT,
    );
    expect(priceForProduct("BUNDLE", null)).toBe(BUNDLE_PRICE_BDT);
  });

  it("rejects free modules and unknown products", () => {
    expect(priceForProduct("MODULE", "basic-programming-math")).toBeNull();
    expect(priceForProduct("MODULE", null)).toBeNull();
    expect(priceForProduct("MODULE", "not-a-track")).toBeNull();
  });

  it("expands a bundle to every premium module", () => {
    expect(modulesForProduct("BUNDLE")).toEqual(
      PAID_MODULES.map((module) => module.slug),
    );
    expect(modulesForProduct("MODULE", "trees-graphs")).toEqual(["trees-graphs"]);
    expect(modulesForProduct("MODULE", "basic-programming-math")).toEqual([]);
  });

  it("sells Advanced SQL separately for 500", () => {
    expect(priceForProduct("MODULE", ADVANCED_SQL.slug)).toBe(
      ADVANCED_SQL.priceBdt,
    );
    expect(modulesForProduct("MODULE", ADVANCED_SQL.slug)).toEqual([
      ADVANCED_SQL.slug,
    ]);
    expect(modulesForProduct("BUNDLE")).not.toContain(ADVANCED_SQL.slug);
  });
});

describe("transaction IDs", () => {
  it("normalizes spaces and case", () => {
    expect(normalizeTrxId(" 9f2a 7c1b3d ")).toBe("9F2A7C1B3D");
  });

  it("accepts typical TrxIDs and rejects junk", () => {
    expect(isValidTrxId("9F2A7C1B3D")).toBe(true);
    expect(isValidTrxId("abc123")).toBe(true);
    expect(isValidTrxId("short")).toBe(false);
    expect(isValidTrxId("has-dash")).toBe(false);
    expect(isValidTrxId("x".repeat(33))).toBe(false);
  });
});
