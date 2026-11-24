import { Hero } from "@/components/home/hero";
import { DailyChallenge } from "@/components/home/daily-challenge";
import { ProblemShowcase } from "@/components/home/problem-showcase";
import { CompetitionSection } from "@/components/home/competition";
import { VerdictFeed } from "@/components/home/verdict-feed";
import { AssessmentSpotlight } from "@/components/home/assessment-spotlight";
import { FeatureBento } from "@/components/home/feature-bento";
import { FinalCta } from "@/components/home/final-cta";
import { getCurrentUser } from "@/server/auth/session";
import { listContests } from "@/server/services/contests";
import { listProblems } from "@/server/services/problems";
import { listRank } from "@/server/services/rank";
import { getSiteStats, getSubmissionActivity } from "@/server/services/stats";
import { listSubmissions } from "@/server/services/submissions";
import { getDailyChallenge } from "@/server/services/daily-challenge";
import { isJudgeOnline } from "@/server/worker-heartbeat";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const user = await getCurrentUser();
  const isAdmin = user?.role === "ADMIN";

  const [
    stats,
    problemPage,
    contestPage,
    rankPage,
    submissionPage,
    activity,
    daily,
    judgeOnline,
  ] = await Promise.all([
    getSiteStats({ userId: user?.id ?? null, isAdmin }),
    listProblems({
      page: { page: 1, pageSize: 4 },
      userId: user?.id ?? null,
      isAdmin,
    }),
    listContests({
      page: { page: 1, pageSize: 3 },
      filter: "ALL",
      userId: user?.id ?? null,
    }),
    listRank({ page: 1, pageSize: 5 }),
    listSubmissions({ page: 1, pageSize: 6, publicOnly: true }, null),
    getSubmissionActivity(14, { publicOnly: true }),
    getDailyChallenge(user?.id ?? null, isAdmin),
    isJudgeOnline(),
  ]);

  return (
    <>
      <Hero stats={stats} isAuthenticated={Boolean(user)} />
      {daily ? <DailyChallenge data={daily} /> : null}
      <ProblemShowcase
        items={problemPage.items}
        total={problemPage.total}
        canCreate={isAdmin}
      />
      <CompetitionSection
        contests={contestPage.items}
        rankItems={rankPage.items}
      />
      <VerdictFeed
        items={submissionPage.items}
        activity={activity}
        judgeOnline={judgeOnline}
      />
      <AssessmentSpotlight isAdmin={isAdmin} />
      <FeatureBento />
      <FinalCta isAuthenticated={Boolean(user)} />
    </>
  );
}
