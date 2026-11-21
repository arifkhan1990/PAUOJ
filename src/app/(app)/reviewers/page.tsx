import type { Metadata } from "next";
import { ReviewerLeaderboardView } from "@/features/reviewers/reviewer-leaderboard-view";
import { firstValue, type SearchParams } from "@/lib/pagination";
import {
  getReviewerLeaderboard,
  parseReviewerRange,
} from "@/server/services/reviewer-leaderboard";

export const metadata: Metadata = {
  title: "Reviewer leaderboard",
  description:
    "Reviewers ranked by completed statement, test and editorial reviews on the PrimeAsia University Online Judge.",
};

export const dynamic = "force-dynamic";

export default async function ReviewersPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const range = parseReviewerRange(firstValue(params.range));
  const board = await getReviewerLeaderboard(range);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <ReviewerLeaderboardView board={board} />
    </div>
  );
}
