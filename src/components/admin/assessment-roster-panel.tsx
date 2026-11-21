"use client";

import { Download } from "lucide-react";
import { AssessmentInvitesTable } from "@/components/admin/assessment-invites-table";
import { AssessmentRosterImport } from "@/components/admin/assessment-roster-import";
import { buttonVariants } from "@/components/ui/button";
import type { AssessmentJoinMode } from "@/lib/assessment-invites";
import type { AssessmentInviteSummary } from "@/lib/types";

/**
 * Roster and invite surface for one assessment. Invites are rendered from the
 * server-fetched prop so `router.refresh()` after an import or rotation always
 * reflects committed data; only UI status (rotating/copied) is local.
 */
export function AssessmentRosterPanel({
  assessmentId,
  assessmentSlug,
  joinMode,
  initialInvites,
}: {
  assessmentId: string;
  assessmentSlug: string;
  joinMode: AssessmentJoinMode;
  initialInvites: AssessmentInviteSummary[];
}) {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold">Candidates and invites</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Import the roster, copy personal links and export the results file.
          </p>
        </div>
        <a
          href={`/api/v1/admin/assessments/${assessmentId}/results.csv`}
          download
          className={buttonVariants({ variant: "outline", size: "sm" })}
        >
          <Download className="size-4" /> Export results CSV
        </a>
      </div>
      <AssessmentRosterImport assessmentId={assessmentId} />
      <AssessmentInvitesTable
        assessmentId={assessmentId}
        assessmentSlug={assessmentSlug}
        joinMode={joinMode}
        invites={initialInvites}
      />
    </div>
  );
}
