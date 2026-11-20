import type { Metadata } from "next";
import { ProblemContributionsView } from "@/features/contributions/problem-contributions-view";
import { requireAdmin } from "@/server/auth/guards";

export const metadata: Metadata = { title: "Problem proposals" };

export const dynamic = "force-dynamic";

export default async function AdminProblemContributionsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const admin = await requireAdmin();
  const { id } = await params;
  return (
    <ProblemContributionsView
      problemId={id}
      viewer={admin}
      editHref={`/admin/problems/${id}/edit`}
      backHref="/admin/contributions"
    />
  );
}
