import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { UserRound } from "lucide-react";
import { ActivityHeatmap } from "@/components/profile/activity-heatmap";
import { AchievementBadges } from "@/components/profile/achievement-badges";
import { LanguageAnalytics } from "@/components/profile/language-analytics";
import { LearningBadges } from "@/components/profile/learning-badges";
import { ProfileEditorials } from "@/components/profile/profile-editorials";
import { ProfileHero } from "@/components/profile/profile-hero";
import { ProfileProblems } from "@/components/profile/profile-problems";
import { ProfileStatGrid } from "@/components/profile/profile-stat-grid";
import { RatingChart } from "@/components/profile/rating-chart";
import { SolveSpectrum } from "@/components/profile/solve-spectrum";
import { SubmissionAnalytics } from "@/components/profile/submission-analytics";
import { EmptyState } from "@/components/shared/empty-state";
import { SubmissionTable } from "@/components/submissions/submission-table";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { APP_NAME } from "@/lib/constants";
import { getCurrentUser } from "@/server/auth/session";
import { getProfile } from "@/server/services/profile";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>;
}): Promise<Metadata> {
  const { username } = await params;
  const normalized = username.toLowerCase();
  const canonical = `/users/${normalized}`;
  const title = `@${normalized}`;
  const description = `View @${normalized}'s rating, solved problems, contest history and achievements on PAU OJ.`;
  const image = {
    url: "/brand/og.png",
    width: 1200,
    height: 630,
    alt: `${title} on PAU OJ`,
  };
  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      type: "profile",
      siteName: APP_NAME,
      url: canonical,
      title,
      description,
      images: [image],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image.url],
    },
  };
}

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const viewer = await getCurrentUser();
  const profile = await getProfile(username, viewer);
  if (!profile) notFound();

  const { user } = profile;

  return (
    <div className="relative isolate mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div
        className="hero-glow pointer-events-none absolute inset-x-0 top-0 -z-10 h-[420px] opacity-70"
        aria-hidden="true"
      />
      <div className="animate-enter">
        <ProfileHero profile={profile} />
      </div>

      <div className="animate-enter mt-5" style={{ animationDelay: "60ms" }}>
        <RatingChart
          history={profile.ratingHistory}
          currentRating={user.rating}
          ratingRank={profile.ratingRank}
          ratedUserCount={profile.ratedUserCount}
          ratingDistribution={profile.ratingDistribution}
        />
      </div>

      <div className="animate-enter mt-5" style={{ animationDelay: "100ms" }}>
        <ProfileStatGrid profile={profile} />
      </div>

      {profile.approvedEditorialCount > 0 ? (
        <div className="animate-enter mt-5" style={{ animationDelay: "130ms" }}>
          <ProfileEditorials
            count={profile.approvedEditorialCount}
            editorials={profile.approvedEditorials}
          />
        </div>
      ) : null}

      <div
        className="animate-enter mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.8fr)]"
        style={{ animationDelay: "160ms" }}
      >
        <SolveSpectrum
          solved={profile.difficultySolved}
          totals={profile.difficultyTotals}
          attemptedCount={profile.attemptedCount}
          solvedCount={profile.solvedCount}
        />
        <AchievementBadges achievements={profile.achievements} />
      </div>

      <div className="animate-enter mt-5" style={{ animationDelay: "180ms" }}>
        <LearningBadges badges={profile.learningBadges} />
      </div>

      <div
        className="animate-enter mt-5 grid gap-5 lg:grid-cols-2"
        style={{ animationDelay: "200ms" }}
      >
        <SubmissionAnalytics stats={profile.verdictStats} />
        <LanguageAnalytics stats={profile.languageStats} />
      </div>

      <div className="animate-enter mt-5" style={{ animationDelay: "220ms" }}>
        <ActivityHeatmap
          days={profile.heatmap}
          activeDays={profile.activeDays}
          currentStreak={profile.currentStreak}
          longestStreak={profile.longestStreak}
        />
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <ProfileProblems
          title="Solved problems"
          description="Your latest accepted solutions."
          items={profile.solvedProblems}
          variant="solved"
        />
        <ProfileProblems
          title="Unsolved attempts"
          description="Problems you have tried but not solved yet."
          items={profile.unsolvedProblems}
          variant="unsolved"
        />
      </div>

      <section className="mt-10">
        <div className="flex flex-wrap items-end justify-between gap-2 border-b border-border pb-3">
          <div>
            <h2 className="text-lg font-semibold">Recent submissions</h2>
            <p className="text-xs text-muted-foreground">
              The latest verdicts for @{user.username}.
            </p>
          </div>
          {user.isSelf ? (
            <Link
              href="/submissions?mine=true"
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              All my submissions
            </Link>
          ) : (
            <Link
              href={`/submissions?user=${user.username}`}
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              All submissions
            </Link>
          )}
        </div>
        <Card className="mt-4 overflow-hidden rounded-2xl p-1 shadow-sm">
          {profile.recentSubmissions.length === 0 ? (
            <EmptyState
              className="border-0"
              title="No submissions yet"
              description={
                user.isSelf
                  ? "Solve a problem to start building your profile."
                  : "This coder has not submitted anything yet."
              }
              icon={UserRound}
              action={
                user.isSelf ? (
                  <Link href="/problems" className={buttonVariants()}>
                    Find a problem
                  </Link>
                ) : undefined
              }
            />
          ) : (
            <SubmissionTable items={profile.recentSubmissions} showUser={false} />
          )}
        </Card>
      </section>
    </div>
  );
}
