import type { Metadata } from "next";
import { ProblemReviewQueue } from "@/features/reviews/problem-review-queue";
import { requireUser } from "@/server/auth/guards";
import { listProblemReviewInbox } from "@/server/services/problem-review-records";

export const metadata: Metadata = { title: "Publication reviews" };

export const dynamic = "force-dynamic";

export default async function CoderReviewsPage() {
  const user = await requireUser("/dashboard/reviews");
  const inbox = await listProblemReviewInbox(user);
  return <ProblemReviewQueue inbox={inbox} basePath="/dashboard" />;
}
