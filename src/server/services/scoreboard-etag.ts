import { createHash } from "node:crypto";
import type { ContestScoreboard } from "@/lib/contest-detail-types";

/**
 * ETags for a served standings page. `generatedAt` is deliberately excluded:
 * a live snapshot is recomputed every few seconds even when no score changed,
 * and a moving timestamp would defeat conditional requests.
 */
const remembered = new WeakMap<ContestScoreboard, string>();

export function computeScoreboardEtag(board: ContestScoreboard): string {
  const digest = createHash("sha256")
    .update(
      JSON.stringify({
        contest: board.contest,
        frozen: board.frozen,
        freezeAt: board.freezeAt,
        labels: board.labels,
        pagination: board.pagination,
        rows: board.rows,
      }),
    )
    .digest("base64url");
  return `"${digest}"`;
}

/** Cache the per-page hash on the served object so the route does not rehash. */
export function rememberScoreboardEtag(
  board: ContestScoreboard,
  etag: string,
): void {
  remembered.set(board, etag);
}

export function scoreboardEtag(board: ContestScoreboard): string {
  return remembered.get(board) ?? computeScoreboardEtag(board);
}
