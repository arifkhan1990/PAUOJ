import type { Metadata } from "next";
import { PaymentQueue } from "@/components/admin/payment-queue";
import { PageHeader } from "@/components/shared/page-header";

export const metadata: Metadata = {
  title: "Payments",
};

export const dynamic = "force-dynamic";

export default function AdminPaymentsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Premium access"
        title="Payments & access"
        description="Verify bKash/Nagad TrxIDs, approve free-access requests and grant scholarship access to premium learning modules."
      />
      <PaymentQueue />
    </div>
  );
}
