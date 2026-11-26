import type { ContestScoreboard, ScoreboardRow } from "@/lib/types";
import { UserAvatar } from "@/components/shared/user-avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { UsersRound, Zap } from "lucide-react";
import Link from "next/link";

function rankClass(rank: number): string {
  if (rank === 1)
    return "border-amber-400 bg-amber-50 text-amber-900 dark:bg-amber-950 dark:text-amber-100";
  if (rank === 2)
    return "border-slate-300 bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200";
  if (rank === 3)
    return "border-orange-300 bg-orange-50 text-orange-900 dark:bg-orange-950 dark:text-orange-100";
  return "border-border bg-background text-muted-foreground";
}

function memberLabel(count: number): string {
  return `${count} ${count === 1 ? "member" : "members"}`;
}

function ScoreboardIdentity({ board, row }: {
  board: ContestScoreboard;
  row: ScoreboardRow;
}) {
  const isGroup = board.contest.format === "GROUP";
  const team = isGroup ? row.team : null;
  const name = team?.name ?? row.user.displayName;
  const memberNames = team?.members.map((member) => member.displayName) ?? [];

  return (
    <div className="flex items-center gap-2.5">
      <UserAvatar
        name={row.user.displayName}
        username={row.user.username}
        size="sm"
        avatarPreset={row.user.avatarPreset}
        avatarImageAt={row.user.avatarImageUpdatedAt}
      />
      <span className="min-w-0">
        <span className="block truncate text-sm font-medium">{name}</span>
        <span className="flex min-w-0 flex-wrap items-center gap-x-1 text-xs text-muted-foreground">
          <Link
            href={`/users/${row.user.username}`}
            prefetch={false}
            className="truncate hover:text-primary"
          >
            {team ? `Captain @${row.user.username}` : `@${row.user.username}`}
          </Link>
          {team ? (
            <span
              className="inline-flex items-center gap-1"
              title={memberNames.join(", ")}
            >
              <span aria-hidden="true">·</span>
              <UsersRound className="size-3" aria-hidden="true" />
              {memberLabel(team.memberCount)}
              <span className="sr-only">
                : {memberNames.join(", ")}
              </span>
            </span>
          ) : null}
        </span>
      </span>
    </div>
  );
}

export function ScoreboardTable({ board }: { board: ContestScoreboard }) {
  const isGroup = board.contest.format === "GROUP";

  return (
    <Table className="min-w-[760px]">
      <TableHeader>
        <TableRow>
          <TableHead className="w-16">Rank</TableHead>
          <TableHead className="min-w-56">
            {isGroup ? "Team / captain" : "Coder"}
          </TableHead>
          <TableHead className="text-right">Solved</TableHead>
          <TableHead className="text-right">Penalty</TableHead>
          {board.labels.map((label) => (
            <TableHead key={label} className="min-w-20 text-center">
              {label}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {board.rows.map((row) => (
          <TableRow key={row.team?.id ?? row.user.username}>
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
              <ScoreboardIdentity board={board} row={row} />
            </TableCell>
            <TableCell className="text-right font-mono text-sm font-semibold tabular-nums">
              {row.solved}
            </TableCell>
            <TableCell className="text-right font-mono text-sm tabular-nums">
              {row.penalty}
            </TableCell>
            {board.labels.map((label) => {
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
                    className={cn(
                      "text-center",
                      cell.firstBlood
                        ? "bg-emerald-100 ring-1 ring-inset ring-emerald-400/70 dark:bg-emerald-800/60 dark:ring-emerald-500/60"
                        : "bg-emerald-50 dark:bg-emerald-950/50",
                    )}
                    title={`${cell.firstBlood ? "First solve. " : ""}Solved in ${cell.solveTimeMinutes} minutes with ${cell.attempts} wrong attempt(s)`}
                  >
                    <div
                      className={cn(
                        "flex items-center justify-center gap-1 font-mono text-xs font-semibold",
                        cell.firstBlood
                          ? "text-emerald-800 dark:text-emerald-100"
                          : "text-emerald-700 dark:text-emerald-300",
                      )}
                    >
                      {cell.firstBlood ? (
                        <Zap className="size-3 fill-current" aria-hidden="true" />
                      ) : null}
                      {cell.firstBlood ? (
                        <span className="sr-only">First solve: </span>
                      ) : null}
                      {cell.solveTimeMinutes}
                    </div>
                    {cell.attempts > 0 ? (
                      <div
                        className={cn(
                          "font-mono text-[10px]",
                          cell.firstBlood
                            ? "text-emerald-800/75 dark:text-emerald-100/75"
                            : "text-emerald-700/70 dark:text-emerald-300/70",
                        )}
                      >
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
                    title={`${cell.attempts} rejected attempt(s)`}
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
