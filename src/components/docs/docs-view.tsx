import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  CircleHelp,
  Sparkles,
} from "lucide-react";
import { DocsNav } from "@/components/docs/docs-nav";
import { ReferenceFooter } from "@/components/layout/reference-footer";
import { buttonVariants } from "@/components/ui/button";
import { APP_VERSION } from "@/lib/constants";
import {
  DOC_CATEGORIES,
  DOC_CHECKLIST,
  DOC_SECTIONS,
  type DocCategoryId,
  type DocSection,
} from "@/lib/docs-content";
import { cn } from "@/lib/utils";

const CATEGORY_STYLES: Record<DocCategoryId, string> = {
  start: "border-primary/20 bg-primary/10 text-primary",
  solve: "border-sky-500/20 bg-sky-500/10 text-sky-300",
  practice: "border-amber-500/20 bg-amber-500/10 text-amber-300",
  compete: "border-rose-500/20 bg-rose-500/10 text-rose-300",
  account: "border-emerald-500/20 bg-emerald-500/10 text-emerald-300",
};

const CATEGORY_DESCRIPTIONS: Record<DocCategoryId, string> = {
  start: "Create an account, open your dashboard and learn the layout.",
  solve: "Write, submit and debug solutions with the online judge.",
  practice: "Build a routine with study plans, ratings and community threads.",
  compete: "Join contests, follow the scoreboard and take assessments.",
  account: "Manage your profile, notifications and teaching workspace.",
};

function SectionCard({ section }: { section: DocSection }) {
  const Icon = section.icon;

  return (
    <article
      id={section.id}
      className="scroll-mt-28 overflow-hidden rounded-xl border border-border bg-card"
    >
      <div className="flex items-center gap-3 border-b border-border bg-muted/20 px-5 py-4 sm:px-6">
        <span
          className={cn(
            "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border",
            CATEGORY_STYLES[section.category],
          )}
        >
          <Icon className="size-4" aria-hidden="true" />
        </span>
        <h3 className="text-base font-semibold text-foreground">
          {section.title}
        </h3>
      </div>
      <div className="space-y-3 px-5 py-5 text-[13px] leading-relaxed text-muted-foreground sm:px-6">
        {section.body.map((paragraph) => (
          <p key={paragraph.slice(0, 40)}>{paragraph}</p>
        ))}
      </div>
    </article>
  );
}

