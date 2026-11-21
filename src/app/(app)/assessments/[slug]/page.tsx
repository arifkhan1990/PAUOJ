import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  CalendarDays,
  ClipboardCheck,
  Clock3,
  ListChecks,
  LockKeyhole,
  Target,
  UserCheck,
} from "lucide-react";
import { AssessmentFinishButton } from "@/features/assessments/assessment-finish-button";
import { AssessmentJoinForm } from "@/features/assessments/assessment-join-form";
import { AssessmentPhaseBadge, ParticipantStatusBadge } from "@/components/assessments/assessment-status-badge";
import { Countdown } from "@/components/shared/countdown";
import { DifficultyBadge } from "@/components/shared/difficulty-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { Markdown } from "@/components/shared/markdown";
import { SolveStatus } from "@/components/shared/solve-status";
import { SubmissionTable } from "@/components/submissions/submission-table";
import { Badge } from "@/components/ui/badge";
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
import { getCurrentUser } from "@/server/auth/session";
import { getAssessmentBySlug } from "@/server/services/assessments";
import { listSubmissions } from "@/server/services/submissions";
import { formatDateTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  return { title: `Assessment · ${slug}` };
}

export default async function AssessmentPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const user = await getCurrentUser();
  const assessment = await getAssessmentBySlug(
    slug,
    user?.id ?? null,
    user?.role === "ADMIN",
  );
  if (!assessment) notFound();

  const isParticipant = Boolean(assessment.participant);
  const active = assessment.participant?.status === "ACTIVE";
  const canSeeProblems = isParticipant || assessment.isAdminPreview;
  const submissions =
    user && isParticipant
      ? await listSubmissions(
          { page: 1, pageSize: 10, mine: "true", assessment: slug },
          user,
        )
      : null;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <span>Assessments</span>
        <span>/</span>
        <span className="font-mono">{assessment.slug}</span>
      </div>

      <header className="mt-4 border-b border-border pb-6">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="muted" className="gap-1">
            <ClipboardCheck className="size-3" /> Coding assessment
          </Badge>
          <AssessmentPhaseBadge phase={assessment.phase} />
          {assessment.participant ? (
            <ParticipantStatusBadge status={assessment.participant.status} />
          ) : null}
          {active ? (
            <Countdown
              target={assessment.participant?.expiresAt ?? assessment.endAt}
              label="Time left"
              className="text-xs text-muted-foreground"
            />
          ) : null}
        </div>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
          {assessment.title}
        </h1>
        <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <CalendarDays className="size-3.5" />
            {formatDateTime(assessment.startAt)} — {formatDateTime(assessment.endAt)}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Clock3 className="size-3.5" />
            {assessment.durationMinutes
              ? `${assessment.durationMinutes} minute session`
              : "Whole window"}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <ListChecks className="size-3.5" />
            {assessment.problemCount} problems
          </span>
          <span className="inline-flex items-center gap-1.5">
            <UserCheck className="size-3.5" />
            {assessment.participantCount} joined
          </span>
        </div>
      </header>

      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-7">
          <section>
            <h2 className="text-lg font-semibold">About this assessment</h2>
            <Markdown className="mt-3">{assessment.description}</Markdown>
          </section>

          {canSeeProblems ? (
            <section>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-lg font-semibold">Problems</h2>
                {active ? (
                  <span className="text-xs text-muted-foreground">
                    Submissions are locked when your timer ends.
                  </span>
                ) : null}
              </div>
              {assessment.problems.length === 0 ? (
                <EmptyState
                  className="mt-3"
                  title="No problems added"
                  description="This assessment is still being prepared."
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
                      {assessment.problems.map((problem) => (
                        <TableRow key={problem.label}>
                          <TableCell className="font-mono text-xs font-semibold">
                            {problem.label}
                          </TableCell>
                          <TableCell>
                            {active || assessment.phase === "ENDED" ? (
                              <Link
                                href={`/problems/${problem.slug}`}
                                className="text-sm font-medium hover:text-primary"
                              >
                                {problem.title}
                              </Link>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                                <LockKeyhole className="size-3.5" />
                                {problem.title}
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
                            {isParticipant ? (
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
          ) : null}

          {isParticipant && submissions ? (
            <section>
              <h2 className="text-lg font-semibold">Your submissions</h2>
              <Card className="mt-3 overflow-hidden p-1">
                {submissions.items.length === 0 ? (
                  <EmptyState
                    className="border-0"
                    title="No submissions yet"
                    description="Open a problem and submit your first solution."
                    icon={ClipboardCheck}
                  />
                ) : (
                  <SubmissionTable items={submissions.items} showUser={false} />
                )}
              </Card>
            </section>
          ) : null}
        </div>

        <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
          {!user ? (
            <Card className="p-5">
              <h2 className="flex items-center gap-2 text-sm font-semibold">
                <LockKeyhole className="size-4 text-primary" /> Sign in required
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                {assessment.joinMode === "INVITE"
                  ? "Sign in with your PAU OJ account, then open your personal invite link to start the assessment."
                  : "Sign in with your PAU OJ account, then enter the access code to start the assessment."}
              </p>
              <Link
                href={`/login?next=${encodeURIComponent(`/assessments/${assessment.slug}`)}`}
                className={`${buttonVariants()} mt-4 w-full`}
              >
                Sign in to continue
              </Link>
            </Card>
          ) : assessment.isAdminPreview ? (
            <Card className="p-5">
              <h2 className="text-sm font-semibold">Admin preview</h2>
              <p className="mt-1 text-xs text-muted-foreground">
                You are viewing this assessment as an administrator.
              </p>
              <div className="mt-3 rounded-md border border-border bg-muted/40 p-3">
                <p className="text-[11px] text-muted-foreground">Access code</p>
                <p className="mt-0.5 font-mono text-lg font-semibold tracking-wider">
                  {assessment.accessCode}
                </p>
              </div>
              <div className="mt-4 grid gap-2">
                <Link
                  href={`/admin/assessments/${assessment.id}`}
                  className={buttonVariants({ variant: "outline" })}
                >
                  View results
                </Link>
                <Link
                  href={`/admin/assessments/${assessment.id}/edit`}
                  className={buttonVariants({ variant: "ghost" })}
                >
                  Edit assessment
                </Link>
              </div>
            </Card>
          ) : assessment.participant ? (
            <Card className="p-5">
              <h2 className="text-sm font-semibold">Your session</h2>
              <div className="mt-3 space-y-2.5 text-sm">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-muted-foreground">Status</span>
                  <ParticipantStatusBadge status={assessment.participant.status} />
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-muted-foreground">Started</span>
                  <span className="font-mono text-[11px]">
                    {formatDateTime(assessment.participant.startedAt)}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-muted-foreground">Ends</span>
                  <span className="font-mono text-[11px]">
                    {formatDateTime(assessment.participant.expiresAt)}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-muted-foreground">Solved</span>
                  <span className="font-mono">
                    {assessment.mySolved}/{assessment.problemCount}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-muted-foreground">Points</span>
                  <span className="font-mono">{assessment.myPoints}</span>
                </div>
              </div>
              {assessment.canFinish ? (
                <div className="mt-4">
                  <AssessmentFinishButton slug={assessment.slug} />
                </div>
              ) : (
                <p className="mt-4 rounded-md border border-border bg-muted/40 p-2.5 text-xs text-muted-foreground">
                  {assessment.participant.status === "FINISHED"
                    ? "You finished this assessment. Answers are locked."
                    : "Your session expired. Answers are locked."}
                </p>
              )}
            </Card>
          ) : assessment.phase === "RUNNING" && assessment.isPublished ? (
            assessment.joinMode === "INVITE" ? (
              <Card className="p-5">
                <h2 className="text-sm font-semibold">
                  Invite-only assessment
                </h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  Open the personal link from your instructor. The shared access
                  code is disabled for this assessment.
                </p>
              </Card>
            ) : (
              <Card className="p-5">
                <h2 className="text-sm font-semibold">Join this assessment</h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  Enter the access code from your instructor. The timer starts
                  immediately.
                </p>
                <div className="mt-4">
                  <AssessmentJoinForm slug={assessment.slug} />
                </div>
              </Card>
            )
          ) : (
            <Card className="p-5">
              <h2 className="text-sm font-semibold">
                {assessment.phase === "UPCOMING"
                  ? "Not started yet"
                  : "Assessment closed"}
              </h2>
              <p className="mt-1 text-xs text-muted-foreground">
                {assessment.phase === "UPCOMING"
                  ? `This assessment opens ${formatDateTime(assessment.startAt)}.`
                  : "This assessment is no longer accepting participants."}
              </p>
            </Card>
          )}

          <Card className="p-5">
            <h2 className="flex items-center gap-2 text-sm font-semibold">
              <Target className="size-4 text-primary" /> Rules
            </h2>
            <ul className="mt-2 space-y-1.5 text-xs leading-relaxed text-muted-foreground">
              <li>Your timer starts when you join and cannot be paused.</li>
              <li>Full test verdicts are private to you and the administrators.</li>
              <li>Source code is hidden from other candidates during the test.</li>
              <li>You can finish early; submissions stop immediately after.</li>
              <li>Do not share the access code or your account.</li>
            </ul>
          </Card>
        </aside>
      </div>
    </div>
  );
}
