import type { Metadata } from "next";
import { ContributionsInboxView } from "@/features/contributions/contributions-inbox-view";
import { requireAdmin } from "@/server/auth/guards";

export const metadata: Metadata = { title: "Contributions" };

export const dynamic = "force-dynamic";

export default async function AdminContributionsPage() {
  const admin = await requireAdmin();
  return <ContributionsInboxView viewer={admin} panel="admin" />;
}
