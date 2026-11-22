import type { Metadata } from "next";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  Award,
  Clock3,
  Compass,
  FileCode2,
  Layers3,
  LockKeyhole,
  LogIn,
  Play,
  Route,
} from "lucide-react";
import { ModuleCard } from "@/components/learning/module-card";
import { LearningProgressBar } from "@/components/learning/learning-progress";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { LearningModuleSummary } from "@/lib/learning/types";
import { cn } from "@/lib/utils";
import { getCurrentUser } from "@/server/auth/session";
import { getLearningOverview } from "@/server/services/learning";

export const metadata: Metadata = {
  title: "Learning tracks",
  description:
    "A seven-track curriculum from basic programming to advanced algorithms, with concept notes, guided practice and timed checkpoints.",
};

export const dynamic = "force-dynamic";

type TrackStat = { label: string; value: number; hint: string; icon: LucideIcon };

type NextUp = { module: LearningModuleSummary; action: string; meta: string };

function trackNumber(order: number) {
  return String(order).padStart(2, "0");
}

/** Picks the most useful next stop from data the overview already returns. */
function pickNextUp(
  modules: LearningModuleSummary[],
  signedIn: boolean,
): NextUp | null {
  const available = modules.filter(
    (module) => module.status === "LIVE" && !module.locked,
  );
  if (available.length === 0) return null;

  const inProgress = available.find(
    (module) =>
      module.progress.solved > 0 &&
      module.progress.solved < module.progress.total,
  );
  if (inProgress) {
    return {
      module: inProgress,
      action: `Continue track ${trackNumber(inProgress.order)}`,
      meta: `${inProgress.progress.solved} of ${inProgress.progress.total} problems solved`,
    };
  }

  const fresh = available.find((module) => module.progress.solved === 0);
  if (fresh) {
    return {
      module: fresh,
      action: `${signedIn ? "Start" : "Preview"} track ${trackNumber(fresh.order)}`,
      meta: `${fresh.topicCount} topics · about ${fresh.estimatedHours} h`,
    };
  }

  const review = available.find(
    (module) =>
      module.progress.total > 0 &&
      module.progress.solved >= module.progress.total,
  );
  if (review) {
    return {
      module: review,
      action: `Review track ${trackNumber(review.order)}`,
      meta: review.badgeEarned
        ? "Badge earned — ready for a review"
        : "Every problem solved",
    };
  }

  const fallback = available[0];
  if (!fallback) return null;
  return {
    module: fallback,
    action: `Start track ${trackNumber(fallback.order)}`,
    meta: `${fallback.topicCount} topics · about ${fallback.estimatedHours} h`,
  };
}

function HeroActions({
  nextUp,
  signedIn,
}: {
  nextUp: NextUp | null;
  signedIn: boolean;
}) {
  return (
    <div className="mt-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
        <Link
          href={nextUp ? `/learn/${nextUp.module.slug}` : "/problems"}
          className={cn(buttonVariants({ size: "lg" }), "w-full sm:w-auto")}
        >
          <Play className="size-4" aria-hidden="true" />
          {nextUp ? nextUp.action : "Explore problems"}
        </Link>
        <Link
          href={signedIn ? "/problems" : "/login?next=/learn"}
          className={cn(
            buttonVariants({ variant: "outline", size: "lg" }),
            "w-full sm:w-auto",
          )}
        >
          {signedIn ? "Problem archive" : "Sign in to save progress"}
        </Link>
      </div>
      {nextUp ? (
        <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
          Next up:{" "}
          <span className="font-medium text-foreground">
            {nextUp.module.title}
          </span>{" "}
          · {nextUp.meta}
        </p>
      ) : null}
    </div>
  );
}

function StatsStrip({
  stats,
  solved,
  total,
  percent,
  signedIn,
}: {
  stats: TrackStat[];
  solved: number;
  total: number;
  percent: number;
  signedIn: boolean;
}) {
  return (
    <Card className="mt-6 overflow-hidden p-0">
      <dl className="grid grid-cols-2 gap-px bg-border md:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="bg-card px-4 py-4 sm:px-5">
              <dt className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                <Icon className="size-3.5 shrink-0" aria-hidden="true" />
                {stat.label}
              </dt>
              <dd className="mt-1.5 text-2xl font-semibold tabular-nums">
                {stat.value}
                <span className="mt-0.5 block text-xs font-normal leading-snug text-muted-foreground">
                  {stat.hint}
                </span>
              </dd>
            </div>
          );
        })}
      </dl>
      <div className="border-t border-border bg-muted/30 px-4 py-4 sm:px-5">
        <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          Curriculum progress
        </p>
        <LearningProgressBar
          className="mt-2"
          solved={solved}
          total={total}
          percent={percent}
          muted={!signedIn}
          label={`Curriculum progress: ${solved} of ${total} practice problems solved`}
        />
      </div>
    </Card>
  );
}

function SignInNote() {
  return (
    <div className="mt-4 flex flex-col gap-3 rounded-lg border border-dashed border-primary/30 bg-primary/5 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3">
        <span
          className="grid size-9 shrink-0 place-items-center rounded-md bg-primary/10 text-primary"
          aria-hidden="true"
        >
          <LogIn className="size-4" />
        </span>
        <p className="text-sm leading-relaxed text-muted-foreground">
          <span className="font-medium text-foreground">
            Progress is saved to your account.
          </span>{" "}
          Sign in to keep solved counts, checkpoint attempts and track badges.
        </p>
      </div>
      <Link
        href="/login?next=/learn"
        className={cn(buttonVariants({ size: "sm" }), "w-full sm:w-auto")}
      >
        Sign in
      </Link>
    </div>
  );
}

