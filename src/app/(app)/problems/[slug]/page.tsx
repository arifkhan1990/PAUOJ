import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ClipboardCheck,
  Trophy,
} from "lucide-react";
import { ContestIntegrityShield } from "@/components/contests/contest-integrity-shield";
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
import { SubmitPanel } from "@/features/submit/submit-panel";
import { getCurrentUser } from "@/server/auth/session";
import {
  lockedProblemFrom,
  type LockedProblem,
} from "./locked-problem";
import { LockedProblemView } from "./locked-problem-view";
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
    return <LockedProblemView locked={locked} isSignedIn={Boolean(user)} />;
  }

  if (!problem) notFound();

  const acceptance =
    problem.submissionCount > 0
      ? (problem.acceptedCount / problem.submissionCount) * 100
      : 0;
  const canSubmit = Boolean(user);
  const showInsights = !problem.contestContext && !problem.assessmentContext;
  const contestContext = problem.contestContext;
  const contestRunning = contestContext?.status === "RUNNING";
  const requestedTab = parseProblemTab(firstValue(query.tab));
  const activeTab: ProblemTab =
    (!showInsights &&
      (requestedTab === "rankboard" ||
        requestedTab === "discussion" ||
        requestedTab === "resources")) ||
    (contestRunning && requestedTab === "editorial")
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
            // Standalone public problem pages only expose public rows; contest
            // and assessment pages keep their own participants-only views.
            publicOnly:
              problem.isPublic && !contestContext && user?.role !== "ADMIN",
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

  const statementBody = (
    <>
      {contestContext ? (
        <div className="mb-3 flex flex-wrap items-center gap-2 rounded-lg border border-primary/30 bg-primary/5 px-4 py-3 text-sm">
          <Trophy className="size-4 text-primary" />
          <span className="text-muted-foreground">Contest problem</span>
          <Link
            href={`/contests/${contestContext.slug}`}
            className="font-medium text-primary hover:underline"
          >
            {contestContext.title}
          </Link>
          <span className="rounded border border-border bg-background px-1.5 py-0.5 font-mono text-xs">
            {contestContext.label}
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
        showEditorial={!contestRunning}
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
    </>
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      {contestRunning && contestContext ? (
        <ContestIntegrityShield
          contestSlug={contestContext.slug}
          contestTitle={contestContext.title}
          watermark={contestContext.integrityWatermark}
          problemId={problem.id}
        >
          {statementBody}
        </ContestIntegrityShield>
      ) : (
        statementBody
      )}

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
            samples={problem.samples.map(({ input, output }) => ({
              input,
              output,
            }))}
            canSubmit={canSubmit}
            loginNext={`/problems/${problem.slug}`}
            judgeLanguage={problem.judgeLanguage}
          />
        </div>
      </section>
    </div>
  );
}
