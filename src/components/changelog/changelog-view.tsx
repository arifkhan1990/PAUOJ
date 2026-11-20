import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  ChevronRight,
  CircleDot,
  Plus,
  RefreshCw,
  ShieldCheck,
  Trash2,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import { ReleaseNav } from "@/components/changelog/release-nav";
import { ReferenceFooter } from "@/components/layout/reference-footer";
import type { ChangelogGroup, ChangelogRelease } from "@/lib/changelog";
import { cn } from "@/lib/utils";

const GROUP_STYLES: Record<string, { icon: LucideIcon; className: string }> = {
  added: {
    icon: Plus,
    className: "border-emerald-500/20 bg-emerald-500/10 text-emerald-300",
  },
  changed: {
    icon: RefreshCw,
    className: "border-sky-500/20 bg-sky-500/10 text-sky-300",
  },
  fixed: {
    icon: Wrench,
    className: "border-amber-500/20 bg-amber-500/10 text-amber-300",
  },
  security: {
    icon: ShieldCheck,
    className: "border-rose-500/20 bg-rose-500/10 text-rose-300",
  },
  removed: {
    icon: Trash2,
    className: "border-rose-500/20 bg-rose-500/10 text-rose-300",
  },
  deprecated: {
    icon: AlertTriangle,
    className: "border-amber-500/20 bg-amber-500/10 text-amber-300",
  },
  "known limitations": {
    icon: AlertTriangle,
    className: "border-amber-500/20 bg-amber-500/10 text-amber-300",
  },
};

const STATUS_STYLES = {
  next: "border-primary/25 bg-primary/10 text-primary",
  current: "border-emerald-500/20 bg-emerald-500/10 text-emerald-300",
  previous: "border-border bg-muted/40 text-muted-foreground",
} as const;

const STATUS_LABELS = {
  next: "Next",
  current: "Current",
  previous: "Previous",
} as const;

function groupStyle(title: string) {
  return (
    GROUP_STYLES[title.toLowerCase()] ?? {
      icon: CircleDot,
      className: "border-border bg-muted/40 text-muted-foreground",
    }
  );
}

function formatReleaseDate(date: string): string {
  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${date}T00:00:00Z`));
}

function InlineText({ text }: { text: string }) {
  return (
    <>
      {text.split(/(`[^`]+`)/g).map((part, index) =>
        part.startsWith("`") && part.endsWith("`") ? (
          <code
            key={`${part}-${index}`}
            className="rounded bg-muted px-1 py-0.5 font-mono text-[11px] text-foreground/85"
          >
            {part.slice(1, -1)}
          </code>
        ) : (
          <span key={`${part}-${index}`}>{part}</span>
        ),
      )}
    </>
  );
}