export function DocsView() {
  return (
    <div className="dark relative isolate flex h-full overflow-hidden bg-background text-foreground">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[560px] grid-pattern opacity-20 [mask-image:radial-gradient(ellipse_65%_55%_at_50%_0%,black,transparent)]"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -left-40 top-0 h-[420px] w-[420px] rounded-full bg-primary/15 blur-[130px]"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -right-32 top-40 h-[320px] w-[320px] rounded-full bg-accent/10 blur-[120px]"
        aria-hidden="true"
      />

      <div className="relative mx-auto flex h-full w-full max-w-[1440px]">
        <aside className="reference-nav-scroll hidden w-[250px] shrink-0 overflow-y-auto border-r border-border px-4 py-8 lg:block">
          <DocsNav />
        </aside>

        <div
          id="reference-scroll"
          role="region"
          aria-label="User guide content"
          tabIndex={0}
          className="reference-scroll min-w-0 flex-1 overflow-y-auto overscroll-contain"
        >
          <div className="mx-auto max-w-4xl px-4 pb-10 pt-12 sm:px-6 lg:px-10 lg:pt-14">
            <div className="max-w-3xl">
              <div className="flex flex-wrap items-center gap-2 text-[10px] font-medium text-muted-foreground">
                <Link href="/" className="transition-colors hover:text-foreground">
                  Product
                </Link>
                <ChevronRight className="h-3 w-3" aria-hidden="true" />
                <span className="text-foreground/70">User guide</span>
              </div>

              <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/[0.07] px-3 py-1.5 text-[10px] font-medium text-primary">
                <Sparkles className="h-3 w-3" aria-hidden="true" />
                User guide · v{APP_VERSION}
              </div>

              <h1 className="mt-5 text-balance text-4xl font-semibold leading-[1.05] tracking-[-0.035em] text-foreground sm:text-5xl">
                Everything you need to use PAU OJ
              </h1>
              <p className="mt-4 max-w-2xl text-pretty text-sm leading-relaxed text-muted-foreground sm:text-base">
                Pick a problem, read a verdict, join a contest or run a private
                assessment. This guide keeps the whole workflow in one place.
              </p>

              <div className="mt-6 flex flex-wrap items-center gap-3">
                <Link href="/problems" className={buttonVariants()}>
                  Start solving
                  <ArrowRight className="size-4" aria-hidden="true" />
                </Link>
                <Link
                  href="/changelog"
                  className={buttonVariants({ variant: "outline" })}
                >
                  Release notes
                </Link>
              </div>

              <div className="mt-8 flex items-center gap-2 overflow-x-auto pb-1 lg:hidden">
                <span className="shrink-0 text-[9px] font-semibold uppercase tracking-[0.16em] text-muted-foreground/60">
                  Jump to
                </span>
                {DOC_CATEGORIES.map((category) => {
                  const Icon = category.icon;
                  return (
                    <a
                      key={category.id}
                      href={`#${category.id}`}
                      className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-[9px] font-medium text-muted-foreground transition-colors hover:border-primary/30 hover:text-foreground"
                    >
                      <Icon className="h-3 w-3" aria-hidden="true" />
                      {category.label}
                    </a>
                  );
                })}
              </div>
            </div>

            <div className="mt-10 space-y-10">
              {DOC_CATEGORIES.map((category) => {
                const Icon = category.icon;
                const sections = DOC_SECTIONS.filter(
                  (section) => section.category === category.id,
                );
                if (sections.length === 0) return null;
                return (
                  <section key={category.id} id={category.id} className="scroll-mt-8">
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          "flex h-6 w-6 items-center justify-center rounded-md border",
                          CATEGORY_STYLES[category.id],
                        )}
                      >
                        <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                      </span>
                      <h2 className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                        {category.label}
                      </h2>
                      <span className="h-px flex-1 bg-border" />
                      <span className="font-mono text-[8px] text-muted-foreground/60">
                        {sections.length}
                      </span>
                    </div>
                    <p className="mt-2 text-[11px] text-muted-foreground/70">
                      {CATEGORY_DESCRIPTIONS[category.id]}
                    </p>
                    <div className="mt-4 space-y-4">
                      {sections.map((section) => (
                        <SectionCard key={section.id} section={section} />
                      ))}
                    </div>
                  </section>
                );
              })}

              <section
                id="checklist"
                className="scroll-mt-8 overflow-hidden rounded-xl border border-border bg-card"
              >
                <div className="flex items-center gap-3 border-b border-border bg-muted/20 px-5 py-4 sm:px-6">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-emerald-500/20 bg-emerald-500/10 text-emerald-300">
                    <CheckCircle2 className="size-4" aria-hidden="true" />
                  </span>
                  <h2 className="text-base font-semibold text-foreground">
                    Quick checklist before submitting
                  </h2>
                </div>
                <ul className="space-y-2.5 px-5 py-5 sm:px-6">
                  {DOC_CHECKLIST.map((item) => (
                    <li
                      key={item}
                      className="flex gap-2.5 text-[13px] leading-relaxed text-muted-foreground"
                    >
                      <CheckCircle2
                        className="mt-0.5 size-4 shrink-0 text-emerald-400"
                        aria-hidden="true"
                      />
                      {item}
                    </li>
                  ))}
                </ul>
              </section>

              <section className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border bg-card p-5">
                <div className="flex items-start gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border bg-muted text-muted-foreground">
                    <CircleHelp className="size-4" aria-hidden="true" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      Still stuck?
                    </p>
                    <p className="mt-1 text-[13px] text-muted-foreground">
                      Check the problem samples, try a custom test, or ask a
                      problem setter.
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Link
                    href="/problems"
                    className={buttonVariants({ variant: "outline" })}
                  >
                    Browse problems
                  </Link>
                  <Link href="/changelog" className={buttonVariants()}>
                    <BookOpen className="size-4" aria-hidden="true" />
                    What&apos;s new
                  </Link>
                </div>
              </section>
            </div>

            <ReferenceFooter />
          </div>
        </div>
      </div>
    </div>
  );
}
