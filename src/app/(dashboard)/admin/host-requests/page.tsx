import type { Metadata } from "next";
import { HostRequestQueue } from "@/components/admin/host-request-queue";
import { PageHeader } from "@/components/shared/page-header";

export const metadata: Metadata = {
  title: "Host requests",
};

export const dynamic = "force-dynamic";

export default function AdminHostRequestsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Community hosting"
        title="Host requests"
        description="Review community contest briefs, verify the arrangement fee transaction reference, approve the schedule and convert an approved request into a private contest."
      />
      <HostRequestQueue />
    </div>
  );
}
