import Link from "next/link";
import { Plus, Trophy } from "lucide-react";
import { ContestStatusBadge } from "@/components/contests/contest-status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { Pagination } from "@/components/shared/pagination";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { AdminContestListItem } from "@/lib/types";
import type { SearchParams } from "@/lib/pagination";
import { contestStatus } from "@/lib/contests";
import { formatDateTime } from "@/lib/utils";

export function ContestManagementView({
  items,
  basePath,
  params,
  page,
  totalPages,
  description,
  showIntegrity,
}: {
  items: AdminContestListItem[];
  basePath: string;
  params: SearchParams;
  page: number;
  totalPages: number;
  description: string;
  showIntegrity: boolean;
}) {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Contest director"
        title="Contests"
        description={description}
        actions={
          <Link href={`${basePath}/new`} className={buttonVariants()}>
            <Plus className="size-4" /> New contest
          </Link>
        }
      />

      {items.length === 0 ? (
        <EmptyState
          title="No contests yet"
          description="Schedule the first contest and publish the problem set."
          icon={Trophy}
          action={
            <Link href={`${basePath}/new`} className={buttonVariants()}>
              Create a contest
            </Link>
          }
        />
      ) : (
        <Card className="overflow-hidden p-1">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Contest</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden md:table-cell">Start</TableHead>
                <TableHead className="text-right">Problems</TableHead>
                <TableHead className="text-right">Users</TableHead>
                <TableHead>Visibility</TableHead>
                <TableHead className="text-right">Edit</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((contest) => (
                <TableRow key={contest.id}>
                  <TableCell className="max-w-[240px]">
                    <Link
                      href={`${basePath}/${contest.id}/edit`}
                      className="block truncate text-sm font-medium hover:text-primary"
                    >
                      {contest.title}
                    </Link>
                    <p className="truncate font-mono text-[11px] text-muted-foreground">
                      {contest.slug}
                    </p>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <ContestStatusBadge
                        status={contestStatus(contest.startAt, contest.endAt)}
                      />
                      {contest.pendingApprovals > 0 ? (
                        <Badge variant="warning">
                          {contest.pendingApprovals} approval
                          {contest.pendingApprovals === 1 ? "" : "s"}
                        </Badge>
                      ) : null}
                    </div>
                  </TableCell>
                  <TableCell className="hidden text-xs text-muted-foreground md:table-cell">
                    {formatDateTime(contest.startAt)}
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm">
                    {contest.problemCount}
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm">
                    {contest.participantCount}
                  </TableCell>
                  <TableCell>
                    {contest.isPublic ? (
                      <Badge variant="success">Public</Badge>
                    ) : (
                      <Badge variant="warning">Hidden</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-3">
                      {showIntegrity ? (
                        <Link
                          href={`${basePath}/${contest.id}/plagiarism`}
                          className="text-xs font-medium text-muted-foreground hover:text-primary"
                        >
                          Integrity
                        </Link>
                      ) : null}
                      <Link
                        href={`${basePath}/${contest.id}/edit`}
                        className="text-xs font-medium text-primary hover:underline"
                      >
                        Edit
                      </Link>
                    </div>
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
