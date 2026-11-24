import Link from "next/link";
import { ArrowRight, Building2, Trophy } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import type { ContestListStatusFilter } from "@/lib/contests";
import { cn } from "@/lib/utils";

function Stat({
  label,
  value,
  hint,
  live = false,
}: {
  label: string;
  value: string;
  hint?: string;
  live?: boolean;
}) {
  return (
    <div className="bg-card px-5 py-3.5 sm:px-6">
      <dt className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
        {live ? (
          <span
            aria-hidden="true"
            className="size-1.5 rounded-full bg-emerald-500 motion-safe:animate-pulse motion-reduce:animate-none"
          />
        ) : null}
        {label}
      </dt>
      <dd className="mt-1 flex min-w-0 flex-wrap items-baseline gap-x-2">
        <span className="font-mono text-xl font-semibold tabular-nums">
          {value}
        </span>
        {hint ? (
          <span className="text-[11px] text-muted-foreground">{hint}</span>
        ) : null}
      </dd>
    </div>
  );
}

export function ContestHubHero({
  counts,
  className,
}: {
  counts: Record<ContestListStatusFilter, number>;
  className?: string;
}) {
  return (
    <section
      aria-labelledby="contests-heading"
      className={cn(
        "relative overflow-hidden rounded-xl border border-border bg-card shadow-xs",
        className,
      )}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-40 [background-image:linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] [background-size:32px_32px] [mask-image:linear-gradient(to_bottom,black,transparent_80%)]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-20 -top-24 size-64 rounded-full bg-primary/10 blur-3xl"
      />

      <div className="relative px-5 py-6 sm:px-8 sm:py-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0 max-w-2xl">
            <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">
              <Trophy className="size-3.5" aria-hidden="true" />
              Competitive programming
            </p>
            <h1
              id="contests-heading"
              className="mt-2 text-balance text-3xl font-semibold tracking-tight sm:text-4xl"
            >
              Contests
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">
              Live rounds, upcoming starts and past results in one place.
              ICPC scoring, Asia/Dhaka schedule, solo or team.
            </p>
          </div>

          <div className="flex shrink-0 flex-wrap items-center gap-x-4 gap-y-2">
            <Link
              href="/contests/host"
              className={cn(buttonVariants({ size: "lg" }), "h-11")}
            >
              <Building2 className="size-4" aria-hidden="true" />
              Host a contest
            </Link>
            <Link
              href="/rank"
              className="group inline-flex min-h-11 items-center gap-1.5 rounded-sm text-sm font-semibold text-foreground/80 transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card"
            >
              <Trophy className="size-4" aria-hidden="true" />
              Leaderboard
              <ArrowRight
                className="size-4 transition-transform motion-safe:group-hover:translate-x-0.5"
                aria-hidden="true"
              />
            </Link>
          </div>
        </div>
      </div>

      <dl className="relative grid grid-cols-2 gap-px border-t border-border bg-border sm:grid-cols-4">
        <Stat
          label="Live now"
          value={String(counts.RUNNING)}
          hint={counts.RUNNING === 1 ? "round" : "rounds"}
          live={counts.RUNNING > 0}
        />
        <Stat
          label="Upcoming"
          value={String(counts.UPCOMING)}
          hint="scheduled"
        />
        <Stat
          label="Past rounds"
          value={String(counts.ENDED)}
          hint="archived"
        />
        <Stat label="Official series" value="3rd Sunday" hint="10:00 Dhaka" />
      </dl>
    </section>
  );
}
