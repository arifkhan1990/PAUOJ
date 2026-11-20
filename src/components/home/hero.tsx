import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  Clock3,
  Code2,
  Cpu,
  ShieldCheck,
  Sparkles,
  Trophy,
  Users,
  Zap,
} from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import type { SiteStats } from "@/lib/types";
import { cn } from "@/lib/utils";

function CodePreview() {
  return (
    <div className="relative">
      <div
        className="pointer-events-none absolute -inset-5 rounded-3xl bg-primary/10 blur-2xl"
        aria-hidden
      />
      <div className="relative overflow-hidden rounded-xl border border-emerald-900/40 bg-[#0b1411] shadow-2xl shadow-emerald-950/20">
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
          <div className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-full bg-rose-500/80" />
            <span className="size-2.5 rounded-full bg-amber-400/80" />
            <span className="size-2.5 rounded-full bg-emerald-500/80" />
          </div>
          <span className="font-mono text-[11px] text-slate-400">
            solution.cpp
          </span>
          <span className="inline-flex items-center gap-1 rounded border border-emerald-800/60 bg-emerald-950/60 px-1.5 py-0.5 font-mono text-[10px] text-emerald-300">
            C++20
          </span>
        </div>
        <div className="flex">
          <div
            className="w-10 shrink-0 border-r border-white/5 bg-white/[0.02] py-5 pr-3 text-right font-mono text-[11px] leading-6 text-slate-600"
            aria-hidden
          >
            {Array.from({ length: 9 }, (_, index) => (
              <div key={index}>{index + 1}</div>
            ))}
          </div>
          <pre className="flex-1 overflow-x-auto px-4 py-5 font-mono text-[12.5px] leading-6 text-slate-300">
            <code>
              <span className="text-slate-500">#include</span>{" "}
              <span className="text-emerald-300">&lt;bits/stdc++.h&gt;</span>
              {"\n"}
              <span className="text-sky-300">using</span>{" "}
              <span className="text-sky-300">namespace</span> std;
              {"\n\n"}
              <span className="text-sky-300">int</span>{" "}
              <span className="text-amber-300">main</span>() {"{\n"}
              {"    "}
              <span className="text-sky-300">long long</span> a, b;{"\n"}
              {"    "}cin &gt;&gt; a &gt;&gt; b;{"\n"}
              {"    "}cout &lt;&lt; a + b &lt;&lt;{" "}
              <span className="text-emerald-300">&apos;\n&apos;</span>;{"\n"}
              {"    "}
              <span className="text-sky-300">return</span>{" "}
              <span className="text-orange-300">0</span>;{"\n"}
              {"}"}
            </code>
          </pre>
        </div>
        <div className="border-t border-white/10 bg-white/[0.03] px-4 py-3">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs">
            <span className="inline-flex items-center gap-1.5 font-medium text-emerald-300">
              <CheckCircle2 className="size-4" /> Accepted
            </span>
            <span className="font-mono text-slate-400">9/9 tests</span>
            <span className="inline-flex items-center gap-1 font-mono text-slate-400">
              <Cpu className="size-3.5" /> 12 ms
            </span>
            <span className="font-mono text-slate-400">4.8 MB</span>
            <span className="ml-auto inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-slate-500">
              <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse-soft" />
              streamed live
            </span>
          </div>
        </div>
      </div>

      <div className="absolute -right-3 top-24 hidden items-center gap-2 rounded-lg border border-border bg-card/95 px-3 py-2 shadow-lg backdrop-blur animate-float sm:flex">
        <span className="grid size-7 place-items-center rounded-full bg-primary/10 text-primary">
          <ShieldCheck className="size-3.5" />
        </span>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            Sandbox
          </p>
          <p className="font-mono text-xs font-semibold">network: off</p>
        </div>
      </div>

      <div className="absolute -bottom-14 left-4 hidden items-center gap-2 rounded-lg border border-border bg-card/95 px-3 py-2 shadow-lg backdrop-blur animate-float-slow lg:flex">
        <span className="grid size-7 place-items-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
          <Zap className="size-3.5" />
        </span>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            Verdict
          </p>
          <p className="font-mono text-xs font-semibold text-emerald-600 dark:text-emerald-400">
            ACCEPTED
          </p>
        </div>
      </div>
    </div>
  );
}

