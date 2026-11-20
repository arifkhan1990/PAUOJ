import type { Metadata } from "next";
import { ProblemContributionsView } from "@/features/contributions/problem-contributions-view";
import { requireUser } from "@/server/auth/guards";

export const metadata: Metadata = { title: "Problem proposals" };

export const dynamic = "force-dynamic";

export default async function CoderProblemContributionsPage({
  params,
}: {
  params: Promise<{ problemId: string }>;
}) {
  const user = await requireUser("/dashboard/contributions");
  const { problemId } = await params;
  return (
    <ProblemContributionsView
      problemId={problemId}
      viewer={user}
      editHref={null}
      backHref="/dashboard/contributions"
    />
  );
}
