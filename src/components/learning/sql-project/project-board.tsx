import Link from "next/link";
import { ChevronRight, Ticket } from "lucide-react";
import { SectionHeading } from "@/components/shared/section-heading";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  SQL_PROJECT_EPICS,
  SQL_PROJECT_TICKETS,
  getSqlProjectTicketsForEpic,
} from "@/lib/learning/sql-project";
import { getCurriculumTopicSequence } from "@/lib/learning/sequence";
import { cn } from "@/lib/utils";
import {
  CheckList,
  ProjectEmpty,
  TableChips,
  TopicLinkList,
  TrackBadge,
} from "./project-shared";

const UNKNOWN_POSITION = Number.MAX_SAFE_INTEGER;

/** Curriculum order for every lesson, keyed `${moduleSlug}/${topicSlug}`. */
const CURRICULUM_POSITIONS = new Map(
  getCurriculumTopicSequence().map((entry) => [
    `${entry.moduleSlug}/${entry.topicSlug}`,
    entry.position,
  ]),
);

function curriculumPosition(ticket: {
  moduleSlug: string;
  topicSlug: string;
}): number {
  return (
    CURRICULUM_POSITIONS.get(`${ticket.moduleSlug}/${ticket.topicSlug}`) ??
    UNKNOWN_POSITION
  );
}

/** Tickets in lesson order (never ticket-id order); unknown topics last. */
const ORDERED_TICKETS = Object.values(SQL_PROJECT_TICKETS).sort(
  (a, b) =>
    curriculumPosition(a) - curriculumPosition(b) ||
    a.id.localeCompare(b.id),
);

export function ProjectBoard({ className }: { className?: string }) {
  return (
    <section id="board" className={cn("scroll-mt-24", className)}>
      <SectionHeading
        title="Feature board"
        description="Every squad in the marketplace. Each epic groups the lesson topics that ship its scope."
      />

      {SQL_PROJECT_EPICS.length === 0 ? (
        <ProjectEmpty>
          The feature board is being finalised. It will list every ShopSphere
          squad with its mission, tables and linked lessons.
        </ProjectEmpty>
      ) : (
        <ul role="list" className="mt-4 grid min-w-0 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {SQL_PROJECT_EPICS.map((epic) => {
            const ticketCount = getSqlProjectTicketsForEpic(epic.slug).length;

            return (
              <li key={epic.slug} className="min-w-0">
                <Card
                  id={`epic-${epic.slug}`}
                  className="flex h-full min-w-0 scroll-mt-24 flex-col p-4 sm:p-5"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded border border-border bg-muted/40 px-1.5 py-0.5 font-mono text-[10px] font-semibold tracking-wide">
                      {epic.ticketPrefix}
                    </span>
                    <Badge variant="outline">{epic.squad}</Badge>
                  </div>

                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {epic.tracks.map((track) => (
                      <TrackBadge key={track} track={track} />
                    ))}
                  </div>

                  <h3 className="mt-2 break-words text-sm font-semibold leading-snug">
                    {epic.title}
                  </h3>
                  <p lang="bn" className="break-words text-xs text-muted-foreground">
                    {epic.titleBn}
                  </p>

                  <p
                    lang="bn"
                    className="mt-2 break-words text-xs leading-relaxed text-muted-foreground"
                  >
                    {epic.mission}
                  </p>
                  {epic.story && epic.story !== epic.mission ? (
                    <p
                      lang="bn"
                      className="mt-1.5 break-words text-[11px] leading-relaxed text-muted-foreground"
                    >
                      {epic.story}
                    </p>
                  ) : null}

                  <TableChips tables={epic.tables} className="mt-3" />
                  <TopicLinkList
                    topicSlugs={epic.topicSlugs}
                    className="mt-3"
                  />

                  <div className="mt-3 flex items-center gap-1.5 border-t border-border pt-2.5 text-[11px] text-muted-foreground">
                    <Ticket className="size-3.5 shrink-0" aria-hidden="true" />
                    {ticketCount}{" "}
                    {ticketCount === 1 ? "work ticket" : "work tickets"}
                  </div>

                  {epic.acceptance.length > 0 ? (
                    <details className="group mt-1">
                      <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-2 rounded-sm py-1 text-[11px] font-medium text-muted-foreground underline-offset-4 transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background lg:min-h-9 [&::-webkit-details-marker]:hidden">
                        <span>Acceptance · {epic.acceptance.length} checks</span>
                        <ChevronRight
                          className="size-3.5 shrink-0 transition-transform duration-200 group-open:rotate-90"
                          aria-hidden="true"
                        />
                      </summary>
                      <CheckList
                        items={epic.acceptance}
                        lang="bn"
                        className="mt-1.5"
                      />
                    </details>
                  ) : null}
                </Card>
              </li>
            );
          })}
        </ul>
      )}

      {ORDERED_TICKETS.length > 0 ? (
        <details className="group mt-4 overflow-hidden rounded-xl border border-border bg-card shadow-xs">
          <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 transition-colors hover:bg-muted/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background [&::-webkit-details-marker]:hidden">
            <span className="min-w-0">
              <span className="block text-sm font-semibold">
                All {ORDERED_TICKETS.length} work tickets
              </span>
              <span className="mt-0.5 block text-xs leading-relaxed text-muted-foreground">
                The full delivery board: ticket id, owner role, track and the
                lesson that proves it.
              </span>
            </span>
            <ChevronRight
              className="size-4 shrink-0 text-muted-foreground transition-transform duration-200 group-open:rotate-90"
              aria-hidden="true"
            />
          </summary>
          <ul className="divide-y divide-border border-t border-border">
            {ORDERED_TICKETS.map((ticket, index) => (
              <li
                key={ticket.id}
                className="flex min-w-0 flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className="font-mono text-[10px] tabular-nums text-muted-foreground"
                      aria-hidden="true"
                    >
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span className="rounded border border-border bg-muted/40 px-1.5 py-0.5 font-mono text-[10px] font-medium">
                      {ticket.id}
                    </span>
                    <TrackBadge track={ticket.moduleSlug} />
                    <span className="text-[11px] text-muted-foreground">
                      {ticket.role}
                    </span>
                  </div>
                  <p className="mt-1 break-words text-[13px] font-medium leading-snug">
                    {ticket.title}
                  </p>
                  <p
                    lang="bn"
                    className="text-[11px] leading-relaxed text-muted-foreground"
                  >
                    {ticket.titleBn}
                  </p>
                </div>
                <Link
                  href={`/learn/${ticket.moduleSlug}/${ticket.topicSlug}`}
                  className="inline-flex min-h-11 shrink-0 items-center gap-1 text-xs font-medium text-primary underline-offset-4 transition-colors hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                >
                  Open lesson
                  <ChevronRight className="size-3.5" aria-hidden="true" />
                </Link>
              </li>
            ))}
          </ul>
        </details>
      ) : null}
    </section>
  );
}
