import Link from "next/link";
import { ExternalLink, Pencil, ShieldAlert } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  CONTEST_FORMAT_LABEL,
  CONTEST_PAYMENT_STATUS_LABEL,
  type ContestOperationsDetail,
} from "@/lib/contest-ops";
import { formatDateTime } from "@/lib/utils";

type ContestSummary = ContestOperationsDetail["contest"];

function FeeValue({ contest }: { contest: ContestSummary }) {
  if (contest.feeStatus === "NOT_REQUIRED") {
    return <span className="text-muted-foreground">Not required</span>;
  }
  return (
    <span className="inline-flex flex-wrap items-center gap-2">
      {contest.feeBdt === null ? null : (
        <span className="font-mono tabular-nums">
          ৳{contest.feeBdt.toLocaleString("en-US")}
        </span>
      )}
      <Badge
        variant={
          contest.feeStatus === "PAID"
            ? "success"
            : contest.feeStatus === "PENDING"
              ? "warning"
              : "muted"
        }
      >
        {CONTEST_PAYMENT_STATUS_LABEL[contest.feeStatus]}
      </Badge>
    </span>
  );
}

export function OverviewPanel({
  contest,
}: {
  contest: ContestSummary;
}) {
  return (
    <div className="space-y-4">
      <Card className="p-4 sm:p-5">
        <h2 className="text-sm font-semibold">Contest setup</h2>
        <dl className="mt-3 grid gap-3 text-xs sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <dt className="text-muted-foreground">Format</dt>
            <dd className="mt-0.5 font-medium">
              {CONTEST_FORMAT_LABEL[contest.format]}
              {contest.format === "GROUP"
                ? ` · ${contest.teamSize} coders per team`
                : " · 1 coder per entry"}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Official round</dt>
            <dd className="mt-0.5">
              {contest.isOfficial ? (
                <Badge variant="default">Official</Badge>
              ) : (
                <span className="font-medium text-muted-foreground">
                  Community
                </span>
              )}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Arrangement fee</dt>
            <dd className="mt-0.5 font-medium">
              <FeeValue contest={contest} />
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Fresh-problem policy</dt>
            <dd className="mt-0.5">
              {contest.requiresFreshProblems ? (
                <Badge variant="success">Enforced</Badge>
              ) : (
                <Badge variant="warning">Off</Badge>
              )}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Series</dt>
            <dd className="mt-0.5 font-medium">
              {contest.seriesId ? "Monthly series" : "Standalone round"}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Slug</dt>
            <dd className="mt-0.5 break-all font-mono text-[11px]">
              {contest.slug}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Starts</dt>
            <dd className="mt-0.5 font-medium">
              {formatDateTime(contest.startAt)}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Ends</dt>
            <dd className="mt-0.5 font-medium">
              {formatDateTime(contest.endAt)}
            </dd>
          </div>
        </dl>
      </Card>

      <Card className="p-4 sm:p-5">
        <h2 className="flex items-center gap-2 text-sm font-semibold">
          <ShieldAlert className="size-4 text-muted-foreground" aria-hidden="true" />
          Fresh-problem policy
        </h2>
        <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
          {contest.requiresFreshProblems
            ? "Every problem in this contest must be an unpublished draft that has never appeared in another contest. The shortlist below is where setters propose candidates; saving the contest reserves each problem's first-use debut."
            : "This contest accepts problems that may already be public or used elsewhere. Keep it out of rated rounds; the integrity log still records copy and paste attempts during the round."}
        </p>
      </Card>

      <div className="flex flex-wrap gap-2">
        <Link
          href={`/admin/contests/${contest.id}/edit`}
          className="inline-flex min-h-11 items-center gap-2 rounded-md border border-border px-4 text-sm font-medium transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Pencil className="size-4" aria-hidden="true" />
          Edit contest
        </Link>
        <Link
          href={`/contests/${contest.slug}`}
          className="inline-flex min-h-11 items-center gap-2 rounded-md border border-border px-4 text-sm font-medium transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <ExternalLink className="size-4" aria-hidden="true" />
          Public page
        </Link>
        <Link
          href={`/admin/contests/${contest.id}/plagiarism`}
          className="inline-flex min-h-11 items-center gap-2 rounded-md border border-border px-4 text-sm font-medium transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <ShieldAlert className="size-4" aria-hidden="true" />
          Plagiarism report
        </Link>
      </div>
    </div>
  );
}
