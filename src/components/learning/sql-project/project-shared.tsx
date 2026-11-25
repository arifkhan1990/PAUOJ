import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { LEARNING_ROUTE_SLUGS } from "@/lib/learning/route-slugs";
import type { SqlProjectTrack } from "@/lib/learning/sql-project";
import { cn } from "@/lib/utils";

const TRACK_LABELS: Record<SqlProjectTrack, string> = {
  "basic-sql": "Basic SQL",
  "advanced-sql": "Advanced SQL",
};

/** Resolves a SQL topic slug to its lesson URL without loading the curriculum. */
export function resolveTopicHref(topicSlug: string): string | null {
  for (const [moduleSlug, topics] of Object.entries(LEARNING_ROUTE_SLUGS)) {
    if (topics.includes(topicSlug)) {
      return `/learn/${moduleSlug}/${topicSlug}`;
    }
  }
  return null;
}

export function TrackBadge({ track }: { track: SqlProjectTrack }) {
  return <Badge variant="outline">{TRACK_LABELS[track]}</Badge>;
}

export function CheckList({
  items,
  lang,
  className,
}: {
  items: string[];
  lang?: string;
  className?: string;
}) {
  if (items.length === 0) return null;
  return (
    <ul
      role="list"
      lang={lang}
      className={cn(
        "space-y-2 text-xs leading-relaxed text-muted-foreground",
        className,
      )}
    >
      {items.map((item, index) => (
        <li key={`${index}-${item}`} className="flex min-w-0 gap-2">
          <CheckCircle2
            className="mt-0.5 size-3.5 shrink-0 text-primary/80"
            aria-hidden="true"
          />
          <span className="min-w-0">{item}</span>
        </li>
      ))}
    </ul>
  );
}

export function TableChips({
  tables,
  limit,
  className,
}: {
  tables: string[];
  limit?: number;
  className?: string;
}) {
  if (tables.length === 0) return null;
  const shown = typeof limit === "number" ? tables.slice(0, limit) : tables;
  const hidden = tables.length - shown.length;

  return (
    <ul className={cn("flex flex-wrap gap-1.5", className)}>
      {shown.map((table) => (
        <li key={table}>
          <span className="inline-flex items-center rounded-full border border-border bg-background/70 px-2 py-0.5 font-mono text-[10px] text-muted-foreground">
            {table}
          </span>
        </li>
      ))}
      {hidden > 0 ? (
        <li>
          <span className="inline-flex items-center rounded-full border border-border bg-muted/40 px-2 py-0.5 font-mono text-[10px] text-muted-foreground">
            +{hidden}
          </span>
        </li>
      ) : null}
    </ul>
  );
}

export function TopicLinkList({
  topicSlugs,
  label = "Linked topics",
  className,
}: {
  topicSlugs: string[];
  label?: string;
  className?: string;
}) {
  const links = topicSlugs
    .map((slug) => ({ slug, href: resolveTopicHref(slug) }))
    .filter(
      (link): link is { slug: string; href: string } => link.href !== null,
    );

  if (links.length === 0) return null;

  return (
    <div className={cn("min-w-0", className)}>
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </p>
      <ul className="mt-1.5 flex flex-wrap gap-1.5">
        {links.map((link) => (
          <li key={link.slug}>
            <Link
              href={link.href}
              className="inline-flex min-h-11 items-center rounded-full border border-border bg-background/70 px-2 py-1 font-mono text-[10px] text-muted-foreground underline-offset-4 transition-colors hover:border-primary/40 hover:text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background lg:min-h-8"
            >
              {link.slug}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function ProblemLinkList({
  problemSlugs,
  label = "Judge problems",
  className,
}: {
  problemSlugs: string[];
  label?: string;
  className?: string;
}) {
  if (problemSlugs.length === 0) return null;

  return (
    <div className={cn("min-w-0", className)}>
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </p>
      <ul className="mt-1.5 flex flex-wrap gap-1.5">
        {problemSlugs.map((slug) => (
          <li key={slug} className="min-w-0 max-w-full">
            <Link
              href={`/problems/${slug}`}
              className="inline-flex min-h-11 max-w-full items-center rounded-full border border-border bg-background/70 px-2 py-1 font-mono text-[10px] text-muted-foreground underline-offset-4 transition-colors hover:border-primary/40 hover:text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background lg:min-h-8"
            >
              <span className="break-all">{slug}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function ProjectEmpty({ children }: { children: string }) {
  return (
    <p className="mt-4 rounded-lg border border-dashed border-border bg-muted/20 px-4 py-6 text-sm leading-relaxed text-muted-foreground">
      {children}
    </p>
  );
}
