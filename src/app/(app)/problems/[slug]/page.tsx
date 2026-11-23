import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ClipboardCheck,
  LockKeyhole,
  Trophy,
} from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";
import { ProblemDescription } from "@/components/problems/problem-description";
import { ProblemDiscussion } from "@/components/problems/problem-discussion";
import { ProblemEditorial } from "@/components/problems/problem-editorial";
import { ProblemHeader } from "@/components/problems/problem-header";
import { ProblemRankboard } from "@/components/problems/problem-rankboard";
import { ProblemResources } from "@/components/problems/problem-resources";
import { ProblemSidebar } from "@/components/problems/problem-sidebar";
import { ProblemStats } from "@/components/problems/problem-stats";
import { ProblemSubmissions } from "@/components/problems/problem-submissions";
import { SectionHeading } from "@/components/shared/section-heading";
import { buttonVariants } from "@/components/ui/button";
import { SubmitPanel } from "@/features/submit/submit-panel";
import { getCurrentUser } from "@/server/auth/session";
import { ApiError } from "@/server/api/errors";
import { getProblemBySlug } from "@/server/services/problems";
import {
  getProblemRankboard,
  getProblemStatistics,
} from "@/server/services/problem-stats";
import {
  DISCUSSION_PAGE_SIZE,
  listCommentsForProblem,
} from "@/server/services/discussions";
import {
  getRelatedProblems,
  listProblemResources,
} from "@/server/services/problem-extras";
import { listSubmissions } from "@/server/services/submissions";
import {
  firstValue,
  readPage,
  type SearchParams,
} from "@/lib/pagination";
import {
  parseProblemTab,
  type ProblemTab,
} from "@/lib/problem-tabs";
import type { ProblemCommentSort } from "@/lib/types";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

const SUBMISSIONS_PAGE_SIZE = 10;

type LockedProblem = {
  kind: "contest" | "assessment" | "premium";
  slug: string;
  title: string;
  moduleSlug?: string;
};

function lockedProblemFrom(error: unknown): LockedProblem | null {
  if (
    !(error instanceof ApiError) ||
    (error.code !== "CONTEST_LOCKED" &&
      error.code !== "ASSESSMENT_LOCKED" &&
      error.code !== "PREMIUM_LOCKED")
  ) {
    return null;
  }
  const details = error.details;
  if (
    typeof details === "object" &&
    details !== null &&
    "slug" in details &&
    "title" in details &&
    typeof details.slug === "string" &&
    typeof details.title === "string"
  ) {
    const kind =
      error.code === "ASSESSMENT_LOCKED"
        ? "assessment"
        : error.code === "PREMIUM_LOCKED"
          ? "premium"
          : "contest";
    const moduleSlug =
      "moduleSlug" in details && typeof details.moduleSlug === "string"
        ? details.moduleSlug
        : undefined;
    return {
      kind,
      slug: details.slug,
      title: details.title,
      moduleSlug,
    };
  }
  return null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  try {
    const problem = await getProblemBySlug(slug, null, false);
    return {
      title: problem?.title ?? "Problem",
      description: problem
        ? `${problem.title} — ${problem.difficulty} problem worth ${problem.points} points.`
        : undefined,
    };
  } catch {
    return { title: "Problem" };
  }
}

