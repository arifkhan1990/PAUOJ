import Link from "next/link";
import { VerdictBadge } from "@/components/shared/verdict-badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getLanguage } from "@/lib/languages";
import type { SubmissionListItem } from "@/lib/types";
import { formatMemory, formatRelative, formatRuntime, shortId } from "@/lib/utils";

export function SubmissionTable({
  items,
  showUser = true,
  showProblem = true,
  showMemory = true,
}: {
  items: SubmissionListItem[];
  showUser?: boolean;
  showProblem?: boolean;
  showMemory?: boolean;
}) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-24">ID</TableHead>
          <TableHead>Verdict</TableHead>
          {showProblem ? <TableHead>Problem</TableHead> : null}
          {showUser ? <TableHead>Coder</TableHead> : null}
          <TableHead className="hidden sm:table-cell">Language</TableHead>
          <TableHead className="text-right">Time</TableHead>
          {showMemory ? (
            <TableHead className="hidden text-right md:table-cell">Memory</TableHead>
          ) : null}
          <TableHead className="hidden text-right lg:table-cell">When</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((item) => (
          <TableRow key={item.id}>
            <TableCell>
              <Link
                href={`/submissions/${item.id}`}
                className="font-mono text-xs text-muted-foreground hover:text-primary"
              >
                {shortId(item.id)}
              </Link>
            </TableCell>
            <TableCell>
              <VerdictBadge status={item.status} short />
            </TableCell>
            {showProblem ? (
              <TableCell className="max-w-[220px]">
                <Link
                  href={`/problems/${item.problem.slug}`}
                  className="line-clamp-1 text-sm font-medium hover:text-primary"
                >
                  {item.problem.title}
                </Link>
                {item.contestSlug ? (
                  <Link
                    href={`/contests/${item.contestSlug}`}
                    className="text-[11px] text-muted-foreground hover:text-primary"
                  >
                    contest
                  </Link>
                ) : null}
                {item.assessmentSlug ? (
                  <Link
                    href={`/assessments/${item.assessmentSlug}`}
                    className="ml-1 text-[11px] text-muted-foreground hover:text-primary"
                  >
                    assessment
                  </Link>
                ) : null}
              </TableCell>
            ) : null}
            {showUser ? (
              <TableCell>
                <Link
                  href={`/users/${item.user.username}`}
                  className="text-sm hover:text-primary"
                >
                  {item.user.displayName}
                </Link>
              </TableCell>
            ) : null}
            <TableCell className="hidden text-xs text-muted-foreground sm:table-cell">
              {getLanguage(item.language).shortLabel}
            </TableCell>
            <TableCell className="text-right font-mono text-xs tabular-nums">
              {formatRuntime(item.runtimeMs)}
            </TableCell>
            {showMemory ? (
              <TableCell className="hidden text-right font-mono text-xs tabular-nums md:table-cell">
                {formatMemory(item.memoryKb)}
              </TableCell>
            ) : null}
            <TableCell className="hidden text-right text-xs text-muted-foreground lg:table-cell">
              {formatRelative(item.createdAt)}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
