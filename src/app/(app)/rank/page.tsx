import type { Metadata } from "next";
import { PointsBoard } from "@/components/rank/points-board";
import { RatingBoard } from "@/components/rank/rating-board";
import type { SearchParams } from "@/lib/pagination";
import { parseRankBoard, RANK_BOARD_META } from "@/lib/rating-rank";
import { getCurrentUser } from "@/server/auth/session";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}): Promise<Metadata> {
  const board = parseRankBoard((await searchParams).board);
  const meta = RANK_BOARD_META[board];
  return { title: meta.title, description: meta.description };
}

export default async function RankPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const board = parseRankBoard(params.board);
  const user = await getCurrentUser();

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      {board === "rating" ? (
        <RatingBoard params={params} viewer={user} />
      ) : (
        <PointsBoard params={params} viewer={user} />
      )}
    </div>
  );
}
