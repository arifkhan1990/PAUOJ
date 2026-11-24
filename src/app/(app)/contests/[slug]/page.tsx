import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { LockKeyhole } from "lucide-react";
import {
  ContestCrewNotice,
  ContestDetailHeader,
} from "@/components/contests/contest-detail-header";
import { ContestDetailContent } from "@/components/contests/contest-detail-content";
import { ContestDetailSidebar } from "@/components/contests/contest-detail-sidebar";
import { ContestHeroActions } from "@/components/contests/contest-hero-actions";
import { ContestProblemList } from "@/components/contests/contest-problem-list";
import { ContestSponsorStrip } from "@/components/contests/contest-sponsor-strip";
import { ContestTabs } from "@/components/contests/contest-tabs";
import { ContestTeamPanel } from "@/components/contests/contest-team-panel";
import { ContestTrustStrip } from "@/components/contests/contest-trust-strip";
import { ContestRegisterButton } from "@/features/contests/contest-register-button";
import { getCurrentUser } from "@/server/auth/session";
import { getContestBySlug } from "@/server/services/contests";
import { CONTEST_TEAM_MAX_SIZE } from "@/lib/contest-ops";
import { plainContestText } from "@/lib/contest-text";
import { firstValue, type SearchParams } from "@/lib/pagination";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const contest = await getContestBySlug(slug, null, false);
  return {
    title: contest?.title ?? "Contest",
    description: contest
      ? plainContestText(contest.description).slice(0, 160)
      : undefined,
    openGraph: contest?.bannerUrl
      ? { images: [{ url: contest.bannerUrl }] }
      : undefined,
  };
}

export default async function ContestPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<SearchParams>;
}) {
  const [{ slug }, query] = await Promise.all([params, searchParams]);
  const tab = firstValue(query.tab) === "problems" ? "problems" : "about";
  const user = await getCurrentUser();
  const isAdmin = user?.role === "ADMIN";
  const contest = await getContestBySlug(slug, user?.id ?? null, isAdmin);
  if (!contest) notFound();

  const format = contest.format ?? "SINGLE";
  const isGroup = format === "GROUP";
  const staffRole = contest.viewerStaffRole;
  const staffStatus = contest.viewerStaffStatus;
  const isStaff =
    staffRole !== null &&
    (staffStatus === "INVITED" || staffStatus === "ACCEPTED");
  const canOpenProblems =
    Boolean(contest.registered) ||
    contest.status === "ENDED" ||
    isAdmin ||
    staffRole === "DIRECTOR";
  // No inline team form lives on the page any more: signed-in users without a
  // team open the hero modal. Keep the section for invites, an existing team,
  // the signed-out prompt and the closed-team notice.
  const showTeamSection =
    isGroup &&
    !isStaff &&
    (!user ||
      Boolean(contest.viewerTeam) ||
      Boolean(contest.incomingTeamInvite) ||
      contest.status !== "UPCOMING");

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <Link href="/contests" className="hover:text-primary">
          Contests
        </Link>
        <span aria-hidden="true">/</span>
        <span className="break-all font-mono">{contest.slug}</span>
      </nav>

      <div className="mt-4">
        <ContestDetailHeader
          contest={contest}
          actions={
            <ContestHeroActions
              contest={contest}
              isAuthenticated={Boolean(user)}
              isStaff={isStaff}
            />
          }
        />
      </div>

      {isStaff && staffRole ? (
        <div className="mt-4">
          <ContestCrewNotice
            role={staffRole}
            status={contest.viewerStaffStatus}
            workspaceHref={`/dashboard/contests/${contest.id}/operations`}
          />
        </div>
      ) : null}

      {showTeamSection ? (
        <div id="team" tabIndex={-1} className="mt-4 scroll-mt-32">
          <ContestTeamPanel
            slug={contest.slug}
            viewerTeam={contest.viewerTeam}
            incomingInvite={contest.incomingTeamInvite ?? null}
            maxMembers={contest.teamSize || CONTEST_TEAM_MAX_SIZE}
            isAuthenticated={Boolean(user)}
            deadline={contest.startAt}
          />
        </div>
      ) : null}

      <ContestSponsorStrip
        sponsors={contest.sponsors ?? []}
        className="mt-5"
      />

      <ContestTrustStrip className="mt-5" />

      <div className="sticky top-16 z-30 mt-4 -mx-4 border-y border-border bg-background/90 px-4 py-2 backdrop-blur supports-[backdrop-filter]:bg-background/80 sm:-mx-6 sm:px-6 lg:mx-0 lg:rounded-lg lg:border">
        <ContestTabs
          slug={contest.slug}
          active={tab}
          className="border-b-0 pb-0"
        />
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0 space-y-8">
          {tab === "about" ? (
            <ContestDetailContent contest={contest} />
          ) : (
            <>
              {!canOpenProblems && contest.status === "RUNNING" && !isStaff ? (
                <div className="flex flex-wrap items-center gap-3 rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-100">
                  <LockKeyhole className="size-5 shrink-0" aria-hidden="true" />
                  <p className="min-w-0 flex-1">
                    {isGroup
                      ? "Create or join a team to open the problem set and submit."
                      : "Register for the contest to open the problem set and submit."}
                  </p>
                  {!isGroup ? (
                    <ContestRegisterButton
                      slug={contest.slug}
                      registered={contest.registered}
                      canRegister={contest.canRegister}
                      isAuthenticated={Boolean(user)}
                      ended={false}
                    />
                  ) : null}
                </div>
              ) : null}

              <section aria-labelledby="contest-problems">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h2
                    id="contest-problems"
                    className="text-xl font-semibold tracking-tight"
                  >
                    Problems
                  </h2>
                  {contest.registered && contest.status === "RUNNING" ? (
                    <span className="text-xs text-muted-foreground">
                      Contest submissions count toward the scoreboard
                    </span>
                  ) : null}
                </div>
                <ContestProblemList contest={contest} isAdmin={isAdmin} />
              </section>
            </>
          )}
        </div>

        <ContestDetailSidebar contest={contest} />
      </div>
    </div>
  );
}
