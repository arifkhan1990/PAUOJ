import type { Metadata } from "next";
import { ProblemReviewWorkspace } from "@/features/reviews/problem-review-workspace";
import { loadProblemReview } from "@/features/reviews/load-problem-review";
import { requireAdmin } from "@/server/auth/guards";

export const metadata: Metadata = { title: "Publication review" };

export const dynamic = "force-dynamic";

export default async function AdminReviewDetailPage({
  params,
}: {
  params: Promise<{ problemId: string }>;
}) {
  const admin = await requireAdmin();
  const { problemId } = await params;
  const review = await loadProblemReview(problemId, admin);
  return (
    <ProblemReviewWorkspace review={review} basePath="/admin" isAdmin />
  );
}
