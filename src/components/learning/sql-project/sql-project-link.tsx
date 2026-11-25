import Link from "next/link";
import {
  ArrowRight,
  ClipboardCheck,
  Database,
  type LucideIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { SQL_PROJECT } from "@/lib/learning/sql-project";
import { cn } from "@/lib/utils";

const TRACK_LABELS: Record<string, string> = {
  "basic-sql": "Basic SQL",
  "advanced-sql": "Advanced SQL",
};

const VARIANTS: Record<
  "default" | "handover",
  { href: string; title: string; description: string; icon: LucideIcon }
> = {
  default: {
    href: "/learn/sql/project",
    title: "ShopSphere industry project",
    description:
      "A production brief behind both SQL tracks: squads, work tickets, the production schema, metrics and the final handover.",
    icon: Database,
  },
  handover: {
    href: "/learn/sql/project#handover",
    title: "Final handover",
    description:
      "Close the project the way a data team does: checklist, metric proofs, and the staff engineer's review questions.",
    icon: ClipboardCheck,
  },
};

/**
 * Reusable entry point to the ShopSphere industry-project dossier. Used on the
 * SQL landing page, course overview and track page; the link target is static.
 */
export function SqlProjectLink({
  moduleSlug,
  className,
  variant = "default",
}: {
  moduleSlug?: string;
  className?: string;
  variant?: "default" | "handover";
}) {
  const config = VARIANTS[variant];
  const Icon = config.icon;
  const track = moduleSlug ? TRACK_LABELS[moduleSlug] : undefined;
  const stats = SQL_PROJECT.stats;

  return (
    <Link
      href={config.href}
      className={cn(
        "group flex min-h-11 min-w-0 flex-col gap-3 rounded-xl border border-primary/25 bg-primary/[0.04] px-4 py-3.5 transition-colors hover:border-primary/45 hover:bg-primary/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:flex-row sm:items-start",
        className,
      )}
    >
      <span
        className="grid size-10 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary"
        aria-hidden="true"
      >
        <Icon className="size-5" />
      </span>

      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-semibold">{config.title}</span>
          {track ? (
            <Badge variant="outline" className="text-[10px]">
              {track}
            </Badge>
          ) : null}
        </span>
        <span className="mt-0.5 block text-xs leading-relaxed text-muted-foreground">
          {config.description}
        </span>
        {stats.length > 0 ? (
          <span className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 font-mono text-[10px] text-muted-foreground">
            {stats.map((stat, index) => (
              <span key={stat.label}>
                {stat.value} {stat.label.toLowerCase()}
                {index < stats.length - 1 ? " ·" : ""}
              </span>
            ))}
          </span>
        ) : null}
      </span>

      <ArrowRight
        className="hidden size-4 shrink-0 text-primary transition-transform duration-200 group-hover:translate-x-0.5 sm:mt-1 sm:block"
        aria-hidden="true"
      />
    </Link>
  );
}
