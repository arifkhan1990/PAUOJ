import Link from "next/link";
import { ListChecks, LockKeyhole } from "lucide-react";
import { DifficultyBadge } from "@/components/shared/difficulty-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { SolveStatus } from "@/components/shared/solve-status";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { ContestDetail } from "@/lib/types";

export function ContestProblemList({
  contest,
  isAdmin,
}: {
  contest: ContestDetail;
  isAdmin: boolean;
}) {
  const sealed = contest.status === "UPCOMING" && !isAdmin;
  const canOpen =
    Boolean(contest.registered) || contest.status === "ENDED" || isAdmin;

  if (sealed) {
    return (
      <EmptyState
        className="mt-3"
        title="Problem set sealed"
        description={
          contest.problemCount > 0
            ? `${contest.problemCount} problems are attached. Titles and statements unlock at the start bell.`
            : "The director is still attaching fresh problems. Check back before the start."
        }
        icon={LockKeyhole}
      />
    );
  }

  if (contest.problems.length === 0) {
    return (
      <EmptyState
        className="mt-3"
        title={contest.status === "UPCOMING" ? "Problem set not ready" : "No problems added"}
        description={
          contest.status === "UPCOMING"
            ? "The director is still attaching fresh problems."
            : "The problem set has not been published yet."
        }
        icon={ListChecks}
      />
    );
  }

  return (
    <Card className="mt-3 overflow-hidden p-1">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">#</TableHead>
            <TableHead>Problem</TableHead>
            <TableHead className="hidden sm:table-cell">Difficulty</TableHead>
            <TableHead className="text-right">Points</TableHead>
            <TableHead className="w-12 text-center">
              <span className="sr-only">Status</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {contest.problems.map((problem) => (
            <TableRow key={problem.label}>
              <TableCell className="font-mono text-xs font-semibold">
                {problem.label}
              </TableCell>
              <TableCell>
                {canOpen ? (
                  <Link
                    href={`/problems/${problem.slug}`}
                    prefetch={false}
                    className="text-sm font-medium hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                  >
                    {problem.title}
                  </Link>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                    <LockKeyhole className="size-3.5" aria-hidden="true" />
                    <span className="line-clamp-1">{problem.title}</span>
                    <span className="sr-only">Locked until you register</span>
                  </span>
                )}
              </TableCell>
              <TableCell className="hidden sm:table-cell">
                <DifficultyBadge difficulty={problem.difficulty} />
              </TableCell>
              <TableCell className="text-right font-mono text-sm">
                {problem.points}
              </TableCell>
              <TableCell className="text-center">
                {canOpen ? (
                  <SolveStatus
                    solved={problem.solvedByMe}
                    attempted={problem.attemptedByMe}
                  />
                ) : (
                  <span className="text-muted-foreground">·</span>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}
