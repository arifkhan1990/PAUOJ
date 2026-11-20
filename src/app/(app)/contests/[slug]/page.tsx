import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  CalendarDays,
  Clock3,
  ListChecks,
  LockKeyhole,
  Users,
} from "lucide-react";
import { ContestRegisterButton } from "@/features/contests/contest-register-button";
import { VirtualContestButton } from "@/features/contests/virtual-contest-button";
import { ContestStatusBadge } from "@/components/contests/contest-status-badge";
import { ContestTabs } from "@/components/contests/contest-tabs";
import { Countdown } from "@/components/shared/countdown";
import { DifficultyBadge } from "@/components/shared/difficulty-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { Markdown } from "@/components/shared/markdown";
import { SolveStatus } from "@/components/shared/solve-status";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getCurrentUser } from "@/server/auth/session";
import { getContestBySlug } from "@/server/services/contests";
import { CONTEST_DIVISION_LABEL, contestDurationMs } from "@/lib/contests";
import {
  formatDateTime,
  formatDuration,
} from "@/lib/utils";

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
    description: contest?.description.slice(0, 160),
  };
}

export default async function ContestPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const user = await getCurrentUser();
  const contest = await getContestBySlug(
    slug,
    user?.id ?? null,
    user?.role === "ADMIN",
  );
  if (!contest) notFound();

  const isAdmin = user?.role === "ADMIN";
  const showProblems = contest.status !== "UPCOMING" || isAdmin;
  const canOpenProblems = contest.registered || contest.status === "ENDED" || isAdmin;
  const countdownTarget =
    contest.status === "RUNNING"
      ? { target: contest.endAt, label: "Ends in" }
      : contest.status === "UPCOMING"
        ? { target: contest.startAt, label: "Starts in" }
        : null;

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <Link href="/contests" className="hover:text-primary">
          Contests
        </Link>
        <span>/</span>
        <span className="font-mono">{contest.slug}</span>
      </div>

      <header className="mt-4 border-b border-border pb-6">
        <div className="flex flex-wrap items-center gap-2">
          <ContestStatusBadge status={contest.status} />
          <span className="rounded border border-border bg-muted/60 px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
            {CONTEST_DIVISION_LABEL[contest.division]}
          </span>
          {contest.registered ? (
            <span className="text-xs font-medium text-primary">You are registered</span>
          ) : null}
          {countdownTarget ? (
            <Countdown
              target={countdownTarget.target}
              label={countdownTarget.label}
              className="text-xs text-muted-foreground"
            />
          ) : (
            <span className="text-xs text-muted-foreground">Contest ended</span>
          )}
        </div>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
          {contest.title}
        </h1>
        <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <CalendarDays className="size-3.5" />
            {formatDateTime(contest.startAt)} — {formatDateTime(contest.endAt)}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Clock3 className="size-3.5" />
            {formatDuration(contestDurationMs(contest.startAt, contest.endAt))}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Users className="size-3.5" />
            {contest.participantCount} registered
          </span>
          <span className="inline-flex items-center gap-1.5">
            <ListChecks className="size-3.5" />
            {contest.problemCount} problems
          </span>
        </div>
        <div className="mt-5 flex flex-wrap items-center gap-2">
          <ContestRegisterButton
            slug={contest.slug}
            registered={contest.registered}
            canRegister={contest.canRegister}
            isAuthenticated={Boolean(user)}
            ended={contest.status === "ENDED"}
          />
          {contest.status === "ENDED" && user ? (
            <VirtualContestButton slug={contest.slug} />
          ) : null}
        </div>
      </header>

      <ContestTabs slug={contest.slug} active="problems" className="mt-4" />

      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0 space-y-8">
          <section>
            <h2 className="text-lg font-semibold">About this contest</h2>
            <Markdown className="mt-3">{contest.description}</Markdown>
          </section>

          {!canOpenProblems && contest.status === "RUNNING" ? (
            <div className="flex flex-wrap items-center gap-3 rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-100">
              <LockKeyhole className="size-5" />
              <p className="flex-1">
                Register for the contest to open the problem set and submit.
              </p>
              <ContestRegisterButton
                slug={contest.slug}
                registered={contest.registered}
                canRegister={contest.canRegister}
                isAuthenticated={Boolean(user)}
                ended={false}
              />
            </div>
          ) : null}

          <section>
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-lg font-semibold">Problems</h2>
              {contest.registered && contest.status === "RUNNING" ? (
                <span className="text-xs text-muted-foreground">
                  Contest submissions count toward the scoreboard
                </span>
              ) : null}
            </div>
            {!showProblems ? (
              <EmptyState
                className="mt-3"
                title="Problem set is locked"
                description={`The ${contest.problemCount} contest problems unlock when the contest starts.`}
                icon={LockKeyhole}
              />
            ) : contest.problems.length === 0 ? (
              <EmptyState
                className="mt-3"
                title="No problems added"
                description="The problem set has not been published yet."
                icon={ListChecks}
              />
            ) : (
              <Card className="mt-3 overflow-hidden p-1">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">#</TableHead>
                      <TableHead>Problem</TableHead>
                      <TableHead className="hidden sm:table-cell">Difficulty</TableHead>
                      <TableHead className="text-right">Points</TableHead>
                      <TableHead className="w-12 text-center">
                        <span className="sr-only">Status</span>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {contest.problems.map((problem) => (
                      <TableRow key={problem.label}>
                        <TableCell className="font-mono text-xs font-semibold">
                          {problem.label}
                        </TableCell>
                        <TableCell>
                          {canOpenProblems ? (
                            <Link
                              href={`/problems/${problem.slug}`}
                              className="text-sm font-medium hover:text-primary"
                            >
                              {problem.title}
                            </Link>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                              <LockKeyhole className="size-3.5" /> {problem.title}
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          <DifficultyBadge difficulty={problem.difficulty} />
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm">
                          {problem.points}
                        </TableCell>
                        <TableCell className="text-center">
                          {showProblems && canOpenProblems ? (
                            <SolveStatus
                              solved={problem.solvedByMe}
                              attempted={problem.attemptedByMe}
                            />
                          ) : (
                            <span className="text-muted-foreground">·</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>
            )}
          </section>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
          <Card className="p-5">
            <h2 className="text-sm font-semibold">Contest details</h2>
            <dl className="mt-3 space-y-2.5 text-sm">
              <div className="flex items-center justify-between gap-3">
                <dt className="text-muted-foreground">Starts</dt>
                <dd className="text-right font-mono text-[11px]">
                  {formatDateTime(contest.startAt)}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-muted-foreground">Ends</dt>
                <dd className="text-right font-mono text-[11px]">
                  {formatDateTime(contest.endAt)}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-muted-foreground">Duration</dt>
                <dd className="font-mono text-[11px]">
                  {formatDuration(contestDurationMs(contest.startAt, contest.endAt))}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-muted-foreground">Registered</dt>
                <dd className="font-mono text-[11px]">{contest.participantCount}</dd>
              </div>
            </dl>
          </Card>

          <Card className="p-5">
            <h2 className="text-sm font-semibold">Scoring</h2>
            <ul className="mt-2 space-y-1.5 text-xs leading-relaxed text-muted-foreground">
              <li>ICPC-style scoring: most problems solved wins.</li>
              <li>Each rejected attempt before acceptance adds 20 penalty minutes.</li>
              <li>Compilation errors do not add a penalty.</li>
              <li>Source code stays hidden from other users while the contest runs.</li>
              <li>Only registered participants can submit contest problems.</li>
            </ul>
          </Card>
        </aside>
      </div>
    </div>
  );
}