export default async function ProblemPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<SearchParams>;
}) {
  const { slug } = await params;
  const query = await searchParams;
  const user = await getCurrentUser();

  let problem: Awaited<ReturnType<typeof getProblemBySlug>> = null;
  let locked: LockedProblem | null = null;
  try {
    problem = await getProblemBySlug(
      slug,
      user?.id ?? null,
      user?.role === "ADMIN",
    );
  } catch (error) {
    locked = lockedProblemFrom(error);
    if (!locked) throw error;
  }

  if (locked) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
        <EmptyState
          title="This problem is locked"
          description={
            locked.kind === "assessment"
              ? `It is part of the running coding assessment "${locked.title}". Open the assessment and join with your access code.`
              : locked.kind === "premium"
                ? `"${locked.title}" is part of the Advanced SQL track. Unlock it once for ৳500 to open the statement, editorial and submissions.`
                : `It is part of the running contest "${locked.title}". Register for the contest to open the statement and submit.`
          }
          icon={LockKeyhole}
          action={
            <div className="flex flex-wrap justify-center gap-2">
              <Link
                href={
                  locked.kind === "assessment"
                    ? `/assessments/${locked.slug}`
                    : locked.kind === "premium"
                      ? "/learn/pricing"
                      : `/contests/${locked.slug}`
                }
                className={buttonVariants()}
              >
                {locked.kind === "assessment"
                  ? "Open assessment"
                  : locked.kind === "premium"
                    ? "Unlock Advanced SQL · ৳500"
                    : "Open contest"}
              </Link>
              {locked.kind === "premium" ? (
                <Link
                  href={`/learn/${locked.moduleSlug ?? "advanced-sql"}`}
                  className={buttonVariants({ variant: "outline" })}
                >
                  See the track
                </Link>
              ) : !user ? (
                <Link
                  href={`/login?next=${encodeURIComponent(
                    locked.kind === "assessment"
                      ? `/assessments/${locked.slug}`
                      : `/contests/${locked.slug}`,
                  )}`}
                  className={buttonVariants({ variant: "outline" })}
                >
                  Sign in first
                </Link>
              ) : null}
            </div>
          }
        />
      </div>
    );
  }

  if (!problem) notFound();

  const acceptance =
    problem.submissionCount > 0
      ? (problem.acceptedCount / problem.submissionCount) * 100
      : 0;
  const sampleInput = problem.samples[0]?.input ?? "";
  const canSubmit = Boolean(user);
  const showInsights = !problem.contestContext && !problem.assessmentContext;
  const requestedTab = parseProblemTab(firstValue(query.tab));
  const activeTab: ProblemTab =
    !showInsights &&
    (requestedTab === "rankboard" ||
      requestedTab === "discussion" ||
      requestedTab === "resources")
      ? "description"
      : requestedTab;
  const page = readPage(query);
  const discussionSort: ProblemCommentSort =
    firstValue(query.sort) === "new" ? "new" : "top";
  const virtualContestId = firstValue(query.virtual)?.slice(0, 64) || null;

  const [statistics, rankboard] =
    activeTab === "rankboard"
      ? await Promise.all([
          getProblemStatistics(problem.id),
          getProblemRankboard(problem.id),
        ])
      : [null, null];
  const submissionPage =
    activeTab === "submissions"
      ? await listSubmissions(
          {
            page,
            pageSize: SUBMISSIONS_PAGE_SIZE,
            problem: problem.slug,
          },
          user,
        )
      : null;
  const submissionTotalPages = submissionPage
    ? Math.max(1, Math.ceil(submissionPage.total / SUBMISSIONS_PAGE_SIZE))
    : 0;
  const showSidebar =
    activeTab === "description" || activeTab === "editorial";
  const discussionPage =
    activeTab === "discussion"
      ? await listCommentsForProblem(problem.id, user, page, discussionSort)
      : null;
  const discussionTotalPages = discussionPage
    ? Math.max(1, Math.ceil(discussionPage.total / DISCUSSION_PAGE_SIZE))
    : 0;
  const resources =
    activeTab === "resources" ? await listProblemResources(problem.id) : null;
  const relatedProblems =
    showSidebar && showInsights
      ? await getRelatedProblems(
          problem.id,
          user?.id ?? null,
          user?.role === "ADMIN",
        )
      : [];
  const canManageResources = Boolean(
    user && (user.role === "ADMIN" || user.id === problem.authorId),
  );
  const isStaff = user?.role === "ADMIN" || user?.role === "TEACHER";
  const isProblemAuthor = Boolean(user && user.id === problem.authorId);
  const reviewHref =
    user?.role === "ADMIN"
      ? `/admin/problems/${problem.id}/contributions`
      : user?.role === "TEACHER"
        ? `/teacher/problems/${problem.id}/contributions`
        : `/dashboard/contributions/${problem.id}`;
  const contributionAction = !user
    ? null
    : isProblemAuthor || user.role === "ADMIN"
      ? { href: reviewHref, label: "Review proposals" }
      : isStaff
        ? {
            href: `/problems/${problem.slug}/contribute`,
            label: "Contribute",
          }
        : problem.solvedByMe
          ? {
              href: `/problems/${problem.slug}/contribute?kind=EDITORIAL`,
              label: "Propose editorial",
            }
          : null;

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      {problem.contestContext ? (
        <div className="mb-3 flex flex-wrap items-center gap-2 rounded-lg border border-primary/30 bg-primary/5 px-4 py-3 text-sm">
          <Trophy className="size-4 text-primary" />
          <span className="text-muted-foreground">Contest problem</span>
          <Link
            href={`/contests/${problem.contestContext.slug}`}
            className="font-medium text-primary hover:underline"
          >
            {problem.contestContext.title}
          </Link>
          <span className="rounded border border-border bg-background px-1.5 py-0.5 font-mono text-xs">
            {problem.contestContext.label}
          </span>
        </div>
      ) : null}
      {problem.assessmentContext ? (
        <div className="mb-5 flex flex-wrap items-center gap-2 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-100">
          <ClipboardCheck className="size-4" />
          <span className="opacity-80">Coding assessment</span>
          <Link
            href={`/assessments/${problem.assessmentContext.slug}`}
            className="font-medium underline underline-offset-2"
          >
            {problem.assessmentContext.title}
          </Link>
          <span className="rounded border border-amber-300 bg-background px-1.5 py-0.5 font-mono text-xs text-foreground dark:border-amber-800">
            {problem.assessmentContext.label}
          </span>
        </div>
      ) : null}

      <ProblemHeader
        problem={problem}
        showInsights={showInsights}
        activeTab={activeTab}
        action={contributionAction}
      />

      <div
        className={cn(
          "mt-8",
          showSidebar && "grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]",
        )}
      >
        <div className="min-w-0">
          {activeTab === "description" ? (
            <ProblemDescription problem={problem} />
          ) : null}
          {activeTab === "rankboard" && statistics && rankboard ? (
            <div className="space-y-4">
              <ProblemStats
                statistics={statistics}
                solverCount={rankboard.totalSolvers}
              />
              <ProblemRankboard data={rankboard} score={problem.points} />
            </div>
          ) : null}
          {activeTab === "submissions" && submissionPage ? (
            <ProblemSubmissions
              slug={problem.slug}
              items={submissionPage.items}
              total={submissionPage.total}
              page={page}
              totalPages={submissionTotalPages}
              searchParams={query}
            />
          ) : null}
          {activeTab === "discussion" && discussionPage ? (
            <ProblemDiscussion
              slug={problem.slug}
              items={discussionPage.items}
              total={discussionPage.total}
              page={page}
              totalPages={discussionTotalPages}
              sort={discussionSort}
              viewer={user}
              searchParams={query}
            />
          ) : null}
          {activeTab === "editorial" ? (
            <ProblemEditorial problem={problem} />
          ) : null}
          {activeTab === "resources" && resources ? (
            <ProblemResources
              slug={problem.slug}
              resources={resources}
              canManage={canManageResources}
            />
          ) : null}
        </div>

        {showSidebar ? (
          <ProblemSidebar
            problem={problem}
            relatedProblems={relatedProblems}
            showInsights={showInsights}
            canRate={Boolean(user)}
            acceptance={acceptance}
          />
        ) : null}
      </div>

      <section id="submit" className="mt-14 scroll-mt-24 border-t border-border pt-10">
        <SectionHeading
          title="Solve this problem"
          description="Write your solution, test it against custom input, then submit for a real verdict."
        />
        <div className="mt-6">
          <SubmitPanel
            problemId={problem.id}
            contestId={problem.contestContext?.id ?? null}
            assessmentId={problem.assessmentContext?.id ?? null}
            virtualContestId={virtualContestId}
            timeLimitMs={problem.timeLimitMs}
            memoryLimitMb={problem.memoryLimitMb}
            sampleInput={sampleInput}
            canSubmit={canSubmit}
            loginNext={`/problems/${problem.slug}`}
            judgeLanguage={problem.judgeLanguage}
          />
        </div>
      </section>
    </div>
  );
}
