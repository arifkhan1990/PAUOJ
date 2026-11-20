import Link from "next/link";
import { ParticipantStatusBadge } from "@/components/assessments/assessment-status-badge";
import { UserAvatar } from "@/components/shared/user-avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { AssessmentResults } from "@/lib/types";
import { cn } from "@/lib/utils";

function rankClass(rank: number): string {
  if (rank === 1) return "border-amber-400 bg-amber-50 text-amber-900 dark:bg-amber-950 dark:text-amber-100";
  if (rank === 2) return "border-slate-300 bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200";
  if (rank === 3) return "border-orange-300 bg-orange-50 text-orange-900 dark:bg-orange-950 dark:text-orange-100";
  return "border-border bg-background text-muted-foreground";
}

export function AssessmentResultsTable({
  results,
}: {
  results: AssessmentResults;
}) {
  return (
    <Table className="min-w-[720px]">
      <TableHeader>
        <TableRow>
          <TableHead className="w-16">Rank</TableHead>
          <TableHead className="min-w-56">Candidate</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Solved</TableHead>
          <TableHead className="text-right">Points</TableHead>
          <TableHead className="text-right">Subs</TableHead>
          {results.labels.map((label) => (
            <TableHead key={label} className="min-w-16 text-center">
              {label}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {results.rows.map((row) => (
          <TableRow key={row.user.username}>
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
                href={`/users/${row.user.username}`}
                className="flex items-center gap-2.5 hover:text-primary"
              >
                <UserAvatar
                  name={row.user.displayName}
                  username={row.user.username}
                  size="sm"
                />
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium">
                    {row.user.displayName}
                  </span>
                  <span className="block truncate text-xs text-muted-foreground">
                    @{row.user.username}
                  </span>
                </span>
              </Link>
            </TableCell>
            <TableCell>
              <ParticipantStatusBadge status={row.status} />
            </TableCell>
            <TableCell className="text-right font-mono text-sm font-semibold">
              {row.solved}
            </TableCell>
            <TableCell className="text-right font-mono text-sm">
              {row.points}
            </TableCell>
            <TableCell className="text-right font-mono text-sm">
              {row.submissions}
            </TableCell>
            {results.labels.map((label) => {
              const cell = row.problems[label];
              if (!cell) {
                return (
                  <TableCell key={label} className="text-center text-muted-foreground">
                    ·
                  </TableCell>
                );
              }
              if (cell.solved) {
                return (
                  <TableCell
                    key={label}
                    className="bg-emerald-50 text-center dark:bg-emerald-950/50"
                    title={`Solved with ${cell.attempts} failed attempt(s)`}
                  >
                    <div className="font-mono text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                      ✓
                    </div>
                    {cell.attempts > 0 ? (
                      <div className="font-mono text-[10px] text-emerald-700/70 dark:text-emerald-300/70">
                        +{cell.attempts}
                      </div>
                    ) : null}
                  </TableCell>
                );
              }
              if (cell.attempts > 0) {
                return (
                  <TableCell
                    key={label}
                    className="text-center font-mono text-xs text-rose-600 dark:text-rose-400"
                  >
                    -{cell.attempts}
                  </TableCell>
                );
              }
              return (
                <TableCell key={label} className="text-center text-muted-foreground">
                  ·
                </TableCell>
              );
            })}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
