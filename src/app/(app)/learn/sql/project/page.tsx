import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Download } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { ProjectBoard } from "@/components/learning/sql-project/project-board";
import { ProjectBrief } from "@/components/learning/sql-project/project-brief";
import { ProjectHandover } from "@/components/learning/sql-project/project-handover";
import { ProjectMetrics } from "@/components/learning/sql-project/project-metrics";
import { ProjectSchema } from "@/components/learning/sql-project/project-schema";
import { buttonVariants } from "@/components/ui/button";
import { SQL_PROJECT } from "@/lib/learning/sql-project";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "ShopSphere industry project · SQL Labs",
  description:
    "The production brief behind the SQL Labs tracks: squads, work tickets, the full ShopSphere schema, metric definitions and the final handover review.",
};

const SECTIONS = [
  { href: "#brief", label: "Brief" },
  { href: "#board", label: "Feature board" },
  { href: "#schema", label: "Schema" },
  { href: "#metrics", label: "Metrics" },
  { href: "#handover", label: "Handover" },
];

export default function SqlProjectPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <PageHeader
        eyebrow="SQL Labs · Industry project"
        title={`${SQL_PROJECT.company}: ${SQL_PROJECT.tagline}`}
        description="Two SQL tracks, one production brief. Work the marketplace like a data-platform hire — tickets, schema, metrics and a handover review."
        actions={
          <>
            <Link
              href="/learn/sql"
              className={cn(
                buttonVariants({ variant: "outline" }),
                "min-h-11",
              )}
            >
              <ArrowLeft aria-hidden="true" />
              Back to SQL Labs
            </Link>
            <a
              href="/learning/shopsphere.sql"
              download
              className={cn(buttonVariants(), "min-h-11")}
            >
              <Download aria-hidden="true" />
              Download database
            </a>
          </>
        }
      />

      <dl className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {SQL_PROJECT.stats.map((stat) => (
          <div
            key={stat.label}
            className="min-w-0 rounded-lg border border-border bg-background/60 p-3"
          >
            <dt className="text-[10.5px] font-medium uppercase tracking-[0.1em] text-muted-foreground">
              {stat.label}
            </dt>
            <dd className="mt-1 break-words font-mono text-sm font-semibold tabular-nums text-foreground">
              {stat.value}
            </dd>
          </div>
        ))}
      </dl>

      <nav aria-label="Project sections" className="mt-4 flex flex-wrap gap-2">
        {SECTIONS.map((section) => (
          <a
            key={section.href}
            href={section.href}
            className="inline-flex min-h-11 items-center rounded-full border border-border bg-background/70 px-3 text-xs font-medium text-muted-foreground underline-offset-4 transition-colors hover:border-primary/40 hover:text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background lg:min-h-9"
          >
            {section.label}
          </a>
        ))}
      </nav>

      <ProjectBrief className="mt-10" />
      <ProjectBoard className="mt-10" />
      <ProjectSchema className="mt-10" />
      <ProjectMetrics className="mt-10" />
      <ProjectHandover className="mt-10" />
    </div>
  );
}
