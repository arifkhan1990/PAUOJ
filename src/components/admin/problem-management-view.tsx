import Link from "next/link";
import { ListChecks, Plus, Search } from "lucide-react";
import { PublicationStatusBadge } from "@/components/problems/publication-status-badge";
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
import { REQUIRED_PUBLICATION_APPROVALS } from "@/lib/problem-review-types";
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
  const reviewBasePath = basePath.startsWith("/admin")
    ? "/admin/reviews"
    : "/teacher/reviews";

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
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((problem) => {
                const canEdit =
                  problem.publicationStatus === "DRAFT" ||
                  problem.publicationStatus === "CHANGES_REQUESTED";
                return (
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
                      canEdit ? (
                        <Link
                          href={`${basePath}/${problem.id}/contributions`}
                          aria-label={`${problem.pendingContributions} pending proposals`}
                        >
                          <Badge variant="warning">
                            {problem.pendingContributions}
                          </Badge>
                        </Link>
                      ) : (
                        <Badge
                          variant="warning"
                          title="Proposals are locked during publication review"
                        >
                          {problem.pendingContributions}
                        </Badge>
                      )
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
                    <div className="space-y-1">
                      <PublicationStatusBadge
                        status={problem.publicationStatus}
                        withIcon={false}
                      />
                      <p className="font-mono text-[11px] text-muted-foreground">
                        {problem.publicationStatus === "PUBLISHED"
                          ? "Review complete"
                          : problem.publicationStatus === "DRAFT"
                            ? "Not submitted"
                            : `${problem.approvalCount}/${REQUIRED_PUBLICATION_APPROVALS} approvals`}
                      </p>
                      {problem.openHoldCount > 0 ? (
                        <Badge variant="destructive">
                          {problem.openHoldCount} hold
                          {problem.openHoldCount === 1 ? "" : "s"}
                        </Badge>
                      ) : null}
                    </div>
                  </TableCell>
                  <TableCell className="hidden text-right text-xs text-muted-foreground md:table-cell">
                    {formatRelative(problem.updatedAt)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2 whitespace-nowrap">
                      <Link
                        href={`${reviewBasePath}/${problem.id}`}
                        className="text-xs font-medium text-primary hover:underline"
                      >
                        Review
                      </Link>
                      {canEdit ? (
                        <Link
                          href={`${basePath}/${problem.id}/edit`}
                          className="text-xs font-medium text-primary hover:underline"
                        >
                          Edit
                        </Link>
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          Locked
                        </span>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
                );
              })}
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
