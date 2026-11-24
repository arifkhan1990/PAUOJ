import {
  CalendarDays,
  ListChecks,
  ScrollText,
  ShieldCheck,
  Trophy,
  UsersRound,
  type LucideIcon,
} from "lucide-react";
import { Markdown } from "@/components/shared/markdown";
import { Card } from "@/components/ui/card";
import { contestTeamSizeLabel } from "./contest-format-badge";
import {
  MONTHLY_ELIGIBILITY,
  MONTHLY_PRIZES,
  MONTHLY_RULES,
  NO_PRIZE_ANNOUNCEMENT,
  STANDARD_CONTEST_POLICY,
  STANDARD_ELIGIBILITY,
} from "@/lib/contest-content";
import {
  CONTEST_DIVISION_LABEL,
  contestDurationMs,
} from "@/lib/contests";
import {
  CONTEST_FORMAT_DESCRIPTION,
  CONTEST_FORMAT_LABEL,
} from "@/lib/contest-ops";
import type { ContestDetail } from "@/lib/types";
import { formatDhakaDateTime, formatDuration } from "@/lib/utils";

function hasText(value: string | null | undefined): value is string {
  return Boolean(value && value.trim());
}

function SectionHeading({
  id,
  icon: Icon,
  children,
}: {
  id: string;
  icon: LucideIcon;
  children: string;
}) {
  return (
    <h2
      id={id}
      className="flex items-center gap-2 text-xl font-semibold tracking-tight"
    >
      <Icon className="size-5 text-primary" aria-hidden="true" />
      {children}
    </h2>
  );
}

function DetailTile({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="min-w-0 rounded-lg border border-border bg-muted/25 p-3.5">
      <dt className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
        <Icon className="size-3.5" aria-hidden="true" />
        {label}
      </dt>
      <dd className="mt-1.5 break-words text-sm font-medium">{value}</dd>
      {hint ? (
        <dd className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
          {hint}
        </dd>
      ) : null}
    </div>
  );
}

