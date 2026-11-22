import type { Metadata } from "next";
import Link from "next/link";
import { Award, Layers3, Route, Trophy } from "lucide-react";
import { ModuleCard } from "@/components/learning/module-card";
import { PageHeader } from "@/components/shared/page-header";
import { SectionHeading } from "@/components/shared/section-heading";
import { StatCard } from "@/components/shared/stat-card";
import { buttonVariants } from "@/components/ui/button";
import { getCurrentUser } from "@/server/auth/session";
import { getLearningOverview } from "@/server/services/learning";

export const metadata: Metadata = {
  title: "Learning tracks",
  description:
    "A seven-track curriculum from basic programming to advanced algorithms, with concept notes, guided practice and timed checkpoints.",
};

export const dynamic = "force-dynamic";

export default async function LearnPage() {
  const user = await getCurrentUser();
  const modules = (await getLearningOverview(user)).sort(
    (left, right) => left.order - right.order,
  );

  const liveTracks = modules.filter((module) => module.status === "LIVE").length;
  const totalTopics = modules.reduce(
    (sum, module) => sum + module.topicCount,
    0,
  );
  const solvedProblems = modules.reduce(
    (sum, module) => sum + module.progress.solved,
    0,
  );
  const badgesEarned = modules.filter((module) => module.badgeEarned).length;

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <PageHeader
        eyebrow="Curriculum"
        title="Learning tracks"
        description="Seven tracks that take you from your first loop to advanced algorithms. ধাপে ধাপে শিখুন — প্রতিটি টপিকে কনসেপ্ট নোট, গাইডেড সমস্যা আর চেকপয়েন্ট।"
        actions={
          <Link
            href={user ? "/problems" : "/login?next=/learn"}
            className={buttonVariants({ variant: user ? "outline" : "default" })}
          >
            {user ? "Problem archive" : "Sign in to track"}
          </Link>
        }
      />

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard
          label="Live tracks"
          value={liveTracks}
          hint={`of ${modules.length} tracks`}
          icon={Route}
        />
        <StatCard
          label="Topics"
          value={totalTopics}
          hint="Across the curriculum"
          icon={Layers3}
        />
        <StatCard
          label="Solved"
          value={solvedProblems}
          hint={user ? "Across all tracks" : "Sign in to track"}
          icon={Trophy}
        />
        <StatCard
          label="Badges"
          value={badgesEarned}
          hint={`of ${liveTracks} live`}
          icon={Award}
        />
      </div>

      {user ? null : (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-primary/25 bg-primary/5 px-4 py-3">
          <p className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">
              Progress is saved to your account.
            </span>{" "}
            Sign in to keep solved counts, checkpoints and badges.
          </p>
          <Link
            href="/login?next=/learn"
            className={buttonVariants({ size: "sm" })}
          >
            Sign in
          </Link>
        </div>
      )}

      <SectionHeading
        title="All tracks"
        description="Each track is self-contained. Start at track 1 or jump to a topic you need."
        className="mt-8"
      />

      <ul className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {modules.map((module) => (
          <ModuleCard
            key={module.slug}
            module={module}
            signedIn={Boolean(user)}
          />
        ))}
      </ul>
    </div>
  );
}
