import type { ReactNode } from "react";
import Link from "next/link";
import {
  Check,
  CheckCircle2,
  Code2,
  ListChecks,
  ShieldCheck,
  Terminal,
  X,
} from "lucide-react";
import { SectionHeading } from "@/components/shared/section-heading";
import { VerdictBadge } from "@/components/shared/verdict-badge";
import { LANGUAGES } from "@/lib/languages";
import { cn } from "@/lib/utils";

function Panel({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <article
      className={cn(
        "reveal relative overflow-hidden rounded-xl border border-border bg-card p-6",
        className,
      )}
    >
      {children}
    </article>
  );
}

function TerminalRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-white/5 pb-1.5 last:border-0 last:pb-0">
      <span className="text-slate-500">{label}</span>
      <span className="text-slate-200">{value}</span>
    </div>
  );
}

function SandboxCard() {
  return (
    <Panel className="md:col-span-4">
      <div className="grid gap-6 sm:grid-cols-2 sm:items-center">
        <div>
          <span className="grid size-9 place-items-center rounded-md border border-border bg-background text-primary">
            <ShieldCheck className="size-[18px]" />
          </span>
          <h3 className="mt-4 text-base font-semibold">Locked down by default</h3>
          <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
            No network, a read-only root and hard CPU, memory and process caps.
            Untrusted code never touches the host or the tests.
          </p>
          <Link
            href="/docs"
            className="mt-4 inline-flex text-sm font-medium text-primary underline-offset-4 hover:underline"
          >
            Read the security model
          </Link>
        </div>
        <div className="rounded-lg border border-emerald-900/40 bg-[#0b1411] p-4 font-mono text-[11px] text-slate-300">
          <p className="flex items-center gap-1.5 text-slate-500">
            <Terminal className="size-3" /> judge run a-plus-b.cpp
          </p>
          <div className="mt-3 space-y-1.5">
            <TerminalRow label="network" value="off" />
            <TerminalRow label="rootfs" value="read-only" />
            <TerminalRow label="cpus" value="1.0" />
            <TerminalRow label="memory" value="256 MB" />
            <TerminalRow label="time limit" value="2.0 s" />
          </div>
          <p className="mt-3 flex items-center gap-1.5 text-emerald-300">
            <CheckCircle2 className="size-3.5" /> exit 0 · 12 ms · 4.8 MB
          </p>
        </div>
      </div>
    </Panel>
  );
}

function LanguagesCard() {
  return (
    <Panel className="md:col-span-2">
      <span className="grid size-9 place-items-center rounded-md border border-border bg-background text-primary">
        <Code2 className="size-[18px]" />
      </span>
      <h3 className="mt-4 text-base font-semibold">Five real toolchains</h3>
      <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
        The same compilers and runtimes the judge uses in production.
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        {LANGUAGES.map((language) => (
          <span
            key={language.id}
            className="inline-flex items-baseline gap-1.5 rounded-md border border-border bg-muted/40 px-2.5 py-1.5"
          >
            <span className="text-xs font-medium">{language.shortLabel}</span>
            <span className="font-mono text-[10px] text-muted-foreground">
              {language.compiler}
            </span>
          </span>
        ))}
      </div>
    </Panel>
  );
}

function VerdictsCard() {
  const verdicts = [
    { status: "ACCEPTED", text: "all tests passed" },
    { status: "WRONG_ANSWER", text: "output mismatch" },
    { status: "TIME_LIMIT_EXCEEDED", text: "limit enforced" },
  ];

  return (
    <Panel className="md:col-span-2">
      <span className="grid size-9 place-items-center rounded-md border border-border bg-background text-primary">
        <CheckCircle2 className="size-[18px]" />
      </span>
      <h3 className="mt-4 text-base font-semibold">Verdicts you can act on</h3>
      <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
        A short label and a plain-English reason for every outcome.
      </p>
      <ul className="mt-4 space-y-2">
        {verdicts.map((verdict) => (
          <li key={verdict.status} className="flex items-center gap-2.5">
            <VerdictBadge status={verdict.status} short />
            <span className="text-xs text-muted-foreground">
              {verdict.text}
            </span>
          </li>
        ))}
      </ul>
    </Panel>
  );
}

function ResultsCard() {
  return (
    <Panel className="md:col-span-4">
      <div className="grid gap-6 sm:grid-cols-[1.1fr_0.9fr] sm:items-center">
        <div>
          <span className="grid size-9 place-items-center rounded-md border border-border bg-background text-primary">
            <ListChecks className="size-[18px]" />
          </span>
          <h3 className="mt-4 text-base font-semibold">
            Per-test detail, not just a number
          </h3>
          <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
            See the exact test, runtime and memory behind every failure, then
            fix the part that actually broke.
          </p>
        </div>
        <div className="rounded-lg border border-border bg-muted/30 p-3">
          <div className="grid grid-cols-5 gap-1.5">
            {Array.from({ length: 10 }, (_, index) => {
              const failed = index === 3;
              return (
                <span
                  key={index}
                  className={cn(
                    "flex h-9 flex-col items-center justify-center rounded-md border font-mono text-[10px]",
                    failed
                      ? "border-rose-300 bg-rose-50 text-rose-700 dark:border-rose-800 dark:bg-rose-950/50 dark:text-rose-300"
                      : "border-emerald-300/70 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300",
                  )}
                  title={failed ? `Test ${index + 1} failed` : `Test ${index + 1} passed`}
                >
                  {failed ? <X className="size-3" /> : <Check className="size-3" />}
                  {index + 1}
                </span>
              );
            })}
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[10px] text-muted-foreground">
            <span className="text-emerald-600 dark:text-emerald-400">
              9/10 passed
            </span>
            <span>12 ms</span>
            <span>4.8 MB</span>
            <span className="ml-auto">test 4</span>
          </div>
        </div>
      </div>
    </Panel>
  );
}

export function FeatureBento() {
  return (
    <section id="features" className="mx-auto max-w-7xl scroll-mt-20 px-4 py-16 sm:px-6 lg:px-8">
      <SectionHeading
        eyebrow="Under the hood"
        title="A judge built like production"
        description="Real compilers, isolated runs and verdicts that tell you what to fix next."
        href="/docs"
        linkLabel="How judging works"
        size="lg"
      />
      <div className="mt-6 grid gap-4 md:grid-cols-6">
        <SandboxCard />
        <LanguagesCard />
        <VerdictsCard />
        <ResultsCard />
      </div>
    </section>
  );
}
