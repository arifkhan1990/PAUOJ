import Link from "next/link";
import { Plus, Trophy } from "lucide-react";
import { ContestSeriesPanel } from "@/components/admin/contest-series-panel";
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
import {
  CONTEST_FORMAT_LABEL,
  CONTEST_PAYMENT_STATUS_LABEL,
  type ContestSeriesView,
} from "@/lib/contest-ops";
import type { AdminContestListItem } from "@/lib/types";
import type { SearchParams } from "@/lib/pagination";
import { contestStatus } from "@/lib/contests";
import { formatDateTime } from "@/lib/utils";

type FeeStatus = AdminContestListItem["feeStatus"];

function feeBadgeVariant(
  status: FeeStatus,
): "warning" | "success" | "muted" | "destructive" | null {
  if (status === "NOT_REQUIRED") return null;
  if (status === "PENDING") return "warning";
  if (status === "PAID") return "success";
  if (status === "WAIVED") return "muted";
  return "destructive";
}

const ROW_ACTION_CLASS =
  "inline-flex min-h-11 items-center rounded px-1 text-xs font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:min-h-0 sm:py-1";

const MOBILE_ACTION_CLASS =
  "inline-flex min-h-11 items-center rounded-md border border-border px-3 text-xs font-medium transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

export function ContestManagementView({
  items,
  basePath,
  params,
  page,
  totalPages,
  description,
  showIntegrity,
  showOperations = false,
  series = [],
  pendingHostRequests = 0,
}: {
  items: AdminContestListItem[];
  basePath: string;
  params: SearchParams;
  page: number;
  totalPages: number;
  description: string;
  showIntegrity: boolean;
  showOperations?: boolean;
  series?: ContestSeriesView[];
  pendingHostRequests?: number;
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

      {showOperations ? (
        <ContestSeriesPanel
          series={series}
          pendingHostRequests={pendingHostRequests}
        />
      ) : null}

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
        <>
          <ul className="space-y-3 sm:hidden">
            {items.map((contest) => {
              const feeVariant = feeBadgeVariant(contest.feeStatus);
              return (
                <li key={contest.id}>
                  <Card className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <Link
                          href={`${basePath}/${contest.id}/edit`}
                          className="block break-words text-sm font-semibold hover:text-primary"
                        >
                          {contest.title}
                        </Link>
                        <p className="break-all font-mono text-[11px] text-muted-foreground">
                          {contest.slug}
                        </p>
                      </div>
                      <ContestStatusBadge
                        status={contestStatus(contest.startAt, contest.endAt)}
                      />
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-1.5">
                      <Badge variant="outline">
                        {CONTEST_FORMAT_LABEL[contest.format]}
                        {contest.format === "GROUP"
                          ? ` · ${contest.teamSize}`
                          : ""}
                      </Badge>
                      {contest.isOfficial ? (
                        <Badge variant="default">Official</Badge>
                      ) : null}
                      {contest.isPublic ? (
                        <Badge variant="outline">Public</Badge>
                      ) : (
                        <Badge variant="muted">Hidden</Badge>
                      )}
                      {contest.feeStatus === "NOT_REQUIRED" ? null : (
                        <Badge variant={feeVariant ?? "muted"}>
                          {CONTEST_PAYMENT_STATUS_LABEL[contest.feeStatus]}
                        </Badge>
                      )}
                      {contest.pendingApprovals > 0 ? (
                        <Badge variant="warning">
                          {contest.pendingApprovals} approval
                          {contest.pendingApprovals === 1 ? "" : "s"}
                        </Badge>
                      ) : null}
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {formatDateTime(contest.startAt)} · {contest.problemCount}{" "}
                      problems · {contest.participantCount} coders
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2 border-t border-border pt-2">
                      {showOperations ? (
                        <Link
                          href={`${basePath}/${contest.id}/operations`}
                          className={MOBILE_ACTION_CLASS}
                        >
                          Operations
                        </Link>
                      ) : null}
                      {showIntegrity ? (
                        <Link
                          href={`${basePath}/${contest.id}/plagiarism`}
                          className={MOBILE_ACTION_CLASS}
                        >
                          Integrity
                        </Link>
                      ) : null}
                      <Link
                        href={`${basePath}/${contest.id}/edit`}
                        className={MOBILE_ACTION_CLASS}
                      >
                        Edit
                      </Link>
                    </div>
                  </Card>
                </li>
              );
            })}
          </ul>

          <Card className="hidden overflow-hidden p-1 sm:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Contest</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden sm:table-cell">Format</TableHead>
                  <TableHead className="hidden md:table-cell">Start</TableHead>
                  <TableHead className="hidden text-right lg:table-cell">
                    Fee
                  </TableHead>
                  <TableHead className="hidden text-right md:table-cell">
                    Problems
                  </TableHead>
                  <TableHead className="hidden text-right lg:table-cell">
                    Users
                  </TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((contest) => {
                  const feeVariant = feeBadgeVariant(contest.feeStatus);
                  return (
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
                          {contest.isOfficial ? (
                            <Badge variant="default">Official</Badge>
                          ) : null}
                          {contest.isPublic ? (
                            <Badge variant="outline">Public</Badge>
                          ) : (
                            <Badge variant="muted">Hidden</Badge>
                          )}
                          {contest.pendingApprovals > 0 ? (
                            <Badge variant="warning">
                              {contest.pendingApprovals} approval
                              {contest.pendingApprovals === 1 ? "" : "s"}
                            </Badge>
                          ) : null}
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <Badge variant="outline">
                          {CONTEST_FORMAT_LABEL[contest.format]}
                          {contest.format === "GROUP"
                            ? ` · ${contest.teamSize}`
                            : ""}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden text-xs text-muted-foreground md:table-cell">
                        {formatDateTime(contest.startAt)}
                      </TableCell>
                      <TableCell className="hidden text-right lg:table-cell">
                        {contest.feeStatus === "NOT_REQUIRED" ? (
                          <span className="text-xs text-muted-foreground">—</span>
                        ) : (
                          <Badge variant={feeVariant ?? "muted"}>
                            {CONTEST_PAYMENT_STATUS_LABEL[contest.feeStatus]}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="hidden text-right font-mono text-sm md:table-cell">
                        {contest.problemCount}
                      </TableCell>
                      <TableCell className="hidden text-right font-mono text-sm lg:table-cell">
                        {contest.participantCount}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex flex-wrap items-center justify-end gap-x-3 gap-y-0">
                          {showOperations ? (
                            <Link
                              href={`${basePath}/${contest.id}/operations`}
                              className={`${ROW_ACTION_CLASS} text-primary hover:underline`}
                            >
                              Operations
                            </Link>
                          ) : null}
                          {showIntegrity ? (
                            <Link
                              href={`${basePath}/${contest.id}/plagiarism`}
                              className={`${ROW_ACTION_CLASS} text-muted-foreground hover:text-primary`}
                            >
                              Integrity
                            </Link>
                          ) : null}
                          <Link
                            href={`${basePath}/${contest.id}/edit`}
                            className={`${ROW_ACTION_CLASS} text-primary hover:underline`}
                          >
                            Edit
                          </Link>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Card>
        </>
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
