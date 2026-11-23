export type PaymentMethodId = "bkash" | "citybank";

export type PaymentMethodView = {
  id: PaymentMethodId;
  label: string;
  shortLabel: string;
  accountName: string | null;
  accountNumber: string | null;
  qrUrl: string | null;
  instructions: string;
};
