import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  Code2,
  GitPullRequest,
  ListChecks,
  Plus,
  Trophy,
  Users,
} from "lucide-react";
import { AssessmentPhaseBadge } from "@/components/assessments/assessment-status-badge";
import { ContestStatusBadge } from "@/components/contests/contest-status-badge";
import { DashboardMetric } from "@/components/dashboard/dashboard-metric";
import { DashboardPanel } from "@/components/dashboard/dashboard-panel";
import { PublicationReviewPanel } from "@/components/dashboard/publication-review-panel";
import { ReviewActivityPanel } from "@/components/dashboard/review-activity-panel";
import { DifficultyBadge } from "@/components/shared/difficulty-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { requireTeacher } from "@/server/auth/guards";
import { getTeacherOverview } from "@/server/services/teacher";
import {
  getReviewAnalytics,
  parseReviewRange,
} from "@/server/services/review-analytics";
import { firstValue, type SearchParams } from "@/lib/pagination";
import { assessmentPhase } from "@/lib/assessments";
import { contestStatus } from "@/lib/contests";
import { formatDate, formatPercent } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Teacher dashboard",
};

export const dynamic = "force-dynamic";

export default async function TeacherDashboardPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const teacher = await requireTeacher();
  const params = await searchParams;
  const range = parseReviewRange(firstValue(params.range));
  const [overview, analytics] = await Promise.all([
    getTeacherOverview(teacher.id),
    getReviewAnalytics(teacher, "teacher", range),
  ]);
  const acceptance =
    overview.submissionCount > 0
      ? (overview.acceptedCount / overview.submissionCount) * 100
      : 0;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Teaching workspace"
        title={`Welcome, ${teacher.displayName}`}
        description="Author problems, run assessments and follow your students from one place."
        actions={
          <>
            <Link
              href="/teacher/problems/new"
              className={buttonVariants({ variant: "outline" })}
            >
              <Plus className="size-4" /> New problem
            </Link>
            <Link href="/teacher/assessments/new" className={buttonVariants()}>
              <ClipboardCheck className="size-4" /> New assessment
            </Link>
          </>
        }
      />

      {overview.pendingContributions > 0 ? (
        <Link
          href="/teacher/contributions"
          className="flex items-center gap-3 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-amber-900 transition-colors hover:bg-amber-100 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-100 dark:hover:bg-amber-900"
        >
          <span className="grid size-9 shrink-0 place-items-center rounded-full bg-amber-500/15">
            <GitPullRequest className="size-4" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-semibold">
              {overview.pendingContributions} proposal
              {overview.pendingContributions === 1 ? "" : "s"} waiting for your
              review
            </span>
            <span className="block text-xs opacity-80">
              Statement, test case and editorial changes stay private until you
              approve them.
            </span>
          </span>
          <ChevronRight className="size-4 shrink-0" />
        </Link>
      ) : null}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
        <DashboardMetric
          label="Problems"
          value={overview.problemCount}
          hint={`${overview.publicProblemCount} public`}
          icon={ListChecks}
          href="/teacher/problems"
        />
        <DashboardMetric
          label="Contests"
          value={overview.contestCount}
          hint={
            overview.runningContestCount > 0
              ? `${overview.runningContestCount} running now`
              : "Scheduled or archived"
          }
          icon={Trophy}
          tone="warning"
          href="/teacher/contests"
        />
        <DashboardMetric
          label="Assessments"
          value={overview.assessmentCount}
          hint={`${overview.publishedAssessmentCount} published`}
          icon={ClipboardCheck}
          tone="success"
          href="/teacher/assessments"
        />
        <DashboardMetric
          label="Participants"
          value={overview.participantCount}
          hint="Contest + assessment joins"
          icon={Users}
          href="/rank"
        />
        <DashboardMetric
          label="Submissions"
          value={overview.submissionCount}
          hint="On your problems"
          icon={Code2}
          tone="neutral"
        />
        <DashboardMetric
          label="Acceptance"
          value={formatPercent(acceptance)}
          hint={`${overview.acceptedCount.toLocaleString("en-US")} accepted`}
          icon={CheckCircle2}
          tone="primary"
        />
      </div>

      <ReviewActivityPanel
        analytics={analytics}
        basePath="/teacher"
        range={range}
      />

      <PublicationReviewPanel viewer={teacher} basePath="/teacher" />

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
        <DashboardPanel
          title="Assessments"
          description="Private timed tests and their candidate counts."
          icon={<ClipboardCheck className="size-4" />}
          action={
            <Link
              href="/teacher/assessments"
              className="text-[11px] font-medium text-primary hover:underline"
            >
              Manage
            </Link>
          }
          bodyClassName="px-4 pb-2 pt-1"
        >
          {overview.recentAssessments.length === 0 ? (
            <EmptyState
              className="border-0 px-0 py-8"
              title="No assessments yet"
              description="Create a timed test and share it with your class."
              icon={ClipboardCheck}
              action={
                <Link
                  href="/teacher/assessments/new"
                  className={buttonVariants()}
                >
                  Create an assessment
                </Link>
              }
            />
          ) : (
            <ul className="divide-y divide-border">
              {overview.recentAssessments.map((assessment) => (
                <li
                  key={assessment.id}
                  className="flex items-center justify-between gap-3 py-2.5"
                >
                  <div className="min-w-0">
                    <Link
                      href={`/teacher/assessments/${assessment.id}`}
                      className="block truncate text-[13px] font-medium hover:text-primary"
                    >
                      {assessment.title}
                    </Link>
                    <p className="text-[11px] text-muted-foreground">
                      {formatDate(assessment.startAt)} ·{" "}
                      {assessment.participantCount} joined ·{" "}
                      {assessment.problemCount} problems
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <AssessmentPhaseBadge
                      phase={assessmentPhase(
                        assessment.startAt,
                        assessment.endAt,
                      )}
                    />
                    {assessment.isPublished ? null : (
                      <Badge variant="warning">Draft</Badge>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </DashboardPanel>

        <DashboardPanel
          title="Contests"
          description="Your contest schedule and live rounds."
          icon={<Trophy className="size-4" />}
          action={
            <Link
              href="/teacher/contests"
              className="text-[11px] font-medium text-primary hover:underline"
            >
              Manage
            </Link>
          }
          bodyClassName="px-4 pb-2 pt-1"
        >
          {overview.recentContests.length === 0 ? (
            <EmptyState
              className="border-0 px-0 py-8"
              title="No contests yet"
              description="Schedule a contest and publish the problem set."
              icon={Trophy}
              action={
                <Link href="/teacher/contests/new" className={buttonVariants()}>
                  Schedule a contest
                </Link>
              }
            />
          ) : (
            <ul className="divide-y divide-border">
              {overview.recentContests.map((contest) => (
                <li
                  key={contest.id}
                  className="flex items-center justify-between gap-3 py-2.5"
                >
                  <div className="min-w-0">
                    <Link
                      href={`/teacher/contests/${contest.id}/edit`}
                      className="block truncate text-[13px] font-medium hover:text-primary"
                    >
                      {contest.title}
                    </Link>
                    <p className="text-[11px] text-muted-foreground">
                      {formatDate(contest.startAt)} · {contest.participantCount}{" "}
                      registered
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <ContestStatusBadge
                      status={contestStatus(contest.startAt, contest.endAt)}
                    />
                    {contest.isPublic ? null : (
                      <Badge variant="warning">Hidden</Badge>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </DashboardPanel>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
        <DashboardPanel
          title="Your problem set"
          description="Problems you authored and their judge activity."
          icon={<ListChecks className="size-4" />}
          action={
            <Link
              href="/teacher/problems"
              className="text-[11px] font-medium text-primary hover:underline"
            >
              Manage
            </Link>
          }
          bodyClassName="px-4 pb-2 pt-1"
        >
          {overview.recentProblems.length === 0 ? (
            <EmptyState
              className="border-0 px-0 py-8"
              title="No problems yet"
              description="Write your first problem and add test cases."
              icon={ListChecks}
              action={
                <Link href="/teacher/problems/new" className={buttonVariants()}>
                  Create a problem
                </Link>
              }
            />
          ) : (
            <ul className="divide-y divide-border">
              {overview.recentProblems.map((problem) => (
                <li
                  key={problem.id}
                  className="flex items-center justify-between gap-3 py-2.5"
                >
                  <div className="min-w-0">
                    <Link
                      href={`/teacher/problems/${problem.id}/edit`}
                      className="block truncate text-[13px] font-medium hover:text-primary"
                    >
                      {problem.title}
                    </Link>
                    <p className="text-[11px] text-muted-foreground">
                      {problem.submissionCount} submissions · {problem.testCount}{" "}
                      tests
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <DifficultyBadge difficulty={problem.difficulty} />
                    {problem.isPublic ? (
                      <Badge variant="success">Public</Badge>
                    ) : (
                      <Badge variant="warning">Hidden</Badge>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </DashboardPanel>

        <DashboardPanel
          title="Teaching toolkit"
          description="Shortcuts for the rest of your workflow."
          icon={<ArrowRight className="size-4" />}
          bodyClassName="p-2"
        >
          <div className="space-y-1">
            {[
              {
                href: "/teacher/assessments/new",
                label: "Build a private assessment",
                description: "Timed, access-code protected and auto-graded.",
                icon: ClipboardCheck,
              },
              {
                href: "/teacher/contests/new",
                label: "Schedule a class contest",
                description: "Choose problems, set the window and publish.",
                icon: Trophy,
              },
              {
                href: "/rank",
                label: "Review the ranking",
                description: "See how your students compare across the judge.",
                icon: Users,
              },
              {
                href: "/dashboard",
                label: "Open your coder dashboard",
                description: "Track your own rating, streaks and submissions.",
                icon: Code2,
              },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="group flex items-start gap-3 rounded-md px-2.5 py-2.5 transition-colors hover:bg-muted"
                >
                  <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-md border border-border bg-background text-muted-foreground group-hover:text-primary">
                    <Icon className="size-3.5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[13px] font-medium">
                      {item.label}
                    </span>
                    <span className="block text-[11px] leading-relaxed text-muted-foreground">
                      {item.description}
                    </span>
                  </span>
                  <ArrowRight className="mt-1 size-3.5 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                </Link>
              );
            })}
          </div>
        </DashboardPanel>
      </div>
    </div>
  );
}
