import type { Metadata } from "next";
import { ProblemReviewWorkspace } from "@/features/reviews/problem-review-workspace";
import { loadProblemReview } from "@/features/reviews/load-problem-review";
import { requireUser } from "@/server/auth/guards";

export const metadata: Metadata = { title: "Publication review" };

export const dynamic = "force-dynamic";

export default async function CoderReviewDetailPage({
  params,
}: {
  params: Promise<{ problemId: string }>;
}) {
  const user = await requireUser("/dashboard/reviews");
  const { problemId } = await params;
  const review = await loadProblemReview(problemId, user);
  return (
    <ProblemReviewWorkspace
      review={review}
      basePath="/dashboard"
      isAdmin={user.role === "ADMIN"}
    />
  );
}