export function ContestDetailContent({ contest }: { contest: ContestDetail }) {
  const format = contest.format ?? "SINGLE";
  const isGroup = format === "GROUP";
  const monthly = Boolean(contest.seriesId);
  const eligibility = hasText(contest.eligibility)
    ? contest.eligibility
    : monthly
      ? MONTHLY_ELIGIBILITY
      : STANDARD_ELIGIBILITY;
  const organizerEligibility = hasText(contest.eligibility);
  const prizes = hasText(contest.prizes)
    ? contest.prizes
    : monthly
      ? MONTHLY_PRIZES
      : null;
  const rules = hasText(contest.rules)
    ? contest.rules
    : monthly
      ? MONTHLY_RULES
      : null;

  return (
    <div className="min-w-0 space-y-10">
      <section aria-labelledby="contest-about">
        <SectionHeading id="contest-about" icon={ListChecks}>
          About this contest
        </SectionHeading>
        <Markdown className="mt-3 max-w-3xl">{contest.description}</Markdown>
      </section>

      <section aria-labelledby="contest-format">
        <SectionHeading id="contest-format" icon={ShieldCheck}>
          Format &amp; eligibility
        </SectionHeading>
        <dl className="mt-4 grid gap-3 sm:grid-cols-2">
          <DetailTile
            icon={UsersRound}
            label="Format"
            value={CONTEST_FORMAT_LABEL[format]}
            hint={CONTEST_FORMAT_DESCRIPTION[format]}
          />
          <DetailTile
            icon={UsersRound}
            label="Team size"
            value={
              isGroup
                ? contestTeamSizeLabel(contest.teamSize)
                : "Solo — one coder"
            }
            hint={isGroup ? "One ranking per team." : "Individual ICPC ranking."}
          />
          <DetailTile
            icon={Trophy}
            label="Division"
            value={CONTEST_DIVISION_LABEL[contest.division]}
            hint={
              contest.isOfficial
                ? isGroup
                  ? "Official PAU OJ team round (unrated)"
                  : "Official PAU OJ rated round"
                : "Community round"
            }
          />
          <DetailTile
            icon={CalendarDays}
            label="Schedule"
            value={formatDhakaDateTime(contest.startAt)}
            hint={`Until ${formatDhakaDateTime(contest.endAt)} · ${formatDuration(
              contestDurationMs(contest.startAt, contest.endAt),
            )}`}
          />
        </dl>

        <div className="mt-4 rounded-lg border border-border bg-card p-4">
          <h3 className="flex flex-wrap items-center gap-2 text-sm font-semibold">
            <ShieldCheck className="size-4 text-primary" aria-hidden="true" />
            Eligibility
            <span className="rounded border border-border bg-muted px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
              {organizerEligibility ? "Organiser-specific" : "Standard"}
            </span>
          </h3>
          {organizerEligibility ? (
            <Markdown className="mt-2 text-sm">{eligibility}</Markdown>
          ) : (
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {eligibility}
            </p>
          )}
        </div>
      </section>

      <section aria-labelledby="contest-scoring">
        <SectionHeading id="contest-scoring" icon={Trophy}>
          Scoring
        </SectionHeading>
        <ul className="mt-3 max-w-3xl space-y-2 text-sm leading-relaxed text-muted-foreground">
          <li>ICPC-style scoring: most problems solved wins.</li>
          <li>
            Each rejected attempt before acceptance adds 20 penalty minutes.
          </li>
          <li>Compilation errors do not add a penalty.</li>
          <li>
            Source code stays hidden from other users while the contest runs.
          </li>
          <li>
            {isGroup
              ? "Team rounds are unrated for individual rating; virtual replay is solo-only."
              : "Only registered participants can submit contest problems."}
          </li>
        </ul>
      </section>

      <section aria-labelledby="contest-rules">
        <SectionHeading id="contest-rules" icon={ScrollText}>
          Rules &amp; policy
        </SectionHeading>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground">
          Organiser rules apply first; the standard platform policy applies to
          every PAU OJ contest.
        </p>

        {rules ? (
          <div className="mt-4 rounded-lg border border-primary/25 bg-primary/5 p-4">
            <h3 className="flex flex-wrap items-center gap-2 text-sm font-semibold">
              <ScrollText className="size-4 text-primary" aria-hidden="true" />
              Organiser-specific rules
            </h3>
            <Markdown className="mt-2 text-sm">{rules}</Markdown>
          </div>
        ) : null}

        <div className="mt-4 rounded-lg border border-border bg-card p-4">
          <h3 className="text-sm font-semibold">Standard platform policy</h3>
          <ol className="mt-2 list-decimal space-y-2 pl-5 text-sm leading-relaxed text-muted-foreground">
            {STANDARD_CONTEST_POLICY.map((rule) => (
              <li key={rule}>{rule}</li>
            ))}
          </ol>
        </div>
      </section>

      <section aria-labelledby="contest-prizes">
        <SectionHeading id="contest-prizes" icon={Trophy}>
          Prizes &amp; recognition
        </SectionHeading>
        {prizes ? (
          <div className="mt-3 rounded-lg border border-amber-300/70 bg-amber-50/50 p-4 dark:border-amber-800/70 dark:bg-amber-950/20">
            <Markdown>{prizes}</Markdown>
          </div>
        ) : (
          <Card className="mt-3 flex flex-col items-start gap-2 border-dashed p-4">
            <span className="grid size-10 place-items-center rounded-full bg-muted text-muted-foreground">
              <Trophy className="size-5" aria-hidden="true" />
            </span>
            <p className="text-sm font-semibold">No prizes announced yet</p>
            <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
              {NO_PRIZE_ANNOUNCEMENT}
            </p>
          </Card>
        )}
      </section>
    </div>
  );
}
