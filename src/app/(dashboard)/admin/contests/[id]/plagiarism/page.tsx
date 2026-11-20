import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ShieldAlert } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
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
import { getContestPlagiarismReport } from "@/server/services/contest-integrity";

export const metadata: Metadata = { title: "Contest integrity" };

export const dynamic = "force-dynamic";

export default async function ContestPlagiarismPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const report = await getContestPlagiarismReport(id).catch(() => null);
  if (!report) notFound();

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Contest integrity"
        title={report.contest.title}
        description={`Code similarity signals from ${report.submissionCount} contest submissions. Review before acting.`}
        actions={
          <Link
            href="/admin/contests"
            className={buttonVariants({ variant: "outline" })}
          >
            <ArrowLeft className="size-4" /> Contests
          </Link>
        }
      />

      {report.pairs.length === 0 ? (
        <EmptyState
          title="No strong similarity signals"
          description="No pair of different users reached the 75% similarity threshold."
          icon={ShieldAlert}
        />
      ) : (
        <Card className="overflow-hidden p-1">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Similarity</TableHead>
                <TableHead>Problem</TableHead>
                <TableHead>Pair</TableHead>
                <TableHead className="hidden sm:table-cell">Languages</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {report.pairs.map((pair) => (
                <TableRow key={`${pair.left.id}-${pair.right.id}`}>
                  <TableCell>
                    <Badge
                      variant={pair.similarity >= 90 ? "destructive" : "warning"}
                    >
                      {pair.similarity}%
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-56 truncate text-sm">
                    {pair.problemTitle}
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1 text-xs">
                      <div>
                        <Link
                          href={`/submissions/${pair.left.id}`}
                          className="font-medium hover:text-primary"
                        >
                          @{pair.left.username}
                        </Link>
                      </div>
                      <div>
                        <Link
                          href={`/submissions/${pair.right.id}`}
                          className="font-medium hover:text-primary"
                        >
                          @{pair.right.username}
                        </Link>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden text-xs text-muted-foreground sm:table-cell">
                    {pair.left.language} / {pair.right.language}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      <p className="text-xs text-muted-foreground">
        Similarity is a token-shingle Jaccard score. It flags shared code shape,
        not intent; verify the sources and account history before taking action.
      </p>
    </div>
  );
}
