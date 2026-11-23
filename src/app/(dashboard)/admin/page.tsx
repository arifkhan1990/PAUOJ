import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  CheckCircle2,
  ClipboardCheck,
  Code2,
  Flag,
  ListChecks,
  Wallet,
  Plus,
  Trophy,
  Users,
} from "lucide-react";
import { DashboardMetric } from "@/components/dashboard/dashboard-metric";
import { DashboardPanel } from "@/components/dashboard/dashboard-panel";
import { PublicationReviewPanel } from "@/components/dashboard/publication-review-panel";
import { ReviewActivityPanel } from "@/components/dashboard/review-activity-panel";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { SubmissionActivityChart } from "@/components/shared/submission-activity-chart";
import { SubmissionTable } from "@/components/submissions/submission-table";
import { DifficultyBadge } from "@/components/shared/difficulty-badge";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { requireAdmin } from "@/server/auth/guards";
import { getSiteStats, getSubmissionActivity } from "@/server/services/stats";
import { listAdminProblems } from "@/server/services/admin-problems";
import { listAdminContests } from "@/server/services/admin-contests";
import { listSubmissions } from "@/server/services/submissions";
import {
  getReviewAnalytics,
  parseReviewRange,
} from "@/server/services/review-analytics";
import { firstValue, type SearchParams } from "@/lib/pagination";
import { formatDate, formatPercent } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Admin dashboard",
};

export const dynamic = "force-dynamic";

const quickActions = [
  {
    href: "/admin/problems/new",
    label: "Create a problem",
    description: "Write the statement and add judge tests.",
    icon: Plus,
  },
  {
    href: "/admin/contests/new",
    label: "Schedule a contest",
    description: "Publish a problem set with a live scoreboard.",
    icon: Trophy,
  },
  {
    href: "/admin/assessments/new",
    label: "Run an assessment",
    description: "Invite candidates with a private access code.",
    icon: ClipboardCheck,
  },
  {
    href: "/admin/users",
    label: "Manage users",
    description: "Assign roles, review activity and suspend accounts.",
    icon: Users,
  },
  {
    href: "/admin/lesson-reports",
    label: "Review lesson reports",
    description: "Resolve reported comments in the learning tracks.",
    icon: Flag,
  },
  {
    href: "/admin/payments",
    label: "Payments & access",
    description: "Approve TrxIDs or grant premium learning access.",
    icon: Wallet,
  },
];

