import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  ClipboardCheck,
  LockKeyhole,
  ShieldCheck,
  Timer,
} from "lucide-react";
import { UserAvatar } from "@/components/shared/user-avatar";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const points = [
  {
    icon: LockKeyhole,
    title: "Private problem set",
    description:
      "Assessment problems stay out of the public list and cannot be opened directly while the test is live.",
  },
  {
    icon: Timer,
    title: "Per-candidate timer",
    description:
      "The clock starts on join and expires automatically, so every candidate gets the same window.",
  },
  {
    icon: ClipboardCheck,
    title: "Per-problem results",
    description:
      "Solved count, attempts, points and finish time are ready as soon as the assessment ends.",
  },
];

const candidates = [
  {
    name: "Ayesha Rahman",
    username: "ayesha",
    solved: "5/5",
    status: "Finished" as const,
  },
  {
    name: "Tanvir Hasan",
    username: "tanvir",
    solved: "4/5",
    status: "Active" as const,
  },
  {
    name: "Nusrat Jahan",
    username: "nusrat",
    solved: "3/5",
    status: "Active" as const,
  },
];

function AssessmentPreview() {
  return (
    <div className="relative">
      <div
        className="pointer-events-none absolute -inset-4 rounded-3xl bg-primary/10 blur-2xl"
        aria-hidden
      />
      <div className="relative overflow-hidden rounded-xl border border-border bg-card shadow-xl">
        <div className="flex items-center justify-between gap-3 border-b border-border bg-muted/40 px-5 py-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-primary">
              Assessment
            </p>
            <p className="mt-0.5 text-sm font-semibold">CSE 110 · Midterm</p>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-2.5 py-1 text-[10px] font-medium text-muted-foreground">
            <LockKeyhole className="size-3" />
            Private
          </span>
        </div>

        <div className="grid grid-cols-2 gap-px border-b border-border bg-border">
          <div className="bg-card px-5 py-4">
            <p className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
              Time remaining
            </p>
            <p className="mt-1 font-mono text-2xl font-semibold tabular-nums">
              42:18
            </p>
          </div>
          <div className="bg-card px-5 py-4">
            <p className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
              Progress
            </p>
            <p className="mt-1 font-mono text-2xl font-semibold tabular-nums">
              3<span className="text-sm text-muted-foreground"> / 5</span>
            </p>
          </div>
        </div>

        <div className="space-y-1 px-5 py-4">
          {candidates.map((candidate) => (
            <div
              key={candidate.username}
              className="flex items-center gap-3 rounded-lg px-2 py-2"
            >
              <UserAvatar
                name={candidate.name}
                username={candidate.username}
                size="sm"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{candidate.name}</p>
                <p className="truncate text-[11px] text-muted-foreground">
                  @{candidate.username} · {candidate.solved} solved
                </p>
              </div>
              <span
                className={cn(
                  "inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium",
                  candidate.status === "Finished"
                    ? "border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-200"
                    : "border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-100",
                )}
              >
                <span
                  className={cn(
                    "size-1.5 rounded-full",
                    candidate.status === "Finished"
                      ? "bg-emerald-500"
                      : "bg-amber-500 animate-pulse-soft",
                  )}
                />
                {candidate.status}
              </span>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-border bg-muted/30 px-5 py-3 text-xs">
          <span className="text-muted-foreground">Access code</span>
          <code className="rounded border border-border bg-background px-2 py-0.5 font-mono text-[11px]">
            PAU-7K2Q
          </code>
        </div>
      </div>

      <div className="absolute -bottom-10 left-5 hidden items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-xs shadow-lg animate-float sm:flex">
        <CheckCircle2 className="size-4 text-emerald-500" />
        Auto-graded results
      </div>
    </div>
  );
}

export function AssessmentSpotlight({ isAdmin }: { isAdmin: boolean }) {
  return (
    <section id="assessments" className="relative scroll-mt-20 overflow-hidden border-y border-border bg-card/40">
      <div
        className="pointer-events-none absolute inset-0 opacity-30 grid-pattern"
        aria-hidden
      />
      <div className="relative mx-auto grid max-w-7xl gap-12 px-4 py-16 sm:px-6 lg:grid-cols-[0.98fr_1.02fr] lg:items-center lg:px-8">
        <div>
          <p className="font-mono text-[10.5px] font-medium uppercase tracking-[0.2em] text-primary">
            For faculty &amp; clubs
          </p>
          <h2 className="mt-2 max-w-lg text-3xl font-semibold tracking-tight">
            A private exam room for your classroom.
          </h2>
          <p className="mt-3 max-w-lg text-sm leading-relaxed text-muted-foreground">
            Create a timed coding assessment in minutes. Share one access code;
            every candidate gets their own timer, private problems and an
            auto-graded result.
          </p>

          <ul className="mt-7 space-y-4">
            {points.map((point) => {
              const Icon = point.icon;
              return (
                <li key={point.title} className="flex gap-3">
                  <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-md border border-border bg-background text-primary">
                    <Icon className="size-4" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold">{point.title}</p>
                    <p className="mt-0.5 max-w-md text-xs leading-relaxed text-muted-foreground">
                      {point.description}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>

          <div className="mt-8 flex flex-wrap items-center gap-2.5">
            <Link
              href={isAdmin ? "/admin/assessments" : "/docs"}
              className={cn(buttonVariants(), "group")}
            >
              {isAdmin ? "Create an assessment" : "Read the assessment guide"}
              <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-0.5" />
            </Link>
            {!isAdmin ? (
              <Link
                href="/login"
                className={buttonVariants({ variant: "outline" })}
              >
                Sign in to join
              </Link>
            ) : null}
          </div>

          <p className="mt-4 inline-flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <ShieldCheck className="size-3.5" />
            Source is hidden from candidates during the test.
          </p>
        </div>

        <div className="reveal relative">
          <p className="sr-only">
            Preview of an assessment dashboard with a timer, candidate progress
            and an access code.
          </p>
          <div aria-hidden>
            <AssessmentPreview />
          </div>
        </div>
      </div>
    </section>
  );
}
