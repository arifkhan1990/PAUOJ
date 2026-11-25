import type { Metadata } from "next";
import Link from "next/link";
import {
  Award,
  BookOpen,
  CheckCircle2,
  Clock3,
  Database,
  LockKeyhole,
  Sparkles,
} from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { SqlProjectLink } from "@/components/learning/sql-project/sql-project-link";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DifficultyBadge } from "@/components/shared/difficulty-badge";
import type { Difficulty } from "@/lib/difficulty";
import {
  advancedSqlModule,
  basicSqlModule,
} from "@/lib/learning/tracks/sql-track";
import { SQL_PROJECT_TABLES } from "@/lib/learning/sql-project-schema";
import { purchasePriceBdt } from "@/lib/learning/payments";
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

const INTRO = {
  title: "ShopSphere: query the marketplace",
  summary:
    "একটি মাল্টি-ভেন্ডর অনলাইন দোকান। ভেন্ডর, কাস্টমার, প্রোডাক্ট, অর্ডার, পেমেন্ট, শিপমেন্ট, রিটার্ন, কুপন, কার্ট, ইনভেন্টরি, রিভিউ আর ভেন্ডর পেআউট — সব একই ডেটাবেসে। প্রতিটি টপিক বাস্তব প্রশ্ন দিয়ে শুরু হয়, তারপর সেই প্রশ্নের SQL সমাধান।",
} as const;

const SQL_MODULES = [basicSqlModule, advancedSqlModule] as const;

function moduleProblemSlugs(module: (typeof SQL_MODULES)[number]): string[] {
  return [
    ...module.topics.flatMap((topic) => topic.guidedProblemSlugs),
    ...(module.checkpoint?.problemSlugs ?? []),
  ];
}

export default async function SqlLabPage() {
  const user = await getCurrentUser();
  const entitled = await getEntitledModuleSlugs(user?.id ?? null, user?.role);
  const advancedUnlocked = entitled.has("advanced-sql");

  const slugs = SQL_MODULES.flatMap(moduleProblemSlugs);
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
        title={INTRO.title}
        description={INTRO.summary}
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
          <Sparkles className="size-3" aria-hidden="true" /> SQL · MySQL · PostgreSQL
          syntax
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
          {SQL_PROJECT_TABLES.map((table) => (
            <div
              key={table.name}
              className="rounded-lg border border-border bg-muted/20 px-3 py-2"
            >
              <p className="font-mono text-[11px] font-semibold">
                {table.name}
              </p>
              <p className="mt-0.5 text-[10px] leading-relaxed text-muted-foreground">
                {table.columns.map((column) => column.name).join(", ")}
              </p>
            </div>
          ))}
        </div>
      </Card>

      <Link
        href="/sql-handbook"
        className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-primary/25 bg-primary/[0.04] px-4 py-3 transition-colors hover:border-primary/45"
      >
        <span className="flex min-w-0 items-start gap-3">
          <span
            className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary"
            aria-hidden="true"
          >
            <BookOpen className="size-4" />
          </span>
          <span className="min-w-0">
            <span className="block text-sm font-semibold">
              Production database handbook
            </span>
            <span className="mt-0.5 block text-xs leading-relaxed text-muted-foreground">
              DDL, constraints, indexes/EXPLAIN, transactions, views, security,
              partitioning and dialect differences — the project layer around
              the queries.
            </span>
          </span>
        </span>
        <span className="text-xs font-medium text-primary">Read handbook →</span>
      </Link>

      <SqlProjectLink className="mt-4" />

      {SQL_MODULES.map((module) => {
        const locked = module.slug === "advanced-sql" && !advancedUnlocked;
        const price = purchasePriceBdt(module.slug);
        return (
          <section key={module.slug} className="mt-8">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-primary">
                  Track {String(module.order).padStart(2, "0")} ·{" "}
                  {module.estimatedHours} h
                </p>
                <h2 className="mt-1 text-lg font-semibold">{module.title}</h2>
                <p className="max-w-2xl text-xs leading-relaxed text-muted-foreground">
                  {module.description}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {locked ? (
                  <>
                    <Badge variant="warning">
                      <LockKeyhole className="size-3" aria-hidden="true" /> ৳{price}
                    </Badge>
                    <Link
                      href="/learn/pricing"
                      className={buttonVariants({ size: "sm" })}
                    >
                      Unlock for ৳{price}
                    </Link>
                  </>
                ) : (
                  <>
                    <Badge variant="success">
                      {module.slug === "advanced-sql" ? "Unlocked" : "Free"}
                    </Badge>
                    <Link
                      href={`/learn/${module.slug}`}
                      className={buttonVariants({ size: "sm" })}
                    >
                      Open track
                    </Link>
                  </>
                )}
              </div>
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              {module.topics.map((topic) => {
                const topicSlugs = topic.guidedProblemSlugs;
                const practiceCount =
                  topic.practiceProblemSlugs.easy.length +
                  topic.practiceProblemSlugs.medium.length +
                  topic.practiceProblemSlugs.hard.length;
                return (
                  <Card key={topic.slug} className="flex flex-col p-5">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-primary">
                      {topic.titleBn}
                    </p>
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-semibold">{topic.title}</h3>
                      <Badge variant="outline">
                        {topicSlugs.length} guided · {practiceCount} practice
                      </Badge>
                    </div>
                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                      {topic.summary}
                    </p>
                    <ul className="mt-4 divide-y divide-border border-t border-border">
                      {topicSlugs.map((slug) => (
                        <li key={slug} className="py-2.5">
                          <ProblemRow
                            slug={slug}
                            locked={locked}
                            problem={bySlug.get(slug)}
                            solved={solved}
                          />
                        </li>
                      ))}
                    </ul>
                  </Card>
                );
              })}
            </div>

            {module.checkpoint ? (
              <Card className="mt-4 p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="flex items-center gap-2 text-sm font-semibold">
                      <Clock3 className="size-4 text-primary" aria-hidden="true" />
                      {module.checkpoint.title}
                      <span className="text-xs font-normal text-muted-foreground">
                        · {module.checkpoint.durationMinutes} min
                      </span>
                    </h3>
                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                      {module.checkpoint.description}
                    </p>
                  </div>
                  <Badge variant="outline">
                    <Award className="size-3" aria-hidden="true" />
                    {module.checkpoint.badge.name}
                  </Badge>
                </div>
                <ul className="mt-3 grid gap-2 sm:grid-cols-3">
                  {module.checkpoint.problemSlugs.map((slug) => (
                    <li
                      key={slug}
                      className="rounded-lg border border-border bg-muted/20 px-3 py-2"
                    >
                      <ProblemRow
                        slug={slug}
                        locked={locked}
                        problem={bySlug.get(slug)}
                        solved={solved}
                      />
                    </li>
                  ))}
                </ul>
              </Card>
            ) : null}
          </section>
        );
      })}
    </div>
  );
}

