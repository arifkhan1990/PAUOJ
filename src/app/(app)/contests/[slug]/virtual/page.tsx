import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ListChecks, Play, Trophy } from "lucide-react";
import { FinishVirtualContestButton } from "@/features/contests/finish-virtual-contest-button";
import { VirtualContestButton } from "@/features/contests/virtual-contest-button";
import { Countdown } from "@/components/shared/countdown";
import { DifficultyBadge } from "@/components/shared/difficulty-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { SolveStatus } from "@/components/shared/solve-status";
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
import { requireUser } from "@/server/auth/guards";
import { getVirtualContest } from "@/server/services/virtual-contests";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  return { title: `Virtual contest · ${slug}` };
}

export default async function VirtualContestPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const user = await requireUser(`/contests/${slug}/virtual`);
  const virtual = await getVirtualContest(slug, user.id);
  if (!virtual) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
        <EmptyState
          title="No virtual contest running"
          description="Start a personal replay of this ended contest. Your submissions and timer stay separate from the official scoreboard."
          icon={Play}
          action={<VirtualContestButton slug={slug} />}
        />
        <p className="mt-4 text-center text-xs text-muted-foreground">
          <Link href={`/contests/${slug}`} className="hover:text-primary">
            Back to the contest
          </Link>
        </p>
      </div>
    );
  }

  const finished = Boolean(virtual.finishedAt);
  const target = finished ? null : virtual.endsAt;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <PageHeader
        eyebrow="Virtual contest"
        title={virtual.contestTitle}
        description="A personal replay with its own timer and scoreboard."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={`/contests/${slug}`}
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              <ArrowLeft className="size-3.5" /> Contest
            </Link>
            {finished ? (
              <VirtualContestButton slug={slug} label="Start again" />
            ) : (
              <FinishVirtualContestButton slug={slug} />
            )}
          </div>
        }
      />

      <div className="mt-5 grid gap-4 sm:grid-cols-3">
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">Status</p>
          <p className="mt-1 text-sm font-semibold">
            {finished ? "Finished" : "Running"}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">Score</p>
          <p className="mt-1 text-sm font-semibold">
            {virtual.solved} solved · {virtual.penalty} penalty
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">Timer</p>
          <p className="mt-1 text-sm font-semibold">
            {target ? (
              <Countdown target={target} label="Ends in" />
            ) : (
              "Ended"
            )}
          </p>
        </Card>
      </div>

      <section className="mt-8">
        <div className="flex items-center gap-2">
          <ListChecks className="size-4 text-primary" />
          <h2 className="text-lg font-semibold">Problems</h2>
        </div>
        <Card className="mt-3 overflow-hidden p-1">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">#</TableHead>
                <TableHead>Problem</TableHead>
                <TableHead className="hidden sm:table-cell">Difficulty</TableHead>
                <TableHead className="text-right">Points</TableHead>
                <TableHead className="w-16 text-center">
                  <span className="sr-only">Status</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {virtual.problems.map((problem) => (
                <TableRow key={problem.label}>
                  <TableCell className="font-mono text-xs font-semibold">
                    {problem.label}
                  </TableCell>
                  <TableCell>
                    <Link
                      href={`/problems/${problem.slug}?virtual=${virtual.id}`}
                      className="text-sm font-medium hover:text-primary"
                    >
                      {problem.title}
                    </Link>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <DifficultyBadge difficulty={problem.difficulty} />
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm">
                    {problem.points}
                  </TableCell>
                  <TableCell className="text-center">
                    <SolveStatus
                      solved={problem.solvedByMe}
                      attempted={problem.attemptedByMe}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </section>

      <p className="mt-4 flex items-center gap-1.5 text-xs text-muted-foreground">
        <Trophy className="size-3.5" />
        Virtual submissions never change the official standings or ratings.
      </p>
    </div>
  );
}
