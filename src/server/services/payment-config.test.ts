import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  getPaymentMethods,
  getPaymentQrFile,
} from "@/server/services/payment-config";

const KEYS = [
  "PAYMENT_QR_DIR",
  "PAYMENT_BKASH_NUMBER",
  "PAYMENT_BKASH_NAME",
  "PAYMENT_BKASH_LABEL",
  "PAYMENT_CITYBANK_ACCOUNT",
  "PAYMENT_CITYBANK_NAME",
  "PAYMENT_CITYBANK_LABEL",
  "PAYMENT_INSTRUCTIONS",
] as const;

let directory = "";
const saved: Partial<Record<(typeof KEYS)[number], string | undefined>> = {};

beforeEach(() => {
  directory = mkdtempSync(path.join(tmpdir(), "pauoj-pay-"));
  for (const key of KEYS) {
    saved[key] = process.env[key];
    delete process.env[key];
  }
  process.env.PAYMENT_QR_DIR = directory;
});

afterEach(() => {
  for (const key of KEYS) {
    if (saved[key] === undefined) delete process.env[key];
    else process.env[key] = saved[key];
  }
  rmSync(directory, { recursive: true, force: true });
});

describe("getPaymentMethods", () => {
  it("returns no methods when nothing is configured", () => {
    expect(getPaymentMethods()).toEqual([]);
  });

  it("includes a method configured by account number only", () => {
    process.env.PAYMENT_BKASH_NUMBER = "01700000000";
    const methods = getPaymentMethods();
    expect(methods).toHaveLength(1);
    expect(methods[0]).toMatchObject({
      id: "bkash",
      accountNumber: "01700000000",
      qrUrl: null,
    });
  });

  it("serves a QR through the authenticated route when the file exists", () => {
    writeFileSync(path.join(directory, "bkash.png"), Buffer.from("png"));
    process.env.PAYMENT_BKASH_NUMBER = "01700000000";
    const methods = getPaymentMethods();
    expect(methods[0]?.qrUrl).toBe("/api/learning/payment-qr/bkash");
    expect(getPaymentQrFile("bkash")).toBe(path.join(directory, "bkash.png"));
  });

  it("lists both methods and ignores unknown files", () => {
    writeFileSync(path.join(directory, "citybank.webp"), Buffer.from("webp"));
    writeFileSync(path.join(directory, "unknown.png"), Buffer.from("png"));
    process.env.PAYMENT_BKASH_NUMBER = "01700000000";
    process.env.PAYMENT_CITYBANK_ACCOUNT = "1234567890";
    const methods = getPaymentMethods();
    expect(methods.map((method) => method.id)).toEqual(["bkash", "citybank"]);
    expect(methods[1]?.qrUrl).toBe("/api/learning/payment-qr/citybank");
    expect(getPaymentQrFile("bkash")).toBeNull();
  });
});