function StatusLegend() {
  return (
    <div
      role="group"
      aria-label="Track status legend"
      className="flex flex-wrap items-center gap-2"
    >
      <Badge variant="success">
        <span
          className="size-1.5 rounded-full bg-emerald-600 dark:bg-emerald-300"
          aria-hidden="true"
        />
        Live
      </Badge>
      <Badge variant="muted">
        <LockKeyhole className="size-3" aria-hidden="true" />
        Locked
      </Badge>
      <Badge variant="secondary">
        <Clock3 className="size-3" aria-hidden="true" />
        Planned
      </Badge>
      <Badge variant="warning">
        <Award className="size-3" aria-hidden="true" />
        Badge earned
      </Badge>
    </div>
  );
}

export default async function LearnPage() {
  const user = await getCurrentUser();
  const modules = (await getLearningOverview(user)).sort(
    (left, right) => left.order - right.order,
  );

  const liveTracks = modules.filter((module) => module.status === "LIVE");
  const totalTopics = modules.reduce(
    (sum, module) => sum + module.topicCount,
    0,
  );
  const totalProblems = modules.reduce(
    (sum, module) => sum + module.problemCount,
    0,
  );
  const solvedProblems = modules.reduce(
    (sum, module) => sum + module.progress.solved,
    0,
  );
  const badgesEarned = modules.filter((module) => module.badgeEarned).length;
  const percent =
    totalProblems > 0 ? Math.round((solvedProblems / totalProblems) * 100) : 0;
  const nextUp = pickNextUp(modules, Boolean(user));

  const stats: TrackStat[] = [
    {
      label: "Live tracks",
      value: liveTracks.length,
      hint:
        liveTracks.length === modules.length
          ? "All published"
          : `of ${modules.length} tracks`,
      icon: Route,
    },
    {
      label: "Topics",
      value: totalTopics,
      hint: "Concept notes in each",
      icon: Layers3,
    },
    {
      label: "Problems",
      value: totalProblems,
      hint: "Guided and tiered sets",
      icon: FileCode2,
    },
    {
      label: "Badges",
      value: badgesEarned,
      hint:
        badgesEarned > 0
          ? `of ${liveTracks.length} track badges`
          : "Earn with checkpoints",
      icon: Award,
    },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <section
        aria-labelledby="learn-hero-title"
        className="relative overflow-hidden rounded-xl border border-border bg-card"
      >
        <div
          className="grid-pattern pointer-events-none absolute inset-0 opacity-30 [mask-image:radial-gradient(ellipse_75%_65%_at_50%_0%,black,transparent)]"
          aria-hidden="true"
        />
        <div
          className="hero-glow pointer-events-none absolute inset-0"
          aria-hidden="true"
        />
        <div className="relative px-5 py-8 sm:px-8 sm:py-10 lg:px-10">
          <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">
            <Compass className="size-3.5" aria-hidden="true" />
            Curriculum
          </p>
          <h1
            id="learn-hero-title"
            className="mt-3 text-3xl font-semibold tracking-tight text-balance sm:text-4xl"
          >
            Learning tracks
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
            Seven tracks take you from your first loop to advanced algorithms
            — concept notes, guided practice and a timed checkpoint in each.
          </p>
          <p
            lang="bn"
            className="mt-2 max-w-2xl text-sm leading-[1.9] text-muted-foreground"
          >
            ধাপে ধাপে শিখুন — প্রতিটি টপিকে কনসেপ্ট নোট, গাইডেড সমস্যা আর
            চেকপয়েন্ট।
          </p>

          <HeroActions nextUp={nextUp} signedIn={Boolean(user)} />
        </div>
      </section>

      <StatsStrip
        stats={stats}
        solved={solvedProblems}
        total={totalProblems}
        percent={percent}
        signedIn={Boolean(user)}
      />

      {user ? null : <SignInNote />}

      <section aria-labelledby="learn-tracks-title" className="mt-12">
        <div className="flex flex-col gap-4 border-b border-border pb-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <p className="font-mono text-[10.5px] font-medium uppercase tracking-[0.2em] text-primary">
              Roadmap
            </p>
            <h2
              id="learn-tracks-title"
              className="mt-1 text-xl font-semibold tracking-tight sm:text-2xl"
            >
              All tracks
            </h2>
            <p className="mt-1 max-w-xl text-sm text-muted-foreground">
              Every track is self-contained. Start at track 01 or jump straight
              to what you need.
            </p>
          </div>
          <StatusLegend />
        </div>

        {modules.length === 0 ? (
          <Card className="mt-6 border-dashed p-6 text-sm text-muted-foreground">
            The curriculum is being prepared. Please check back shortly.
          </Card>
        ) : (
          <ol
            aria-label="Learning tracks"
            className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3"
          >
            {modules.map((module) => (
              <ModuleCard
                key={module.slug}
                module={module}
                signedIn={Boolean(user)}
              />
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}