export function Hero({
  stats,
  isAuthenticated,
}: {
  stats: SiteStats;
  isAuthenticated: boolean;
}) {
  const acceptance =
    stats.submissionCount > 0
      ? Math.round((stats.acceptedCount / stats.submissionCount) * 100)
      : 0;

  const statItems = [
    {
      key: "problemCount" as const,
      label: "Problems",
      hint: "and growing",
      icon: Sparkles,
    },
    {
      key: "submissionCount" as const,
      label: "Submissions",
      hint: "judged end to end",
      icon: Code2,
    },
    {
      key: "acceptedCount" as const,
      label: "Accepted",
      hint: `${acceptance}% acceptance`,
      icon: CheckCircle2,
    },
    {
      key: "userCount" as const,
      label: "Coders",
      hint: "on the platform",
      icon: Users,
    },
  ];

  return (
    <section className="relative overflow-hidden border-b border-border">
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <div className="grid-pattern absolute inset-0 opacity-40" />
        <div className="hero-glow absolute inset-0" />
        <div className="absolute -right-32 -top-40 size-[28rem] rounded-full bg-primary/10 blur-3xl animate-float-slow" />
        <div className="absolute -left-24 bottom-0 size-72 rounded-full bg-accent/5 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 pb-10 pt-16 sm:px-6 lg:px-8 lg:pt-20">
        <div className="grid items-center gap-14 lg:grid-cols-[1.04fr_0.96fr]">
          <div>
            <span className="animate-enter inline-flex items-center gap-2 rounded-full border border-border bg-card/80 px-3 py-1 text-xs font-medium text-muted-foreground shadow-xs backdrop-blur">
              <span className="relative flex size-2">
                <span className="absolute inline-flex size-full rounded-full bg-primary animate-pulse-soft" />
                <span className="relative inline-flex size-2 rounded-full bg-primary" />
              </span>
              PrimeAsia University · Online Judge
            </span>

            <h1
              className="animate-enter mt-6 max-w-xl text-balance text-4xl font-semibold tracking-tight sm:text-5xl lg:text-[3.5rem] lg:leading-[1.04]"
              style={{ animationDelay: "70ms" }}
            >
              Write code.
              <br />
              Get judged.
              <br />
              <span className="text-primary">Get better.</span>
            </h1>

            <p
              className="animate-enter mt-5 max-w-lg text-base leading-relaxed text-muted-foreground"
              style={{ animationDelay: "130ms" }}
            >
              Solve real problems in five languages, get sandboxed verdicts in
              seconds, and climb live ICPC standings. No setup — just open the
              editor.
            </p>

            <div
              className="animate-enter mt-7 flex flex-wrap items-center gap-3"
              style={{ animationDelay: "190ms" }}
            >
              <Link
                href="/problems"
                className={cn(buttonVariants({ size: "lg" }), "group")}
              >
                Start solving{" "}
                <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-0.5" />
              </Link>
              <Link
                href="/contests"
                className={buttonVariants({ variant: "outline", size: "lg" })}
              >
                Explore contests
              </Link>
            </div>

            <p
              className="animate-enter mt-4 text-xs text-muted-foreground"
              style={{ animationDelay: "240ms" }}
            >
              {isAuthenticated
                ? "Welcome back — your drafts, submissions and contests are waiting."
                : "Free for PrimeAsia students. One account for practice, contests and assessments."}
            </p>

            <ul
              className="animate-enter mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-muted-foreground"
              style={{ animationDelay: "280ms" }}
            >
              <li className="inline-flex items-center gap-1.5">
                <ShieldCheck className="size-3.5 text-primary" /> Isolated
                sandbox
              </li>
              <li className="inline-flex items-center gap-1.5">
                <Clock3 className="size-3.5 text-primary" /> Per-test limits
              </li>
              <li className="inline-flex items-center gap-1.5">
                <Trophy className="size-3.5 text-primary" /> ICPC scoring
              </li>
            </ul>
          </div>

          <div
            className="animate-enter relative"
            style={{ animationDelay: "160ms" }}
          >
            <CodePreview />
          </div>
        </div>

        <dl
          className="animate-enter mt-20 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-border bg-border shadow-xs sm:grid-cols-4"
          style={{ animationDelay: "320ms" }}
        >
          {statItems.map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.key} className="bg-card/80 p-5 backdrop-blur">
                <dt className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                  <Icon className="size-3.5 text-primary" />
                  {stat.label}
                </dt>
                <dd className="mt-2 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                  <span className="text-2xl font-semibold tabular-nums">
                    {stats[stat.key].toLocaleString("en-US")}
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    {stat.hint}
                  </span>
                </dd>
              </div>
            );
          })}
        </dl>
      </div>
    </section>
  );
}
