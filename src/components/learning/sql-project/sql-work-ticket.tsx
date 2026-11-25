import Link from "next/link";
import { ArrowRight, ClipboardList, Table2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  getSqlProjectEpic,
  getSqlProjectTicket,
} from "@/lib/learning/sql-project";
import { cn } from "@/lib/utils";
import { CheckList, TableChips } from "./project-shared";

/**
 * The work ticket attached to a SQL lesson. The ticket is the industry framing
 * of the topic, so it sits between the topic summary and the lesson body.
 * Renders nothing until the parallel project data defines a ticket.
 */
export function SqlWorkTicket({
  topicSlug,
  moduleSlug,
  className,
}: {
  topicSlug: string;
  moduleSlug: string;
  className?: string;
}) {
  const ticket = getSqlProjectTicket(topicSlug);
  if (!ticket || ticket.moduleSlug !== moduleSlug) return null;

  const epic = getSqlProjectEpic(ticket.epicSlug);
  const headingId = `work-ticket-${topicSlug}`;
  const dossierHref = epic
    ? `/learn/sql/project#epic-${epic.slug}`
    : "/learn/sql/project#board";

  return (
    <aside
      aria-labelledby={headingId}
      className={cn("min-w-0", className)}
    >
      <Card className="overflow-hidden">
        <div className="flex flex-wrap items-center gap-2 border-b border-border bg-muted/30 px-4 py-2.5">
          <span className="inline-flex items-center gap-1.5 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-primary">
            <ClipboardList className="size-3.5" aria-hidden="true" />
            Work ticket
          </span>
          <span className="rounded border border-border bg-background px-1.5 py-0.5 font-mono text-[10px] font-medium">
            {ticket.id}
          </span>
          <Badge variant="muted">{ticket.role}</Badge>
        </div>

        <div className="min-w-0 p-4 sm:p-5">
          <h2
            id={headingId}
            className="break-words text-sm font-semibold leading-snug sm:text-base"
          >
            {ticket.title}
          </h2>
          <p lang="bn" className="mt-0.5 text-xs text-muted-foreground">
            {ticket.titleBn}
          </p>
          {epic ? (
            <p className="mt-1.5 text-[11px] leading-relaxed text-muted-foreground">
              <span className="font-mono text-foreground">
                {epic.ticketPrefix}
              </span>{" "}
              · {epic.title} · {epic.squad}
            </p>
          ) : null}

          <p
            lang="bn"
            className="mt-3 text-xs leading-relaxed text-muted-foreground sm:text-[13px]"
          >
            {ticket.brief}
          </p>

          <div className="mt-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Acceptance
            </p>
            <CheckList
              items={ticket.acceptance}
              lang="bn"
              className="mt-1.5"
            />
          </div>

          {ticket.tables.length > 0 ? (
            <div className="mt-3">
              <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                <Table2 className="size-3" aria-hidden="true" />
                Tables in this ticket
              </p>
              <TableChips tables={ticket.tables} className="mt-1.5" />
            </div>
          ) : null}

          <div className="mt-4 border-t border-border pt-1">
            <Link
              href={dossierHref}
              className="inline-flex min-h-11 items-center gap-1.5 text-xs font-medium text-primary underline-offset-4 transition-colors hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              Open the full dossier
              <ArrowRight className="size-3.5" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </Card>
    </aside>
  );
}
