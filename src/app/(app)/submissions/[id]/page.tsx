import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Clock3,
  EyeOff,
  ListChecks,
  User as UserIcon,
} from "lucide-react";
import { AutoRefresh } from "@/components/shared/auto-refresh";
import { UserAvatar } from "@/components/shared/user-avatar";
import { VerdictBadge } from "@/components/shared/verdict-badge";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { MoreChallenges } from "@/features/submissions/more-challenges";
import { SubmissionAnalysisBlock } from "@/features/submissions/submission-analysis";
import { SubmissionCode } from "@/features/submissions/submission-code";
import { SubmissionLive } from "@/features/submissions/submission-live";
import { SubmissionNote } from "@/features/submissions/submission-note";
import { RejudgeButton } from "@/features/submissions/rejudge-button";
import { getCurrentUser } from "@/server/auth/session";
import { getSubmissionById } from "@/server/services/submissions";
import { getRelatedProblems } from "@/server/services/problem-extras";
import { getSubmissionAnalysis } from "@/server/services/submission-analysis";
import { highlightCode } from "@/server/highlight";
import { getLanguage } from "@/lib/languages";
import { isPendingVerdict } from "@/lib/verdicts";
import {
  formatDateTime,
  formatMemory,
  formatRuntime,
  shortId,
} from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  return { title: `Submission ${shortId(id)}` };
}

