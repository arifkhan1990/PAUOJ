import Link from "next/link";
import { Trophy } from "lucide-react";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { UserAvatar } from "@/components/shared/user-avatar";
import { getLanguage } from "@/lib/languages";
import type { ProblemRankboard as ProblemRankboardData } from "@/lib/types";
import { cn, formatDateTime, formatRuntime } from "@/lib/utils";

export function ProblemRankboard({
  data,
  score,
  className,
}: {
  data: ProblemRankboardData;
  score: number;
  className?: string;
}) {
  return (
    <Card className={cn("overflow-hidden", className)}>
      <div className="flex flex-wrap items-start justify-between gap-2 border-b border-border bg-muted/20 px-5 py-4">
        <div>
          <h3 className="text-sm font-semibold">RankBoard</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Fastest solvers, ordered by their first accepted submission.
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-2.5 py-1 text-[11px] text-muted-foreground">
          <Trophy className="size-3.5 text-amber-500" />
          {data.totalSolvers.toLocaleString("en-US")}{" "}
          {data.totalSolvers === 1 ? "solver" : "solvers"}
        </span>
      </div>

      {data.solvers.length > 0 ? (
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30 hover:bg-muted/30">
              <TableHead className="w-16">Ranking</TableHead>
              <TableHead>User</TableHead>
              <TableHead className="hidden sm:table-cell">Language</TableHead>
              <TableHead className="hidden text-right sm:table-cell">
                Score
              </TableHead>
              <TableHead className="hidden text-right md:table-cell">
                Time
              </TableHead>
              <TableHead className="hidden text-right lg:table-cell">
                Submission date
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.solvers.map((solver) => {
              const language = getLanguage(solver.language).shortLabel;
              const solvedAt = formatDateTime(solver.solvedAt);
              const attempts =
                solver.attempts === 0
                  ? "First try"
                  : `${solver.attempts} failed ${
                      solver.attempts === 1 ? "try" : "tries"
                    }`;
              return (
                <TableRow key={solver.username}>
                  <TableCell>
                    <span
                      className={cn(
                        "inline-flex size-6 items-center justify-center rounded-full text-[11px] font-semibold tabular-nums",
                        solver.rank === 1 &&
                          "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200",
                        solver.rank === 2 &&
                          "bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-200",
                        solver.rank === 3 &&
                          "bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-200",
                        solver.rank > 3 && "bg-muted text-muted-foreground",
                      )}
                    >
                      {solver.rank}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2.5">
                      <UserAvatar
                        name={solver.displayName}
                        username={solver.username}
                        size="sm"
                      />
                      <div className="min-w-0">
                        <Link
                          href={`/users/${solver.username}`}
                          className="block truncate text-sm font-medium hover:text-primary"
                        >
                          {solver.displayName}
                        </Link>
                        <p className="truncate text-xs text-muted-foreground">
                          @{solver.username} · {attempts}
                        </p>
                        <p className="mt-0.5 text-[11px] text-muted-foreground sm:hidden">
                          {language} · {formatRuntime(solver.runtimeMs)} ·{" "}
                          {solvedAt}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden text-xs text-muted-foreground sm:table-cell">
                    {language}
                  </TableCell>
                  <TableCell className="hidden text-right font-mono text-xs tabular-nums sm:table-cell">
                    {score.toLocaleString("en-US")}
                  </TableCell>
                  <TableCell className="hidden text-right font-mono text-xs tabular-nums md:table-cell">
                    {formatRuntime(solver.runtimeMs)}
                  </TableCell>
                  <TableCell className="hidden text-right text-xs text-muted-foreground lg:table-cell">
                    {solvedAt}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      ) : (
        <div className="flex items-center gap-3 px-5 py-8 text-xs text-muted-foreground">
          <Trophy className="size-4 shrink-0" />
          No accepted solutions yet. The first one lands here.
        </div>
      )}
    </Card>
  );
}
