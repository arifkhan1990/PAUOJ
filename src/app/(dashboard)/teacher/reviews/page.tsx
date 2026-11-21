import type { Metadata } from "next";
import { ProblemReviewQueue } from "@/features/reviews/problem-review-queue";
import { requireTeacher } from "@/server/auth/guards";
import { listProblemReviewInbox } from "@/server/services/problem-review-records";

export const metadata: Metadata = { title: "Publication reviews" };

export const dynamic = "force-dynamic";

export default async function TeacherReviewsPage() {
  const teacher = await requireTeacher();
  const inbox = await listProblemReviewInbox(teacher);
  return <ProblemReviewQueue inbox={inbox} basePath="/teacher" />;
}
