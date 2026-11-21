import Link from "next/link";
import { UserAvatar } from "@/components/shared/user-avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { ReviewerLeaderboardRow } from "@/lib/reviewer-leaderboard-types";
import {
  ReviewerRoleBadge,
  formatReviewCount,
  formatReviewHours,
} from "@/features/reviewers/reviewer-leaderboard-meta";
import { cn, formatPercent, formatRelative } from "@/lib/utils";

function rankClass(rank: number): string {
  if (rank === 1) return "border-amber-400 bg-amber-50 text-amber-900 dark:bg-amber-950 dark:text-amber-100";
  if (rank === 2) return "border-slate-300 bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200";
  if (rank === 3) return "border-orange-300 bg-orange-50 text-orange-900 dark:bg-orange-950 dark:text-orange-100";
  return "border-border bg-background text-muted-foreground";
}

export function ReviewerLeaderboardTable({
  rows,
}: {
  rows: ReviewerLeaderboardRow[];
}) {
  return (
    <Table>
      <caption className="sr-only">
        Contribution reviewer leaderboard
      </caption>
      <TableHeader>
        <TableRow>
          <TableHead className="w-14">Rank</TableHead>
          <TableHead>Reviewer</TableHead>
          <TableHead className="hidden sm:table-cell">Role</TableHead>
          <TableHead className="text-right">Decisions</TableHead>
          <TableHead className="hidden text-right sm:table-cell">
            Approval
          </TableHead>
          <TableHead className="hidden text-right md:table-cell">
            Avg time
          </TableHead>
          <TableHead className="hidden text-right lg:table-cell">
            Approved
          </TableHead>
          <TableHead className="hidden text-right lg:table-cell">
            Rejected
          </TableHead>
          <TableHead className="hidden text-right lg:table-cell">
            Last active
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row, index) => {
          const rank = index + 1;
          return (
            <TableRow key={row.username}>
              <TableCell>
                <span
                  className={cn(
                    "inline-flex size-7 items-center justify-center rounded-full border text-xs font-semibold tabular-nums",
                    rankClass(rank),
                  )}
                >
                  {rank}
                </span>
              </TableCell>
              <TableCell>
                <Link
                  href={`/users/${row.username}`}
                  className="flex items-center gap-2.5 hover:text-primary"
                >
                  <UserAvatar
                    name={row.displayName}
                    username={row.username}
                    size="sm"
                  />
                  <span className="min-w-0 max-w-40 sm:max-w-none">
                    <span className="block truncate text-sm font-medium">
                      {row.displayName}
                    </span>
                    <span className="block truncate text-xs text-muted-foreground">
                      @{row.username}
                    </span>
                  </span>
                </Link>
              </TableCell>
              <TableCell className="hidden sm:table-cell">
                <ReviewerRoleBadge role={row.role} />
              </TableCell>
              <TableCell className="text-right font-mono text-sm font-semibold tabular-nums">
                {formatReviewCount(row.decisions)}
              </TableCell>
              <TableCell className="hidden text-right text-sm tabular-nums sm:table-cell">
                {formatPercent(row.approvalRate)}
              </TableCell>
              <TableCell className="hidden text-right text-sm tabular-nums md:table-cell">
                {formatReviewHours(row.averageReviewHours)}
              </TableCell>
              <TableCell className="hidden text-right font-mono text-sm tabular-nums text-emerald-700 lg:table-cell dark:text-emerald-400">
                {formatReviewCount(row.approved)}
              </TableCell>
              <TableCell className="hidden text-right font-mono text-sm tabular-nums text-rose-700 lg:table-cell dark:text-rose-400">
                {formatReviewCount(row.rejected)}
              </TableCell>
              <TableCell className="hidden whitespace-nowrap text-right text-xs text-muted-foreground lg:table-cell">
                {row.lastReviewedAt ? formatRelative(row.lastReviewedAt) : "—"}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
