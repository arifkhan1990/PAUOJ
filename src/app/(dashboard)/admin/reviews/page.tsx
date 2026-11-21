import type { Metadata } from "next";
import { ProblemReviewQueue } from "@/features/reviews/problem-review-queue";
import { requireAdmin } from "@/server/auth/guards";
import { listProblemReviewInbox } from "@/server/services/problem-review-records";

export const metadata: Metadata = { title: "Publication reviews" };

export const dynamic = "force-dynamic";

export default async function AdminReviewsPage() {
  const admin = await requireAdmin();
  const inbox = await listProblemReviewInbox(admin);
  return <ProblemReviewQueue inbox={inbox} basePath="/admin" />;
}
