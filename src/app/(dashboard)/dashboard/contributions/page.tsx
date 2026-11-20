import type { Metadata } from "next";
import { ContributionsInboxView } from "@/features/contributions/contributions-inbox-view";
import { requireUser } from "@/server/auth/guards";

export const metadata: Metadata = { title: "Contributions" };

export const dynamic = "force-dynamic";

export default async function CoderContributionsPage() {
  const user = await requireUser("/dashboard/contributions");
  return <ContributionsInboxView viewer={user} panel="coder" />;
}
