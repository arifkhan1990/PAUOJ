import Link from "next/link";
import { ListChecks, Plus, Search } from "lucide-react";
import { DifficultyBadge } from "@/components/shared/difficulty-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { Pagination } from "@/components/shared/pagination";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { AdminProblemListItem } from "@/lib/types";
import type { SearchParams } from "@/lib/pagination";
import { cn, formatRelative } from "@/lib/utils";

export function ProblemManagementView({
  items,
  q,
  basePath,
  params,
  page,
  totalPages,
  description,
}: {
  items: AdminProblemListItem[];
  q?: string;
  basePath: string;
  params: SearchParams;
  page: number;
  totalPages: number;
  description: string;
}) {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Problem setter"
        title="Problems"
        description={description}
        actions={
          <Link href={`${basePath}/new`} className={buttonVariants()}>
            <Plus className="size-4" /> New problem
          </Link>
        }
      />

      <form action={basePath} method="get" className="flex max-w-md gap-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            name="q"
            defaultValue={q}
            placeholder="Search by title…"
            className="pl-9"
          />
        </div>
        <button
          type="submit"
          className={cn(buttonVariants({ variant: "outline" }))}
        >
          Search
        </button>
      </form>

      {items.length === 0 ? (
        <EmptyState
          title="No problems found"
          description="Create a problem or clear the search."
          icon={ListChecks}
          action={
            <Link href={`${basePath}/new`} className={buttonVariants()}>
              Create a problem
            </Link>
          }
        />
      ) : (
        <Card className="overflow-hidden p-1">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Problem</TableHead>
                <TableHead>Difficulty</TableHead>
                <TableHead className="text-right">Tests</TableHead>
                <TableHead className="text-right">Proposals</TableHead>
                <TableHead className="text-right">Subs</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden text-right md:table-cell">
                  Updated
                </TableHead>
                <TableHead className="text-right">Edit</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((problem) => (
                <TableRow key={problem.id}>
                  <TableCell className="max-w-[260px]">
                    <Link
                      href={`${basePath}/${problem.id}/edit`}
                      className="block truncate text-sm font-medium hover:text-primary"
                    >
                      {problem.title}
                    </Link>
                    <p className="truncate font-mono text-[11px] text-muted-foreground">
                      {problem.slug}
                    </p>
                  </TableCell>
                  <TableCell>
                    <DifficultyBadge difficulty={problem.difficulty} />
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm">
                    {problem.testCount}
                  </TableCell>
                  <TableCell className="text-right">
                    {problem.pendingContributions > 0 ? (
                      <Link
                        href={`${basePath}/${problem.id}/contributions`}
                        aria-label={`${problem.pendingContributions} pending proposals`}
                      >
                        <Badge variant="warning">
                          {problem.pendingContributions}
                        </Badge>
                      </Link>
                    ) : (
                      <span className="font-mono text-xs text-muted-foreground">
                        0
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm">
                    {problem.submissionCount}
                  </TableCell>
                  <TableCell>
                    {problem.isPublic ? (
                      <Badge variant="success">Public</Badge>
                    ) : (
                      <Badge variant="warning">Hidden</Badge>
                    )}
                  </TableCell>
                  <TableCell className="hidden text-right text-xs text-muted-foreground md:table-cell">
                    {formatRelative(problem.updatedAt)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Link
                      href={`${basePath}/${problem.id}/edit`}
                      className="text-xs font-medium text-primary hover:underline"
                    >
                      Edit
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      <Pagination
        pathname={basePath}
        searchParams={params}
        page={page}
        totalPages={totalPages}
      />
    </div>
  );
}
