import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2, Clock3, Database, LockKeyhole, Sparkles } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DifficultyBadge } from "@/components/shared/difficulty-badge";
import { SQL_TOPICS, SQL_TRACK_INTRO } from "@/lib/learning/sql-track";
import { getCurrentUser } from "@/server/auth/session";
import { getEntitledModuleSlugs } from "@/server/services/learning-payments";
import { getDb } from "@/server/db";
import { problems, submissions } from "@/server/db/schema";
import { and, eq, inArray } from "drizzle-orm";

export const metadata: Metadata = {
  title: "SQL Labs",
  description:
    "Learn SQL through the ShopSphere marketplace: vendors, orders, joins, window functions and recursive CTEs, with judgeable problems.",
};

export const dynamic = "force-dynamic";

const LEVEL_LABEL = {
  basic: { label: "Basic SQL", detail: "Free · start here" },
  advanced: { label: "Advanced SQL", detail: "৳500 · payment required" },
} as const;

export default async function SqlLabPage() {
  const user = await getCurrentUser();
  const entitled = await getEntitledModuleSlugs(user?.id ?? null, user?.role);
  const advancedUnlocked = entitled.has("advanced-sql");

  const slugs = SQL_TOPICS.flatMap((topic) => topic.problemSlugs);
  const db = getDb();
  const rows = await db
    .select({
      id: problems.id,
      slug: problems.slug,
      title: problems.title,
      difficulty: problems.difficulty,
      points: problems.points,
      timeLimitMs: problems.timeLimitMs,
      memoryLimitMb: problems.memoryLimitMb,
    })
    .from(problems)
    .where(inArray(problems.slug, slugs));
  const bySlug = new Map(rows.map((row) => [row.slug, row]));

  const solved = new Set<string>();
  if (user && rows.length > 0) {
    const accepted = await db
      .select({ problemId: submissions.problemId })
      .from(submissions)
      .where(
        and(
          eq(submissions.userId, user.id),
          eq(submissions.status, "ACCEPTED"),
          inArray(
            submissions.problemId,
            rows.map((row) => row.id),
          ),
        ),
      );
    for (const row of accepted) solved.add(row.problemId);
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <PageHeader
        eyebrow="SQL Labs"
        title={SQL_TRACK_INTRO.title}
        description={SQL_TRACK_INTRO.summary}
        actions={
          <Link href="/learn" className={buttonVariants({ variant: "outline" })}>
            All learning tracks
          </Link>
        }
      />

      <div className="mt-4 flex flex-wrap gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-2.5 py-1 text-[11px] text-muted-foreground">
          <Database className="size-3" aria-hidden="true" /> Real judge problems
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-2.5 py-1 text-[11px] text-muted-foreground">
          <Clock3 className="size-3" aria-hidden="true" /> Time & memory limits
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-2.5 py-1 text-[11px] text-muted-foreground">
          <Sparkles className="size-3" aria-hidden="true" /> SQL · MySQL · PostgreSQL syntax
        </span>
      </div>

      <Card className="mt-6 p-5">
        <h2 className="flex items-center gap-2 text-sm font-semibold">
          <Database className="size-4 text-primary" aria-hidden="true" />
          The ShopSphere database
        </h2>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
          প্রতিটি সমস্যা একই ডেটাসেটে চলে। নিচের টেবিলগুলো মনে রাখো — প্রশ্নের
          ভেতরেই বলে দেওয়া থাকবে কোনটা লাগবে। SQL/MySQL/PostgreSQL যেকোনো
          syntax-এ লিখতে পারো (portable standard SQL সবচেয়ে নিরাপদ)।
        </p>
        <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {SQL_TRACK_INTRO.tables.map(([name, columns]) => (
            <div key={name} className="rounded-lg border border-border bg-muted/20 px-3 py-2">
              <p className="font-mono text-[11px] font-semibold">{name}</p>
              <p className="mt-0.5 text-[10px] leading-relaxed text-muted-foreground">
                {columns}
              </p>
            </div>
          ))}
        </div>
      </Card>

      {(["basic", "advanced"] as const).map((level) => {
        const topics = SQL_TOPICS.filter((topic) => topic.level === level);
        const locked = level === "advanced" && !advancedUnlocked;
        return (
          <section key={level} className="mt-8">
            <div className="flex flex-wrap items-end justify-between gap-2">
              <div>
                <h2 className="text-lg font-semibold">{LEVEL_LABEL[level].label}</h2>
                <p className="text-xs text-muted-foreground">
                  {locked
                    ? "Advanced SQL unlocks after a ৳500 purchase or free-access approval."
                    : LEVEL_LABEL[level].detail}
                </p>
              </div>
              {level === "advanced" ? (
                locked ? (
                  <Link href="/learn/pricing" className={buttonVariants({ size: "sm" })}>
                    Unlock for ৳500
                  </Link>
                ) : (
                  <Badge variant="success">Unlocked</Badge>
                )
              ) : (
                <Badge variant="success">Free</Badge>
              )}
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              {topics.map((topic) => (
                <Card key={topic.slug} className="flex flex-col p-5">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-primary">
                    {topic.titleBn}
                  </p>
                  <h3 className="mt-1 text-base font-semibold">{topic.title}</h3>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                    {topic.summary}
                  </p>
                  <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
                    {topic.concept}
                  </p>

                  <ul className="mt-4 divide-y divide-border border-t border-border">
                    {topic.problemSlugs.map((slug) => {
                      const problem = bySlug.get(slug);
                      if (!problem) return null;
                      const isSolved = solved.has(problem.id);
                      const content = (
                        <span className="flex items-center gap-2">
                          {locked ? (
                            <LockKeyhole className="size-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
                          ) : isSolved ? (
                            <CheckCircle2 className="size-3.5 shrink-0 text-emerald-500" aria-hidden="true" />
                          ) : (
                            <span className="size-1.5 shrink-0 rounded-full bg-primary/60" aria-hidden="true" />
                          )}
                          <span className="min-w-0 flex-1">
                            <span className="block text-sm font-medium">
                              {problem.title}
                            </span>
                            <span className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px] text-muted-foreground">
                              <DifficultyBadge difficulty={problem.difficulty} />
                              <span>{problem.points} pts</span>
                              <span>{problem.timeLimitMs / 1000}s</span>
                              <span>{problem.memoryLimitMb} MB</span>
                              {isSolved ? <span className="text-emerald-600 dark:text-emerald-400">Solved</span> : null}
                            </span>
                          </span>
                        </span>
                      );
                      return (
                        <li key={slug} className="py-2.5">
                          {locked ? (
                            <Link
                              href="/learn/pricing"
                              className="block opacity-70 transition-opacity hover:opacity-100"
                              title="Unlock Advanced SQL"
                            >
                              {content}
                            </Link>
                          ) : (
                            <Link
                              href={`/problems/${problem.slug}`}
                              className="block transition-colors hover:text-primary"
                            >
                              {content}
                            </Link>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </Card>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
