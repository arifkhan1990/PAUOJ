"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { VerdictBadge } from "@/components/shared/verdict-badge";
import { isPendingVerdict } from "@/lib/verdicts";
import { useSubmissionStream } from "@/features/submit/use-submission-stream";

export function SubmissionLive({
  submissionId,
  initialStatus,
  initialPassed,
  initialTotal,
}: {
  submissionId: string;
  initialStatus: string;
  initialPassed: number;
  initialTotal: number;
}) {
  const { submission } = useSubmissionStream(submissionId);
  const router = useRouter();
  const [refreshed, setRefreshed] = useState(false);
  const currentStatus = submission?.status ?? initialStatus;
  const passed = submission?.passedTests ?? initialPassed;
  const total = submission?.totalTests ?? initialTotal;

  useEffect(() => {
    if (submission && !isPendingVerdict(submission.status) && !refreshed) {
      setRefreshed(true);
      router.refresh();
    }
  }, [submission, refreshed, router]);

  if (!isPendingVerdict(initialStatus) && !submission) return null;

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-lg border border-sky-300 bg-sky-50 px-4 py-3 text-sm text-sky-900 dark:border-sky-800 dark:bg-sky-950 dark:text-sky-100">
      {isPendingVerdict(currentStatus) ? (
        <Loader2 className="size-4 animate-spin" />
      ) : null}
      <VerdictBadge status={currentStatus} />
      <span>
        {isPendingVerdict(currentStatus)
          ? "Judging in progress"
          : "Judging finished"}
        : <span className="font-mono">{passed}/{total}</span> tests passed
      </span>
      {isPendingVerdict(currentStatus) ? (
        <span className="text-xs opacity-70">
          Live updates are connected. You can keep this page open.
        </span>
      ) : null}
    </div>
  );
}