function ChangeGroup({ group }: { group: ChangelogGroup }) {
  const meta = groupStyle(group.title);
  const Icon = meta.icon;

  return (
    <div>
      <div className="flex items-center gap-2">
        <span
          className={cn(
            "flex h-6 w-6 shrink-0 items-center justify-center rounded-md border",
            meta.className,
          )}
        >
          <Icon className="h-3.5 w-3.5" aria-hidden="true" />
        </span>
        <h3 className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          {group.title}
        </h3>
        <span className="h-px flex-1 bg-border" />
        <span className="font-mono text-[8px] text-muted-foreground/60">
          {group.items.length}
        </span>
      </div>
      <ul className="mt-3 space-y-2">
        {group.items.map((item) => (
          <li
            key={item}
            className="flex gap-2.5 text-[13px] leading-relaxed text-muted-foreground"
          >
            <span
              className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-muted-foreground/40"
              aria-hidden="true"
            />
            <span>
              <InlineText text={item} />
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ReleaseCard({ release }: { release: ChangelogRelease }) {
  return (
    <article
      id={release.slug}
      className="scroll-mt-28 overflow-hidden rounded-xl border border-border bg-card"
    >
      <div className="border-b border-border bg-muted/20 px-5 py-5 sm:px-7">
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="font-mono text-sm font-semibold text-foreground">
            {release.displayVersion}
          </span>
          <span
            className={cn(
              "rounded-full border px-2 py-0.5 text-[8px] font-bold uppercase tracking-wider",
              STATUS_STYLES[release.status],
            )}
          >
            {STATUS_LABELS[release.status]}
          </span>
          <span className="h-3 w-px bg-border" aria-hidden="true" />
          {release.date ? (
            <time
              dateTime={release.date}
              className="text-[10px] text-muted-foreground"
            >
              {formatReleaseDate(release.date)}
            </time>
          ) : (
            <span className="text-[10px] text-muted-foreground">
              In development
            </span>
          )}
        </div>
        <h2 className="mt-3 text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
          {release.title}
        </h2>
        <p className="mt-2 max-w-3xl text-[13px] leading-relaxed text-muted-foreground">
          {release.summary}
        </p>
      </div>
      <div className="space-y-6 px-5 py-6 sm:px-7">
        {release.groups.map((group) => (
          <ChangeGroup key={`${release.slug}-${group.title}`} group={group} />
        ))}
      </div>
    </article>
  );
}

export function ChangelogView({
  releases,
  currentVersion,
}: {
  releases: ChangelogRelease[];
  currentVersion: string;
}) {
  const currentRelease = releases.find((release) => release.status === "current");
  const currentTitle = currentRelease?.title ?? "Release Notes";

  return (
    <div className="dark relative isolate flex h-full overflow-hidden bg-background text-foreground">
      <div
        className="grid-pattern pointer-events-none absolute inset-x-0 top-0 h-[560px] opacity-20 [mask-image:radial-gradient(ellipse_65%_55%_at_50%_0%,black,transparent)]"
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
        <aside className="reference-nav-scroll hidden w-[220px] shrink-0 overflow-y-auto border-r border-border px-4 py-8 lg:block">
          <ReleaseNav releases={releases} />
          <div className="mt-6 rounded-xl border border-border bg-card p-3.5">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Versioning
            </p>
            <p className="mt-1.5 text-[10px] leading-relaxed text-muted-foreground/70">
              Semantic versioning. The newest heading in{" "}
              <code className="rounded bg-muted px-1 py-0.5 font-mono text-[9px] text-foreground/80">
                CHANGELOG.md
              </code>{" "}
              is the source of truth; this page is generated from it.
            </p>
          </div>
        </aside>

        <div
          id="reference-scroll"
          role="region"
          aria-label="Changelog content"
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
                <span className="text-foreground/70">Changelog</span>
              </div>

              <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/[0.07] px-3 py-1.5 text-[10px] font-medium text-emerald-300">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75 motion-reduce:animate-none" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
                </span>
                Current release · v{currentVersion}
              </div>

              <h1 className="mt-5 text-balance text-4xl font-semibold leading-[1.05] tracking-[-0.035em] text-foreground sm:text-5xl">
                What&apos;s new in PAU OJ
              </h1>
              <p className="mt-4 max-w-2xl text-pretty text-sm leading-relaxed text-muted-foreground sm:text-base">
                Every platform release, in plain language. The current version
                is live across the product, and every release keeps its notes
                here permanently.
              </p>

              <div className="mt-6 flex flex-wrap items-center gap-3">
                <span className="inline-flex items-center gap-1.5 rounded-md border border-primary/20 bg-primary/[0.08] px-2 py-1 font-mono text-[9px] font-medium text-primary">
                  <span className="h-1 w-1 rounded-full bg-primary" />
                  v{currentVersion}
                  <span className="border-l border-primary/20 pl-1.5 font-sans text-[9px] font-normal text-muted-foreground">
                    {currentTitle}
                  </span>
                </span>
                <Link
                  href="/docs"
                  className="inline-flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground transition-colors hover:text-foreground"
                >
                  Read the user guide
                  <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                </Link>
              </div>

              <div className="mt-8 flex items-center gap-2 overflow-x-auto pb-1 lg:hidden">
                <span className="shrink-0 text-[9px] font-semibold uppercase tracking-[0.16em] text-muted-foreground/60">
                  Jump to
                </span>
                {releases.map((release) => (
                  <a
                    key={release.slug}
                    href={`#${release.slug}`}
                    className="shrink-0 rounded-full border border-border bg-card px-3 py-1.5 font-mono text-[9px] text-muted-foreground transition-colors hover:border-primary/30 hover:text-foreground"
                  >
                    {release.displayVersion}
                  </a>
                ))}
              </div>
            </div>

            <div className="mt-10 space-y-8">
              {releases.map((release) => (
                <ReleaseCard key={release.slug} release={release} />
              ))}
            </div>

            <ReferenceFooter />
          </div>
        </div>
      </div>
    </div>
  );
}
