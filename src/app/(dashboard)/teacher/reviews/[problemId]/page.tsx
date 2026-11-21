import type { Metadata } from "next";
import { ProblemReviewWorkspace } from "@/features/reviews/problem-review-workspace";
import { loadProblemReview } from "@/features/reviews/load-problem-review";
import { requireTeacher } from "@/server/auth/guards";

export const metadata: Metadata = { title: "Publication review" };

export const dynamic = "force-dynamic";

export default async function TeacherReviewDetailPage({
  params,
}: {
  params: Promise<{ problemId: string }>;
}) {
  const teacher = await requireTeacher();
  const { problemId } = await params;
  const review = await loadProblemReview(problemId, teacher);
  return (
    <ProblemReviewWorkspace
      review={review}
      basePath="/teacher"
      isAdmin={teacher.role === "ADMIN"}
    />
  );
}
