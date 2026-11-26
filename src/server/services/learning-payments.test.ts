import { describe, expect, it } from "vitest";
import {
  adminOrderNotification,
  type PaymentOrderView,
} from "./learning-payments";

function order(overrides: Partial<PaymentOrderView> = {}): PaymentOrderView {
  return {
    id: "5d0f2f6e-6a1b-4c3d-9e8f-0a1b2c3d4e5f",
    kind: "PURCHASE",
    product: "MODULE",
    moduleSlug: "dynamic-programming",
    amountBdt: 500,
    trxId: "TRX123456",
    senderNumber: "01700000000",
    userNote: null,
    status: "PENDING",
    adminNote: null,
    reviewedAt: null,
    createdAt: "2026-11-26T10:00:00.000Z",
    user: { username: "coder", displayName: "Coder One" },
    label: "Dynamic Programming",
    ...overrides,
  };
}

describe("adminOrderNotification", () => {
  it("asks an admin to review a free access request", () => {
    expect(
      adminOrderNotification(
        order({
          kind: "FREE_REQUEST",
          product: "BUNDLE",
          moduleSlug: null,
          label: "All premium modules",
        }),
      ),
    ).toEqual({
      title: "Free access request needs review",
      body: "@coder requested All premium modules.",
    });
  });

  it("asks an admin to review a submitted payment", () => {
    expect(adminOrderNotification(order())).toEqual({
      title: "Payment needs review",
      body: "@coder submitted a payment for Dynamic Programming.",
    });
  });

  it("includes only the username and the product label", () => {
    const { body } = adminOrderNotification(order());
    expect(body).toContain("@coder");
    expect(body).not.toContain("Coder One");
    expect(body).not.toContain("TRX123456");
    expect(body).not.toContain("01700000000");
  });
});