export default async function SubmissionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getCurrentUser();
  const submission = await getSubmissionById(id, user);
  if (!submission) notFound();

  const [highlighted, analysis, relatedProblems] = await Promise.all([
    submission.sourceCode
      ? highlightCode(submission.sourceCode, submission.language)
      : Promise.resolve(null),
    getSubmissionAnalysis(submission.id),
    getRelatedProblems(
      submission.problemId,
      user?.id ?? null,
      user?.role === "ADMIN",
      3,
    ),
  ]);
  const language = getLanguage(submission.language);
  const pending = isPendingVerdict(submission.status);
  const lineCount = submission.sourceCode
    ? submission.sourceCode.split("\n").length
    : 0;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <AutoRefresh enabled={pending} intervalMs={3000} />

      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <Link href="/submissions" className="hover:text-primary">
          Submissions
        </Link>
        <span>/</span>
        <span className="font-mono">{shortId(submission.id)}</span>
      </div>

      <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <VerdictBadge status={submission.status} />
            <span className="font-mono text-xs text-muted-foreground">
              #{shortId(submission.id)}
            </span>
          </div>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">
            <Link
              href={`/problems/${submission.problem.slug}`}
              className="hover:text-primary"
            >
              {submission.problem.title}
            </Link>
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <UserIcon className="size-3.5" />
              <Link
                href={`/users/${submission.user.username}`}
                className="inline-flex items-center gap-1.5 hover:text-primary"
              >
                <UserAvatar
                  name={submission.user.displayName}
                  username={submission.user.username}
                  size="sm"
                  className="size-5 text-[8px]"
                  avatarPreset={submission.user.avatarPreset}
                  avatarImageAt={submission.user.avatarImageUpdatedAt}
                />
                {submission.user.displayName}
              </Link>
            </span>
            <span>{language.label}</span>
            <span>{formatDateTime(submission.createdAt)}</span>
            {submission.contestSlug ? (
              <Link
                href={`/contests/${submission.contestSlug}`}
                className="hover:text-primary"
              >
                contest submission
              </Link>
            ) : null}
            {submission.assessmentSlug ? (
              <Link
                href={`/assessments/${submission.assessmentSlug}`}
                className="hover:text-primary"
              >
                assessment submission
              </Link>
            ) : null}
          </div>
        </div>
        {user?.role === "ADMIN" ? (
          <RejudgeButton submissionId={submission.id} />
        ) : null}
      </div>

      {pending ? (
        <div className="mt-5">
          <SubmissionLive
            submissionId={submission.id}
            initialStatus={submission.status}
            initialPassed={submission.passedTests}
            initialTotal={submission.totalTests}
          />
        </div>
      ) : null}

      {analysis ? (
        <SubmissionAnalysisBlock
          analysis={analysis}
          languageLabel={language.label}
        />
      ) : (
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Card className="p-4">
            <p className="text-xs text-muted-foreground">Tests passed</p>
            <p className="mt-1 font-mono text-lg font-semibold">
              {submission.passedTests}/{submission.totalTests}
            </p>
          </Card>
          <Card className="p-4">
            <p className="text-xs text-muted-foreground">Runtime</p>
            <p className="mt-1 font-mono text-lg font-semibold">
              {formatRuntime(submission.runtimeMs)}
            </p>
          </Card>
          <Card className="p-4">
            <p className="text-xs text-muted-foreground">Memory</p>
            <p className="mt-1 font-mono text-lg font-semibold">
              {formatMemory(submission.memoryKb)}
            </p>
          </Card>
          <Card className="p-4">
            <p className="text-xs text-muted-foreground">Language</p>
            <p className="mt-1 text-sm font-semibold">{language.shortLabel}</p>
          </Card>
        </div>
      )}

      {submission.compileOutput ? (
        <Card className="mt-5 overflow-hidden">
          <div className="border-b border-border bg-muted/40 px-4 py-2.5">
            <h2 className="text-sm font-semibold">Compiler output</h2>
          </div>
          <pre className="max-h-80 overflow-auto bg-[#0d1117] p-4 font-mono text-xs leading-relaxed text-slate-300">
            {submission.compileOutput}
          </pre>
        </Card>
      ) : null}

      {submission.errorMessage ? (
        <Card className="mt-5 border-rose-300 bg-rose-50 p-4 text-sm text-rose-900 dark:border-rose-800 dark:bg-rose-950 dark:text-rose-100">
          <p className="font-medium">Judge message</p>
          <p className="mt-1 text-xs">{submission.errorMessage}</p>
        </Card>
      ) : null}

      <div className="mt-5 grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
        {highlighted && submission.sourceCode ? (
          <SubmissionCode
            html={highlighted}
            languageLabel={language.label}
            lineCount={lineCount}
            copyValue={submission.sourceCode}
          />
        ) : (
          <Card className="min-w-0 overflow-hidden">
            <div className="border-b border-border px-4 py-2.5">
              <h2 className="text-sm font-semibold">Source code</h2>
            </div>
            <div className="flex items-start gap-3 p-5 text-sm text-muted-foreground">
              <EyeOff className="mt-0.5 size-4 shrink-0" />
              <div>
                <p className="font-medium text-foreground">Source hidden</p>
                <p className="mt-1 text-xs">
                  Source code for contest submissions is hidden while the contest
                  is running. Assessment submissions stay private to the candidate
                  and administrators.
                </p>
              </div>
            </div>
          </Card>
        )}

        <Card className="overflow-hidden">
          <div className="border-b border-border px-4 py-2.5">
            <h2 className="flex items-center gap-1.5 text-sm font-semibold">
              <ListChecks className="size-4" /> Test results
            </h2>
          </div>
          {submission.results.length === 0 ? (
            <div className="p-5 text-sm text-muted-foreground">
              <p>No per-test details recorded.</p>
              {pending ? (
                <p className="mt-1 text-xs">
                  Results will appear as soon as the judge starts each test.
                </p>
              ) : null}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>Verdict</TableHead>
                  <TableHead className="text-right">Time</TableHead>
                  <TableHead className="text-right">Memory</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {submission.results.map((result) => (
                  <TableRow key={result.position}>
                    <TableCell className="font-mono text-xs">
                      {result.position}
                    </TableCell>
                    <TableCell>
                      <VerdictBadge status={result.status} short />
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs">
                      {formatRuntime(result.runtimeMs)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs">
                      {formatMemory(result.memoryKb)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          {submission.results.some((result) => result.message) ? (
            <div className="border-t border-border p-4">
              <p className="text-xs font-medium text-muted-foreground">
                Error output
              </p>
              <pre className="mt-1 max-h-40 overflow-auto rounded-md bg-muted/50 p-2.5 font-mono text-[11px]">
                {submission.results
                  .filter((result) => result.message)
                  .map(
                    (result) =>
                      `test ${result.position}: ${result.message ?? ""}`,
                  )
                  .join("\n\n")}
              </pre>
            </div>
          ) : null}
        </Card>
      </div>

      {submission.assessmentSlug ? null : (
        <MoreChallenges problems={relatedProblems} />
      )}

      {submission.isOwner ? (
        <SubmissionNote
          submissionId={submission.id}
          initialNote={submission.note}
        />
      ) : null}

      <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-5 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <Clock3 className="size-3.5" />
          Judged at{" "}
          {submission.judgedAt ? formatDateTime(submission.judgedAt) : "—"}
        </span>
        <div className="flex gap-2">
          <Link
            href={`/submissions?problem=${submission.problem.slug}`}
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            Problem submissions
          </Link>
          <Link
            href={`/problems/${submission.problem.slug}`}
            className={buttonVariants({ size: "sm" })}
          >
            Open problem
          </Link>
        </div>
      </div>
    </div>
  );
}
