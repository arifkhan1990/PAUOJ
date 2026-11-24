"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, ExternalLink, Pencil } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import {
  TabBar,
  tabId,
  tabPanelId,
  type TabBarItem,
} from "@/components/ui/tab-bar";
import {
  CONTEST_FORMAT_LABEL,
  CONTEST_INTEGRITY_EVENT_LABEL,
  type ContestIntegrityEventType,
  type ContestOperationsDetail,
} from "@/lib/contest-ops";
import type { SelectOption } from "@/lib/select-options";
import { formatDateTime } from "@/lib/utils";
import { CrewPanel } from "./crew-panel";
import { IntegrityPanel } from "./integrity-panel";
import { OverviewPanel } from "./overview-panel";
import { ShortlistPanel } from "./shortlist-panel";
import { SponsorsPanel } from "./sponsors-panel";

type TabValue = "overview" | "crew" | "shortlist" | "sponsors" | "integrity";

const TAB_PREFIX = "contest-operations";

function eventCount(integrity: ContestOperationsDetail["integrity"]): number {
  return (Object.keys(CONTEST_INTEGRITY_EVENT_LABEL) as ContestIntegrityEventType[])
    .reduce((sum, type) => sum + (integrity.totals[type] ?? 0), 0);
}

export function ContestOperationsView({
  contestId,
  detail,
  problemOptions,
  basePath = "/admin/contests",
  canEdit = true,
  canManageCrew = true,
  canDecideCandidates = true,
  canProposeCandidate = true,
  canReviewSponsors = true,
}: {
  contestId: string;
  detail: ContestOperationsDetail;
  problemOptions: SelectOption[];
  basePath?: string;
  canEdit?: boolean;
  canManageCrew?: boolean;
  canDecideCandidates?: boolean;
  canProposeCandidate?: boolean;
  canReviewSponsors?: boolean;
}) {
  const [tab, setTab] = useState<TabValue>("overview");
  const contest = detail.contest;
  const pendingSponsors = detail.sponsors.filter(
    (sponsor) => sponsor.status === "PENDING",
  ).length;

  const tabs: TabBarItem[] = [
    { value: "overview", label: "Overview" },
    { value: "crew", label: "Crew", count: detail.staff.length },
    { value: "shortlist", label: "Shortlist", count: detail.candidates.length },
    { value: "sponsors", label: "Sponsors", count: pendingSponsors },
    { value: "integrity", label: "Integrity", count: eventCount(detail.integrity) },
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Contest operations"
        title={contest.title}
        description={`${formatDateTime(contest.startAt)} → ${formatDateTime(contest.endAt)}`}
        actions={
          <>
            <Link
              href={`/contests/${contest.slug}`}
              className="inline-flex min-h-11 items-center gap-2 rounded-md border border-border px-4 text-sm font-medium transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <ExternalLink className="size-4" /> View
            </Link>
            {canEdit ? (
              <Link
                href={`/admin/contests/${contestId}/edit`}
                className="inline-flex min-h-11 items-center gap-2 rounded-md border border-border px-4 text-sm font-medium transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <Pencil className="size-4" /> Edit
              </Link>
            ) : null}
            <Link
              href={basePath}
              className="inline-flex min-h-11 items-center gap-2 rounded-md px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <ArrowLeft className="size-4" /> {canEdit ? "Contests" : "Dashboard"}
            </Link>
          </>
        }
      />

      <div className="flex flex-wrap items-center gap-1.5">
        <Badge variant="outline">
          {CONTEST_FORMAT_LABEL[contest.format]}
          {contest.format === "GROUP" ? ` · ${contest.teamSize} per team` : ""}
        </Badge>
        {contest.isOfficial ? <Badge variant="default">Official</Badge> : null}
        <Badge variant={contest.requiresFreshProblems ? "success" : "warning"}>
          {contest.requiresFreshProblems ? "Fresh problems" : "Fresh policy off"}
        </Badge>
      </div>

      <TabBar
        idPrefix={TAB_PREFIX}
        ariaLabel="Contest operations sections"
        items={tabs}
        value={tab}
        onChange={(value) => setTab(value as TabValue)}
      />

      <div
        role="tabpanel"
        id={tabPanelId(TAB_PREFIX, tab)}
        aria-labelledby={tabId(TAB_PREFIX, tab)}
        tabIndex={0}
        className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      >
        {tab === "overview" ? <OverviewPanel contest={contest} /> : null}
        {tab === "crew" ? (
          <CrewPanel
            contestId={contestId}
            initialStaff={detail.staff}
            readOnly={!canManageCrew}
          />
        ) : null}
        {tab === "shortlist" ? (
          <ShortlistPanel
            contestId={contestId}
            initialCandidates={detail.candidates}
            initialNotes={detail.notes}
            problemOptions={problemOptions}
            canPropose={canProposeCandidate}
            canDecide={canDecideCandidates}
          />
        ) : null}
        {tab === "sponsors" ? (
          <SponsorsPanel
            contestId={contestId}
            initialSponsors={detail.sponsors}
            canReview={canReviewSponsors}
          />
        ) : null}
        {tab === "integrity" ? (
          <IntegrityPanel contestId={contestId} integrity={detail.integrity} />
        ) : null}
      </div>
    </div>
  );
}
