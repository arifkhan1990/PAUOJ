import { existsSync } from "node:fs";
import path from "node:path";

export type PaymentMethodId = "bkash" | "citybank";

export type PaymentMethod = {
  id: PaymentMethodId;
  label: string;
  accountName: string | null;
  accountNumber: string | null;
  qrUrl: string | null;
  instructions: string;
};

const QR_EXTENSIONS = ["png", "webp", "jpg", "jpeg"];

function qrDirectory(): string {
  return (
    process.env.PAYMENT_QR_DIR?.trim() ||
    path.join(process.cwd(), "private", "payment")
  );
}

/** Absolute path of a method's QR image, or null when it has not been uploaded. */
export function getPaymentQrFile(method: PaymentMethodId): string | null {
  for (const extension of QR_EXTENSIONS) {
    const candidate = path.join(qrDirectory(), `${method}.${extension}`);
    if (existsSync(candidate)) return candidate;
  }
  return null;
}

const DEFAULT_INSTRUCTIONS =
  "Send the exact amount with Send Money (bKash) or a bank transfer (City Bank), then submit the transaction ID below. An admin verifies every payment manually.";

/**
 * Payment details come from the environment. QR images are served from a
 * private directory through an authenticated route, never from `public/`.
 */
export function getPaymentMethods(): PaymentMethod[] {
  const instructions =
    process.env.PAYMENT_INSTRUCTIONS?.trim() || DEFAULT_INSTRUCTIONS;

  const methods: Array<{
    id: PaymentMethodId;
    label: string;
    name: string;
    number: string | null;
  }> = [
    {
      id: "bkash",
      label: process.env.PAYMENT_BKASH_LABEL?.trim() || "bKash (Send Money)",
      name: process.env.PAYMENT_BKASH_NAME?.trim() || "",
      number: process.env.PAYMENT_BKASH_NUMBER?.trim() || null,
    },
    {
      id: "citybank",
      label:
        process.env.PAYMENT_CITYBANK_LABEL?.trim() ||
        "City Bank (citytouch transfer)",
      name: process.env.PAYMENT_CITYBANK_NAME?.trim() || "",
      number: process.env.PAYMENT_CITYBANK_ACCOUNT?.trim() || null,
    },
  ];

  return methods
    .map((method) => {
      const qrFile = getPaymentQrFile(method.id);
      if (!qrFile && !method.number) return null;
      return {
        id: method.id,
        label: method.label,
        accountName: method.name || null,
        accountNumber: method.number,
        qrUrl: qrFile ? `/api/learning/payment-qr/${method.id}` : null,
        instructions,
      } satisfies PaymentMethod;
    })
    .filter((method): method is PaymentMethod => method !== null);
}