export default async function AdminDashboardPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const admin = await requireAdmin();
  const params = await searchParams;
  const range = parseReviewRange(firstValue(params.range));
  const [stats, activity, problemPage, contestPage, submissionPage, analytics] =
    await Promise.all([
      getSiteStats(),
      getSubmissionActivity(14),
      listAdminProblems({ page: 1, pageSize: 5 }),
      listAdminContests({ page: 1, pageSize: 4 }),
      listSubmissions({ page: 1, pageSize: 6 }, null),
      getReviewAnalytics(admin, "admin", range),
    ]);

  const acceptance =
    stats.submissionCount > 0
      ? (stats.acceptedCount / stats.submissionCount) * 100
      : 0;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Control room"
        title="Admin dashboard"
        description="Monitor the judge, manage the problem set and keep every contest running."
        actions={
          <>
            <Link
              href="/admin/contests/new"
              className={buttonVariants({ variant: "outline" })}
            >
              <Trophy className="size-4" /> New contest
            </Link>
            <Link href="/admin/problems/new" className={buttonVariants()}>
              <Plus className="size-4" /> New problem
            </Link>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <DashboardMetric
          label="Problems"
          value={stats.problemCount}
          hint="Live in the public judge"
          icon={ListChecks}
          href="/admin/problems"
        />
        <DashboardMetric
          label="Coders"
          value={stats.userCount}
          hint="Registered accounts"
          icon={Users}
          tone="success"
          href="/admin/users"
        />
        <DashboardMetric
          label="Submissions"
          value={stats.submissionCount}
          hint="Judged all-time"
          icon={Code2}
          tone="warning"
          href="/submissions"
        />
        <DashboardMetric
          label="Acceptance"
          value={formatPercent(acceptance)}
          hint={`${stats.acceptedCount.toLocaleString("en-US")} accepted solutions`}
          icon={CheckCircle2}
          tone="primary"
        />
      </div>

      <ReviewActivityPanel
        analytics={analytics}
        basePath="/admin"
        range={range}
      />

      <PublicationReviewPanel viewer={admin} basePath="/admin" />

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)]">
        <SubmissionActivityChart
          days={activity}
          title="Judge activity · last 14 days"
          description="Accepted vs other submissions, with the daily acceptance rate."
        />

        <DashboardPanel
          title="Quick actions"
          description="The four jobs you start most often."
          icon={<ArrowUpRight className="size-4" />}
          bodyClassName="p-2"
        >
          <div className="space-y-1">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <Link
                  key={action.href}
                  href={action.href}
                  className="group flex items-start gap-3 rounded-md px-2.5 py-2.5 transition-colors hover:bg-muted"
                >
                  <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-md border border-border bg-background text-muted-foreground group-hover:text-primary">
                    <Icon className="size-3.5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[13px] font-medium">
                      {action.label}
                    </span>
                    <span className="block text-[11px] leading-relaxed text-muted-foreground">
                      {action.description}
                    </span>
                  </span>
                  <ArrowRight className="mt-1 size-3.5 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                </Link>
              );
            })}
          </div>
        </DashboardPanel>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <DashboardPanel
          title="Recently updated problems"
          description="Jump back into the latest edits."
          icon={<ListChecks className="size-4" />}
          action={
            <Link
              href="/admin/problems"
              className="text-[11px] font-medium text-primary hover:underline"
            >
              Manage
            </Link>
          }
          bodyClassName="px-4 pb-2 pt-1"
        >
          {problemPage.items.length === 0 ? (
            <EmptyState
              className="border-0 px-0 py-8"
              title="No problems yet"
              description="Create the first problem to open the judge."
              icon={ListChecks}
              action={
                <Link href="/admin/problems/new" className={buttonVariants()}>
                  Create a problem
                </Link>
              }
            />
          ) : (
            <ul className="divide-y divide-border">
              {problemPage.items.map((problem) => (
                <li
                  key={problem.id}
                  className="flex items-center justify-between gap-3 py-2.5"
                >
                  <div className="min-w-0">
                    <Link
                      href={`/admin/problems/${problem.id}/edit`}
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
                    {!problem.isPublic ? (
                      <Badge variant="warning">Hidden</Badge>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </DashboardPanel>

        <DashboardPanel
          title="Contests"
          description="The next scheduled and recent contests."
          icon={<Trophy className="size-4" />}
          action={
            <Link
              href="/admin/contests"
              className="text-[11px] font-medium text-primary hover:underline"
            >
              Manage
            </Link>
          }
          bodyClassName="px-4 pb-2 pt-1"
        >
          {contestPage.items.length === 0 ? (
            <EmptyState
              className="border-0 px-0 py-8"
              title="No contests yet"
              description="Schedule a contest for your students."
              icon={Trophy}
              action={
                <Link href="/admin/contests/new" className={buttonVariants()}>
                  Schedule a contest
                </Link>
              }
            />
          ) : (
            <ul className="divide-y divide-border">
              {contestPage.items.map((contest) => (
                <li
                  key={contest.id}
                  className="flex items-center justify-between gap-3 py-2.5"
                >
                  <div className="min-w-0">
                    <Link
                      href={`/admin/contests/${contest.id}/edit`}
                      className="block truncate text-[13px] font-medium hover:text-primary"
                    >
                      {contest.title}
                    </Link>
                    <p className="text-[11px] text-muted-foreground">
                      {formatDate(contest.startAt)} ·{" "}
                      {contest.participantCount} registered
                    </p>
                  </div>
                  <Link
                    href={`/contests/${contest.slug}`}
                    className="shrink-0 text-[11px] font-medium text-primary hover:underline"
                  >
                    View
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </DashboardPanel>
      </div>

      <DashboardPanel
        title="Latest submissions"
        description="A live sample from across the judge."
        icon={<Code2 className="size-4" />}
        action={
          <Link
            href="/submissions"
            className="text-[11px] font-medium text-primary hover:underline"
          >
            All submissions
          </Link>
        }
        bodyClassName="p-1"
      >
        {submissionPage.items.length === 0 ? (
          <EmptyState
            className="border-0"
            title="No submissions yet"
            description="Judge activity will appear here."
          />
        ) : (
          <SubmissionTable items={submissionPage.items} />
        )}
      </DashboardPanel>
    </div>
  );
}
