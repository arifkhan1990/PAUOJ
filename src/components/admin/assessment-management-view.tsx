import Link from "next/link";
import { ClipboardCheck, Plus } from "lucide-react";
import { AssessmentPhaseBadge } from "@/components/assessments/assessment-status-badge";
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
import type { AdminAssessmentListItem } from "@/lib/types";
import type { SearchParams } from "@/lib/pagination";
import { assessmentPhase } from "@/lib/assessments";

export function AssessmentManagementView({
  items,
  basePath,
  params,
  page,
  totalPages,
  description,
}: {
  items: AdminAssessmentListItem[];
  basePath: string;
  params: SearchParams;
  page: number;
  totalPages: number;
  description: string;
}) {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Coding tests"
        title="Assessments"
        description={description}
        actions={
          <Link href={`${basePath}/new`} className={buttonVariants()}>
            <Plus className="size-4" /> New assessment
          </Link>
        }
      />

      {items.length === 0 ? (
        <EmptyState
          title="No coding assessments yet"
          description="Create a timed private test, add problems and share the access code."
          icon={ClipboardCheck}
          action={
            <Link href={`${basePath}/new`} className={buttonVariants()}>
              Create an assessment
            </Link>
          }
        />
      ) : (
        <Card className="overflow-hidden p-1">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Assessment</TableHead>
                <TableHead>Phase</TableHead>
                <TableHead className="hidden md:table-cell">Code</TableHead>
                <TableHead className="text-right">Problems</TableHead>
                <TableHead className="text-right">Candidates</TableHead>
                <TableHead>Visibility</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="max-w-[240px]">
                    <Link
                      href={`${basePath}/${item.id}`}
                      className="block truncate text-sm font-medium hover:text-primary"
                    >
                      {item.title}
                    </Link>
                    <p className="truncate font-mono text-[11px] text-muted-foreground">
                      {item.slug}
                    </p>
                  </TableCell>
                  <TableCell>
                    <AssessmentPhaseBadge
                      phase={assessmentPhase(item.startAt, item.endAt)}
                    />
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <span className="rounded border border-border bg-muted/50 px-2 py-1 font-mono text-xs tracking-wider">
                      {item.accessCode}
                    </span>
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm">
                    {item.problemCount}
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm">
                    {item.participantCount}
                  </TableCell>
                  <TableCell>
                    {item.isPublished ? (
                      <Badge variant="success">Published</Badge>
                    ) : (
                      <Badge variant="warning">Draft</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-3 text-xs font-medium">
                      <Link
                        href={`${basePath}/${item.id}`}
                        className="text-primary hover:underline"
                      >
                        Results
                      </Link>
                      <Link
                        href={`${basePath}/${item.id}/edit`}
                        className="text-primary hover:underline"
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

      <div className="rounded-lg border border-border bg-muted/30 p-4 text-xs leading-relaxed text-muted-foreground">
        Share the candidate link{" "}
        <span className="font-mono">/assessments/&lt;slug&gt;</span> and the
        access code. Draft assessments are hidden from candidates until you
        publish them.
      </div>

      <Pagination
        pathname={basePath}
        searchParams={params}
        page={page}
        totalPages={totalPages}
      />
    </div>
  );
}
