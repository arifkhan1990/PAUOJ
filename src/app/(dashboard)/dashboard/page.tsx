import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  CheckCircle2,
  Code2,
  Flame,
  Medal,
  Sparkles,
  Target,
  Trophy,
} from "lucide-react";
import { ActivityHeatmap } from "@/components/profile/activity-heatmap";
import { RatingChart } from "@/components/profile/rating-chart";
import { SolveSpectrum } from "@/components/profile/solve-spectrum";
import { ContestHistory } from "@/components/dashboard/contest-history";
import { ContinuePracticeCard } from "@/components/dashboard/continue-practice-card";
import { DailyChallengeCard } from "@/components/dashboard/daily-challenge-card";
import { DashboardHero } from "@/components/dashboard/dashboard-hero";
import { DashboardMetric } from "@/components/dashboard/dashboard-metric";
import { DashboardPanel } from "@/components/dashboard/dashboard-panel";
import { TopicMastery } from "@/components/dashboard/topic-mastery";
import { UpcomingContestsCard } from "@/components/dashboard/upcoming-contests-card";
import { EmptyState } from "@/components/shared/empty-state";
import { SubmissionTable } from "@/components/submissions/submission-table";
import { buttonVariants } from "@/components/ui/button";
import { requireUser } from "@/server/auth/guards";
import { getDailyChallenge } from "@/server/services/daily-challenge";
import { getDailyChallengeWeek } from "@/server/services/daily-challenge-week";
import { listContests } from "@/server/services/contests";
import { getProfile } from "@/server/services/profile";
import { addUtcDays, parseWeekAnchor, startOfUtcWeek, utcDayKey } from "@/lib/week";
import { formatPercent } from "@/lib/utils";
import type { SearchParams } from "@/lib/pagination";

export const metadata: Metadata = {
  title: "Coder dashboard",
};

export const dynamic = "force-dynamic";

export default async function CoderDashboardPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const user = await requireUser("/dashboard");
  const params = await searchParams;
  const now = new Date();
  const currentWeek = startOfUtcWeek(now);
  const joinWeek = startOfUtcWeek(user.createdAt);
  const anchor = parseWeekAnchor(params.week, currentWeek, joinWeek);

  const [profile, daily, contestPage, dailyWeek] = await Promise.all([
    getProfile(user.username, user),
    getDailyChallenge(user.id, user.role === "ADMIN"),
    listContests({
      page: { page: 1, pageSize: 4 },
      filter: "UPCOMING",
      userId: user.id,
    }),
    getDailyChallengeWeek({
      userId: user.id,
      isAdmin: user.role === "ADMIN",
      anchor,
      now,
      joinedAt: user.createdAt,
    }),
  ]);
  if (!profile) notFound();

  const prevHref =
    anchor.getTime() > joinWeek.getTime()
      ? `/dashboard?week=${utcDayKey(addUtcDays(anchor, -7))}`
      : null;
  const nextHref =
    anchor.getTime() < currentWeek.getTime()
      ? `/dashboard?week=${utcDayKey(addUtcDays(anchor, 7))}`
      : null;

  return (
    <div className="space-y-5">
      <DashboardHero
        profile={profile}
        dailyWeek={dailyWeek}
        prevHref={prevHref}
        nextHref={nextHref}
      />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <DashboardMetric
          label="Rating rank"
          value={profile.ratingRank ? `#${profile.ratingRank}` : "—"}
          hint={
            profile.ratingRank
              ? `of ${profile.ratedUserCount.toLocaleString("en-US")} rated`
              : "Finish a rated contest"
          }
          icon={Trophy}
          tone="warning"
          href="/rank"
        />
        <DashboardMetric
          label="Global rank"
          value={profile.rank ? `#${profile.rank}` : "—"}
          hint="Points leaderboard"
          icon={Medal}
          tone="neutral"
          href="/rank"
        />
        <DashboardMetric
          label="Solved"
          value={profile.solvedCount}
          hint={`${profile.attemptedCount} attempted`}
          icon={CheckCircle2}
          tone="success"
          href={`/users/${profile.user.username}`}
        />
        <DashboardMetric
          label="Acceptance"
          value={formatPercent(profile.acceptanceRate)}
          hint={`${profile.acceptedCount.toLocaleString("en-US")} accepted`}
          icon={Target}
          tone="primary"
        />
        <DashboardMetric
          label="Streak"
          value={`${profile.currentStreak}d`}
          hint={`Longest ${profile.longestStreak} days`}
          icon={Flame}
          tone="danger"
        />
        <DashboardMetric
          label="Points"
          value={profile.points.toLocaleString("en-US")}
          hint={`${profile.activeDays} active days`}
          icon={Sparkles}
          tone="primary"
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.75fr)_minmax(0,1fr)]">
        <RatingChart
          history={profile.ratingHistory}
          currentRating={profile.user.rating}
          ratingRank={profile.ratingRank}
          ratedUserCount={profile.ratedUserCount}
          ratingDistribution={profile.ratingDistribution}
        />

        <div className="flex flex-col gap-4">
          <div id="daily" className="scroll-mt-20">
            <DailyChallengeCard challenge={daily} />
          </div>
          <div>
            <UpcomingContestsCard contests={contestPage.items.slice(0, 2)} />
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <TopicMastery tags={profile.tagStats} />
        <SolveSpectrum
          className="rounded-lg"
          solved={profile.difficultySolved}
          totals={profile.difficultyTotals}
          attemptedCount={profile.attemptedCount}
          solvedCount={profile.solvedCount}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
        <ContinuePracticeCard problems={profile.unsolvedProblems} />
        <ContestHistory history={profile.ratingHistory} />
      </div>

      <ActivityHeatmap
        days={profile.heatmap}
        activeDays={profile.activeDays}
        currentStreak={profile.currentStreak}
        longestStreak={profile.longestStreak}
      />

      <DashboardPanel
        title="Recent submissions"
        description="Your latest verdicts and runtime."
        icon={<Code2 className="size-4" />}
        action={
          <Link
            href="/submissions?mine=true"
            className="text-[11px] font-medium text-primary hover:underline"
          >
            View all
          </Link>
        }
        bodyClassName="p-1"
      >
        {profile.recentSubmissions.length === 0 ? (
          <EmptyState
            className="border-0"
            title="No submissions yet"
            description="Solve a problem to start building your dashboard."
            icon={Code2}
            action={
              <Link href="/problems" className={buttonVariants()}>
                Find a problem
              </Link>
            }
          />
        ) : (
          <SubmissionTable items={profile.recentSubmissions} showUser={false} />
        )}
      </DashboardPanel>
    </div>
  );
}
