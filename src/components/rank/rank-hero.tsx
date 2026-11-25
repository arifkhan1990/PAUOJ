import type { ReactNode } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Filter,
  Rows3,
  UserRound,
  type LucideIcon,
} from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { Card } from "@/components/ui/card";

const iconBox =
  "grid size-9 shrink-0 place-items-center rounded-md bg-muted text-muted-foreground";

/** Compact summary of the viewer's place on the active board. */
export type RankStandingSummary = {
  rank: number;
  primary: string;
  secondary: string;
};

function StandingCard({
  viewer,
  standing,
  unratedHint,
  guestHint,
  signInHref,
}: {
  viewer: { username: string } | null;
  standing: RankStandingSummary | null;
  unratedHint: string;
  guestHint: string;
  signInHref: string;
}) {
  const value = !viewer ? "Sign in" : standing ? `#${standing.rank}` : "Unrated";
  const hint = !viewer ? guestHint : standing ? null : unratedHint;

  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Your standing
          </p>
          <p className="mt-1 text-2xl font-semibold tabular-nums">{value}</p>
          {hint ? (
            <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>
          ) : null}
          {standing ? (
            <p className="mt-0.5 truncate text-xs text-muted-foreground">
              {standing.primary} · {standing.secondary}
            </p>
          ) : null}
        </div>
        <span className={iconBox}>
          <UserRound className="size-4" aria-hidden="true" />
        </span>
      </div>
      <Link
        href={viewer ? `/users/${viewer.username}` : signInHref}
        className="mt-2 inline-flex min-h-11 items-center gap-1 text-xs font-medium text-primary underline-offset-4 hover:underline sm:min-h-0"
      >
        {viewer ? "View profile" : "Sign in to track your rank"}
        <ArrowRight className="size-3" aria-hidden="true" />
      </Link>
    </Card>
  );
}

/**
 * Shared leaderboard hero. Copy, actions, icon and standing metrics are passed
 * per board; layout, tabs placement and the stat rail stay identical.
 */
export function RankHero({
  eyebrow,
  title,
  description,
  actions,
  tabs,
  totalLabel,
  totalCoders,
  totalHint,
  totalIcon: TotalIcon,
  matchingCoders,
  filtered,
  page,
  totalPages,
  shownFrom,
  shownTo,
  viewer,
  standing,
  unratedHint,
  guestHint,
  signInHref,
}: {
  eyebrow: string;
  title: string;
  description: string;
  actions: ReactNode;
  tabs: ReactNode;
  totalLabel: string;
  totalCoders: number;
  totalHint: string;
  totalIcon: LucideIcon;
  matchingCoders: number;
  filtered: boolean;
  page: number;
  totalPages: number;
  shownFrom: number;
  shownTo: number;
  viewer: { username: string } | null;
  standing: RankStandingSummary | null;
  unratedHint: string;
  guestHint: string;
  signInHref: string;
}) {
  return (
    <section aria-label="Leaderboard overview">
      <PageHeader
        eyebrow={eyebrow}
        title={title}
        description={description}
        actions={actions}
      />

      {tabs}

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <StatCard
          label={totalLabel}
          value={totalCoders}
          hint={totalHint}
          icon={TotalIcon}
        />
        {filtered ? (
          <StatCard
            label="Matching coders"
            value={matchingCoders}
            hint={
              shownFrom > 0
                ? `Rows ${shownFrom}–${shownTo} · page ${page} of ${totalPages}`
                : `Page ${page} of ${totalPages}`
            }
            icon={Filter}
          />
        ) : (
          <StatCard
            label="On this page"
            value={shownFrom > 0 ? `${shownFrom}–${shownTo}` : "—"}
            hint={`Page ${page} of ${totalPages}`}
            icon={Rows3}
          />
        )}
        <StandingCard
          viewer={viewer}
          standing={standing}
          unratedHint={unratedHint}
          guestHint={guestHint}
          signInHref={signInHref}
        />
      </div>
    </section>
  );
}

/** Shared action sizing: full 44px target on phones, compact on desktop. */
export const rankActionClass = "h-11 md:h-10";
