import Link from "next/link";
import { ClipboardCheck, ExternalLink } from "lucide-react";
import { AssessmentResultsTable } from "@/components/admin/assessment-results-table";
import { CopyButton } from "@/components/shared/copy-button";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { AssessmentResults } from "@/lib/types";
import { formatDateTime } from "@/lib/utils";

export function AssessmentResultsView({
  results,
  basePath,
}: {
  results: AssessmentResults;
  basePath: string;
}) {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Coding test results"
        title={results.assessment.title}
        description="Ranking is by points, then solved count. Candidate status updates automatically."
        actions={
          <>
            <Link
              href={`/assessments/${results.assessment.slug}`}
              className={buttonVariants({ variant: "outline" })}
            >
              <ExternalLink className="size-4" /> Candidate view
            </Link>
            <Link
              href={`${basePath}/${results.assessment.id}/edit`}
              className={buttonVariants({ variant: "outline" })}
            >
              Edit
            </Link>
          </>
        }
      />

      <Card className="flex flex-wrap items-center justify-between gap-3 p-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Access code
          </p>
          <p className="mt-0.5 font-mono text-xl font-semibold tracking-[0.16em]">
            {results.assessment.accessCode}
          </p>
        </div>
        <div className="text-right text-xs text-muted-foreground">
          <p>
            {formatDateTime(results.assessment.startAt)} —{" "}
            {formatDateTime(results.assessment.endAt)}
          </p>
          <p className="mt-1">{results.rows.length} joined</p>
        </div>
        <CopyButton value={results.assessment.accessCode} label="Copy code" />
      </Card>

      {results.rows.length === 0 ? (
        <EmptyState
          title="No candidates have joined"
          description="Share the assessment link and access code. Candidates appear here after joining."
          icon={ClipboardCheck}
        />
      ) : (
        <Card className="overflow-hidden p-1">
          <AssessmentResultsTable results={results} />
        </Card>
      )}

      <p className="text-xs text-muted-foreground">
        Cell format: <span className="font-mono">✓</span> accepted,{" "}
        <span className="font-mono">+n</span> rejected attempts before
        acceptance, and <span className="font-mono">-n</span> unsolved attempts.
      </p>
    </div>
  );
}