function ProblemRow({
  slug,
  locked,
  problem,
  solved,
}: {
  slug: string;
  locked: boolean;
  problem:
    | {
        id: string;
        slug: string;
        title: string;
        difficulty: Difficulty;
        points: number;
        timeLimitMs: number;
        memoryLimitMb: number;
      }
    | undefined;
  solved: Set<string>;
}) {
  if (!problem) return null;
  const isSolved = solved.has(problem.id);
  const content = (
    <span className="flex items-center gap-2">
      {locked ? (
        <LockKeyhole
          className="size-3.5 shrink-0 text-muted-foreground"
          aria-hidden="true"
        />
      ) : isSolved ? (
        <CheckCircle2
          className="size-3.5 shrink-0 text-emerald-500"
          aria-hidden="true"
        />
      ) : (
        <span
          className="size-1.5 shrink-0 rounded-full bg-primary/60"
          aria-hidden="true"
        />
      )}
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-medium">{problem.title}</span>
        <span className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px] text-muted-foreground">
          <DifficultyBadge difficulty={problem.difficulty} />
          <span>{problem.points} pts</span>
          <span>{problem.timeLimitMs / 1000}s</span>
          <span>{problem.memoryLimitMb} MB</span>
          {isSolved ? (
            <span className="text-emerald-600 dark:text-emerald-400">
              Solved
            </span>
          ) : null}
        </span>
      </span>
    </span>
  );
  if (locked) {
    return (
      <Link
        href="/learn/pricing"
        className="block opacity-70 transition-opacity hover:opacity-100"
        title="Unlock Advanced SQL"
      >
        {content}
      </Link>
    );
  }
  return (
    <Link
      href={`/problems/${slug}`}
      className="block transition-colors hover:text-primary"
    >
      {content}
    </Link>
  );
}
