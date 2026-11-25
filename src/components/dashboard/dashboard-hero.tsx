import Link from "next/link";
import {
  ArrowRight,
  Building2,
  CalendarDays,
  Check,
  Code2,
  Gem,
  MapPin,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { DailyChallengeCalendar } from "@/components/dashboard/daily-challenge-calendar";
import { BadgeArt } from "@/components/profile/achievement-badges";
import { UserAvatar } from "@/components/shared/user-avatar";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { ProfileStats } from "@/lib/profile-types";
import type { DailyChallengeWeek } from "@/server/services/daily-challenge-week";
import {
  getNextRatingTier,
  getRatingTier,
  RATING_TIERS,
} from "@/lib/rating-tiers";
import { cn, formatDate } from "@/lib/utils";

export function DashboardHero({
  profile,
  dailyWeek,
  prevHref,
  nextHref,
}: {
  profile: ProfileStats;
  dailyWeek: DailyChallengeWeek;
  prevHref: string | null;
  nextHref: string | null;
}) {
  const { user } = profile;
  const rated = profile.contestCount > 0;
  const tier = getRatingTier(user.rating, rated);
  const nextTier = rated ? getNextRatingTier(user.rating) : null;
  const lastContest = profile.ratingHistory.at(-1) ?? null;
  const nextProblem = profile.unsolvedProblems[0];
  const lockedMilestones = profile.achievements.filter(
    (achievement) => !achievement.earned && achievement.target > 0,
  );
  const milestone =
    lockedMilestones
      .filter((achievement) => !achievement.id.startsWith("rated-"))
      .sort(
        (left, right) =>
          right.value / right.target - left.value / left.target,
      )[0] ?? lockedMilestones[0];
  const earnedAchievements = profile.achievements.filter(
    (achievement) => achievement.earned,
  );
  const currentBadge = earnedAchievements.at(-1) ?? null;
  const currentTierIndex = RATING_TIERS.findIndex(
    (marker) => marker.key === tier.key,
  );
  const pointsToNext = nextTier ? Math.max(0, nextTier.min - user.rating) : 0;
  const remaining = milestone
    ? Math.max(0, milestone.target - milestone.value)
    : 0;

  return (
    <Card className="relative overflow-hidden rounded-xl shadow-sm">
      <div
        className="pointer-events-none absolute -right-20 -top-24 size-64 rounded-full bg-primary/[0.07] blur-3xl"
        aria-hidden="true"
      />
      <div className="relative flex flex-col gap-5 p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex min-w-0 items-start gap-4">
            <UserAvatar
              name={user.displayName}
              username={user.username}
              size="xl"
              className="size-16 text-xl font-bold ring-0"
              avatarPreset={user.avatarPreset}
              avatarImageAt={user.avatarImageUpdatedAt}
            />
            <div className="min-w-0 pt-0.5">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Welcome back
              </p>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight">
                  {user.displayName}
                </h1>
                <span
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-medium",
                    rated
                      ? tier.badgeClassName
                      : "border-border bg-muted/40 text-muted-foreground",
                  )}
                  title={
                    rated
                      ? `${tier.label} tier`
                      : "Finish a rated contest to enter the rating ladder"
                  }
                >
                  <span
                    className={cn(
                      "size-1.5 rounded-full",
                      rated ? tier.barClassName : "bg-muted-foreground/50",
                    )}
                  />
                  <Gem className="size-3 opacity-70" aria-hidden="true" />
                  {tier.label}
                </span>
                {lastContest ? (
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 font-mono text-[11px] font-medium tabular-nums",
                      lastContest.delta >= 0
                        ? "border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                        : "border-rose-300 bg-rose-50 text-rose-700 dark:border-rose-800 dark:bg-rose-950 dark:text-rose-300",
                    )}
                    title="Change in your most recent rated contest"
                  >
                    {lastContest.delta >= 0 ? (
                      <TrendingUp className="size-3" aria-hidden="true" />
                    ) : (
                      <TrendingDown className="size-3" aria-hidden="true" />
                    )}
                    {lastContest.delta >= 0 ? "+" : ""}
                    {lastContest.delta}
                  </span>
                ) : null}
              </div>
              <p className="mt-0.5 font-mono text-[13px] text-muted-foreground">
                @{user.username}
              </p>
              <div className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                  <CalendarDays className="size-3.5" aria-hidden="true" />
                  Joined {formatDate(user.createdAt)}
                </span>
                {user.institution ? (
                  <span className="inline-flex items-center gap-1.5">
                    <Building2 className="size-3.5" aria-hidden="true" />
                    {user.institution}
                  </span>
                ) : null}
                {user.country ? (
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin className="size-3.5" aria-hidden="true" />
                    {user.country}
                  </span>
                ) : null}
              </div>
            </div>
          </div>

          <div className="order-last flex w-full justify-center xl:order-none xl:w-auto xl:min-w-0 xl:flex-1 xl:self-center xl:px-2">
            <DailyChallengeCalendar
              week={dailyWeek}
              prevHref={prevHref}
              nextHref={nextHref}
            />
          </div>

          <div className="flex shrink-0 flex-wrap gap-2">
            {nextProblem ? (
              <Link
                href={`/problems/${nextProblem.slug}`}
                className={buttonVariants({ variant: "outline", size: "sm" })}
              >
                <ArrowRight className="size-3.5" aria-hidden="true" />
                Continue practice
              </Link>
            ) : null}
            <Link
              href="/problems"
              className={buttonVariants({ size: "sm" })}
            >
              <Code2 className="size-3.5" aria-hidden="true" />
              Browse problems
            </Link>
          </div>
        </div>

        <div className="grid gap-5 border-t border-border pt-4 md:grid-cols-2 md:gap-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                Rating ladder
              </p>
              {rated ? (
                <span className="text-[10px] font-medium text-muted-foreground">
                  {nextTier
                    ? `${pointsToNext} pts to next`
                    : "Top tier reached"}
                </span>
              ) : null}
            </div>
            {rated ? (
              <div className="relative mt-3">
                <span
                  className="absolute left-[8.333%] right-[8.333%] top-1.5 h-px bg-border"
                  aria-hidden="true"
                />
                <div className="relative flex">
                  {RATING_TIERS.map((marker, index) => {
                    const isCurrent = marker.key === tier.key;
                    const isNext = nextTier?.key === marker.key;
                    const isPast = index < currentTierIndex;
                    return (
                      <div
                        key={marker.key}
                        className="flex min-w-0 flex-1 flex-col items-center"
                      >
                        <span className="relative z-10 grid size-3 place-items-center">
                          {isCurrent ? (
                            <>
                              <span
                                className={cn(
                                  "absolute -inset-1 rounded-full bg-current opacity-15",
                                  tier.textClassName,
                                )}
                                aria-hidden="true"
                              />
                              <span
                                className={cn(
                                  "size-2.5 rounded-full",
                                  tier.barClassName,
                                )}
                              />
                            </>
                          ) : isNext ? (
                            <span className="size-2.5 rounded-full border border-dashed border-muted-foreground/60 bg-card" />
                          ) : (
                            <span
                              className={cn(
                                "size-2 rounded-full",
                                isPast
                                  ? "bg-muted-foreground/40"
                                  : "border border-border bg-card",
                              )}
                            />
                          )}
                        </span>
                        <span
                          className={cn(
                            "mt-1.5 w-full truncate text-center text-[8px] leading-none sm:text-[9px]",
                            isCurrent
                              ? "font-semibold text-foreground"
                              : isNext
                                ? "font-medium text-muted-foreground"
                                : "text-muted-foreground/60",
                          )}
                        >
                          {marker.label}
                        </span>
                        <span
                          className={cn(
                            "mt-1 h-3.5 font-mono text-[10px] leading-none tabular-nums",
                            isCurrent
                              ? "font-semibold text-foreground"
                              : "text-muted-foreground/70",
                          )}
                        >
                          {isCurrent
                            ? user.rating
                            : isNext && nextTier
                              ? nextTier.min
                              : ""}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="mt-2 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-dashed border-border bg-muted/30 px-3 py-2">
                <p className="text-[11px] text-muted-foreground">
                  Finish a rated contest to enter the rating ladder.
                </p>
                <Link
                  href="/contests"
                  className="text-[11px] font-medium text-primary hover:underline"
                >
                  Find a contest
                </Link>
              </div>
            )}
          </div>

          <div className="min-w-0 md:border-l md:border-border md:pl-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                Badges
              </p>
              <span className="font-mono text-[11px] text-muted-foreground tabular-nums">
                {earnedAchievements.length}/{profile.achievements.length}
              </span>
            </div>

            {currentBadge || milestone ? (
              <div className="mt-2.5 flex min-w-0 items-center gap-2.5">
                {currentBadge ? (
                  <div className="flex min-w-0 flex-1 items-center gap-2">
                    <BadgeArt achievement={currentBadge} size="sm" />
                    <div className="min-w-0">
                      <p className="truncate text-[12px] font-medium">
                        {currentBadge.label}
                      </p>
                      <p className="mt-0.5 flex items-center gap-1 text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
                        <Check className="size-3" aria-hidden="true" />
                        Earned
                      </p>
                    </div>
                  </div>
                ) : null}

                {currentBadge && milestone ? (
                  <ArrowRight
                    className="size-3.5 shrink-0 text-muted-foreground/40"
                    aria-hidden="true"
                  />
                ) : null}

                {milestone ? (
                  <div className="flex min-w-0 flex-1 items-center gap-2">
                    <BadgeArt achievement={milestone} size="sm" />
                    <div className="min-w-0">
                      <p className="truncate text-[12px] font-medium text-muted-foreground">
                        {milestone.label}
                      </p>
                      <p className="mt-0.5 font-mono text-[10px] text-muted-foreground tabular-nums">
                        {Math.min(milestone.value, milestone.target)}/
                        {milestone.target}
                      </p>
                    </div>
                  </div>
                ) : null}
              </div>
            ) : null}

            {milestone ? (
              <div className="mt-2 flex items-center justify-between gap-3 text-[11px] text-muted-foreground">
                <span className="truncate">
                  <span className="font-medium text-foreground">
                    {remaining} to go
                  </span>
                  <span aria-hidden="true"> · </span>
                  {milestone.description}
                </span>
                <Link
                  href={`/users/${user.username}`}
                  className="shrink-0 font-medium text-primary hover:underline"
                >
                  View all
                </Link>
              </div>
            ) : (
              <p className="mt-2 text-[11px] text-muted-foreground">
                Every milestone is unlocked. Keep the streak alive.
              </p>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
