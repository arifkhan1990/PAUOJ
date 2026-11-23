export type PaymentConfig = {
  method: string;
  accountName: string | null;
  accountNumber: string | null;
  qrImageUrl: string | null;
  instructions: string;
};

/**
 * Manual payment details come from the environment so the admin can change
 * them without a code change. Missing values render a "contact us" fallback.
 */
export function getPaymentConfig(): PaymentConfig {
  const accountNumber = process.env.PAYMENT_ACCOUNT_NUMBER?.trim() || null;
  const accountName = process.env.PAYMENT_ACCOUNT_NAME?.trim() || null;
  const qrImageUrl = process.env.PAYMENT_QR_IMAGE_URL?.trim() || null;
  const method = process.env.PAYMENT_METHOD?.trim() || "bKash / Nagad";
  const instructions =
    process.env.PAYMENT_INSTRUCTIONS?.trim() ||
    "Send the exact amount with the Send Money option, then submit the transaction ID below. Approval is manual and usually takes a few hours.";

  return { method, accountName, accountNumber, qrImageUrl, instructions };
}
