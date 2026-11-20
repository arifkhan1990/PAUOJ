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
import type { RankRow } from "@/lib/types";
import { cn, formatPercent, formatRelative } from "@/lib/utils";

function rankClass(rank: number): string {
  if (rank === 1) return "border-amber-400 bg-amber-50 text-amber-900 dark:bg-amber-950 dark:text-amber-100";
  if (rank === 2) return "border-slate-300 bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200";
  if (rank === 3) return "border-orange-300 bg-orange-50 text-orange-900 dark:bg-orange-950 dark:text-orange-100";
  return "border-border bg-background text-muted-foreground";
}

export function RankTable({
  items,
  compact = false,
}: {
  items: RankRow[];
  compact?: boolean;
}) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-16">Rank</TableHead>
          <TableHead>Coder</TableHead>
          <TableHead className="hidden lg:table-cell">Institution</TableHead>
          <TableHead className="text-right">Points</TableHead>
          <TableHead className="hidden text-right sm:table-cell">Solved</TableHead>
          {!compact ? (
            <>
              <TableHead className="hidden text-right md:table-cell">Subs</TableHead>
              <TableHead className="hidden text-right lg:table-cell">Acceptance</TableHead>
              <TableHead className="hidden text-right lg:table-cell">Last AC</TableHead>
            </>
          ) : null}
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((row) => (
          <TableRow key={row.username}>
            <TableCell>
              <span
                className={cn(
                  "inline-flex size-7 items-center justify-center rounded-full border text-xs font-semibold tabular-nums",
                  rankClass(row.rank),
                )}
              >
                {row.rank}
              </span>
            </TableCell>
            <TableCell>
              <Link
                href={`/users/${row.username}`}
                className="flex items-center gap-2.5 hover:text-primary"
              >
                <UserAvatar name={row.displayName} username={row.username} size="sm" />
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium">
                    {row.displayName}
                  </span>
                  <span className="block truncate text-xs text-muted-foreground">
                    @{row.username}
                  </span>
                </span>
              </Link>
            </TableCell>
            <TableCell className="hidden lg:table-cell">
              <span className="block max-w-48 truncate text-xs">
                {row.institution ?? "—"}
              </span>
              {row.country ? (
                <span className="block text-[11px] text-muted-foreground">
                  {row.country}
                </span>
              ) : null}
            </TableCell>
            <TableCell className="text-right font-mono text-sm font-semibold tabular-nums">
              {row.points}
            </TableCell>
            <TableCell className="hidden text-right font-mono text-sm tabular-nums sm:table-cell">
              {row.solvedCount}
            </TableCell>
            {!compact ? (
              <>
                <TableCell className="hidden text-right font-mono text-sm tabular-nums md:table-cell">
                  {row.submissionCount}
                </TableCell>
                <TableCell className="hidden text-right text-sm tabular-nums lg:table-cell">
                  {formatPercent(row.acceptanceRate)}
                </TableCell>
                <TableCell className="hidden text-right text-xs text-muted-foreground lg:table-cell">
                  {row.lastAcceptedAt ? formatRelative(row.lastAcceptedAt) : "—"}
                </TableCell>
              </>
            ) : null}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
