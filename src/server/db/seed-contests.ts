import { eq } from "drizzle-orm";
import { getDb } from "./index";
import {
  contestProblemApprovals,
  contestProblems,
  contestStaff,
  contests,
} from "./schema";
import type { SeededProblem } from "./seed-problems";
import { ratedContestSeedDefinitions } from "./seed-rated-contests";

async function upsertContest(input: {
  adminId: string;
  slug: string;
  title: string;
  description: string;
  startAt: Date;
  endAt: Date;
  problemSlugs: string[];
  problemMap: Map<string, SeededProblem>;
  format?: "SINGLE" | "GROUP";
  teamSize?: number;
  isOfficial?: boolean;
  requiresFreshProblems?: boolean;
  bannerUrl?: string | null;
  eligibility?: string;
  rules?: string;
  prizes?: string;
}): Promise<string> {
  const db = getDb();
  const rows = await db
    .select({ id: contests.id })
    .from(contests)
    .where(eq(contests.slug, input.slug))
    .limit(1);

  const settings = {
    format: input.format ?? "SINGLE",
    teamSize: input.teamSize ?? 3,
    isOfficial: input.isOfficial ?? true,
    requiresFreshProblems: input.requiresFreshProblems ?? false,
    ...(input.bannerUrl !== undefined ? { bannerUrl: input.bannerUrl } : {}),
    eligibility: input.eligibility ?? null,
    rules: input.rules ?? null,
    prizes:
      input.prizes ??
      [
        "### Prizes & recognition",
        "- Top 3 finishers get a public podium finish on the round page.",
        "- Every accepted solver keeps the contest result in their archive.",
      ].join("\n"),
  };

  let contestId: string;
  if (rows[0]) {
    contestId = rows[0].id;
    await db
      .update(contests)
      .set({
        title: input.title,
        description: input.description,
        startAt: input.startAt,
        endAt: input.endAt,
        isPublic: true,
        ...settings,
        updatedAt: new Date(),
      })
      .where(eq(contests.id, contestId));
    await db
      .delete(contestProblems)
      .where(eq(contestProblems.contestId, contestId));
  } else {
    const [created] = await db
      .insert(contests)
      .values({
        slug: input.slug,
        title: input.title,
        description: input.description,
        startAt: input.startAt,
        endAt: input.endAt,
        isPublic: true,
        createdBy: input.adminId,
        ...settings,
      })
      .returning({ id: contests.id });
    if (!created) throw new Error(`Could not create contest ${input.slug}`);
    contestId = created.id;
  }

  await db
    .insert(contestStaff)
    .values({
      contestId,
      userId: input.adminId,
      role: "DIRECTOR",
      status: "ACCEPTED",
      invitedById: input.adminId,
      respondedAt: new Date(),
    })
    .onConflictDoNothing();

  const links = input.problemSlugs.map((slug, index) => {
    const problem = input.problemMap.get(slug);
    if (!problem) throw new Error(`Missing seed problem ${slug}`);
    return {
      contestId,
      problemId: problem.id,
      label: String.fromCharCode(65 + index),
      position: String(index).padStart(2, "0"),
    };
  });
  await db
    .delete(contestProblemApprovals)
    .where(eq(contestProblemApprovals.contestId, contestId));
  await db.insert(contestProblems).values(links);
  await db
    .insert(contestProblemApprovals)
    .values(
      links.map((link) => ({
        contestId: link.contestId,
        problemId: link.problemId,
        status: "APPROVED" as const,
        reviewedAt: new Date(),
      })),
    )
    .onConflictDoNothing();
  return contestId;
}

export type SeededEndedContest = {
  id: string;
  slug: string;
  startAt: Date;
};

export async function seedContests(
  adminId: string,
  problemMap: Map<string, SeededProblem>,
): Promise<{
  activeId: string;
  activeStart: Date;
  ended: SeededEndedContest[];
}> {
  const now = Date.now();
  const activeStart = new Date(now - 2 * 24 * 60 * 60 * 1000);
  const activeEnd = new Date(now + 5 * 24 * 60 * 60 * 1000);
  const activeId = await upsertContest({
    adminId,
    slug: "pauoj-launch-2026",
    title: "PAUOJ Launch Contest",
    description: [
      "The first official round on the new PAU Online Judge.",
      "",
      "Four hand-picked problems, ICPC scoring and a live scoreboard. The set is designed as a complete warm-up: implementation, arrays, primes and bracket matching. Read every statement carefully, test edge cases, and use the clarification panel if a statement needs context.",
      "",
      "### What to expect",
      "- A sealed problem set that opens at the start bell.",
      "- Live standings with first-blood markers and a freeze window near the end.",
      "- Editorial access after the round for every participant.",
      "- A calm, copy-protected workspace with a per-view watermark.",
    ].join("\n"),
    eligibility:
      "Open to every registered PAU OJ coder. Solo entry; one account per participant.",
    rules: [
      "### Round rules",
      "- The round is solo and uses ICPC scoring: solved count, then penalty, then the earlier last accepted submission.",
      "- Every rejected attempt before acceptance adds 20 penalty minutes; compilation errors do not.",
      "- Source code stays hidden from other participants during the round.",
      "- Statements are watermarked and copy/tab signals are logged. Confirmed plagiarism can lead to disqualification and rating removal.",
      "- Contest crew and problem contributors cannot compete.",
    ].join("\n"),
    prizes: [
      "### Prizes & recognition",
      "- **Champion** — PAU OJ launch champion badge, profile showcase and certificate.",
      "- **Top 3** — profile medal and a public podium finish on the round page.",
      "- **Every accepted solver** — contest points, rating movement when eligible, and a permanent archive entry.",
    ].join("\n"),
    startAt: activeStart,
    endAt: activeEnd,
    problemSlugs: [
      "a-plus-b",
      "array-rotation",
      "prime-counter",
      "balanced-brackets",
    ],
    problemMap,
  });

  const endedDefinitions = ratedContestSeedDefinitions(now);

  const ended: SeededEndedContest[] = [];
  for (const definition of endedDefinitions) {
    const id = await upsertContest({
      adminId,
      ...definition,
      problemMap,
    });
    ended.push({ id, slug: definition.slug, startAt: definition.startAt });
  }

  await upsertContest({
    adminId,
    slug: "pau-intra-2026",
    title: "PAU Intra University Contest",
    description: [
      "The flagship intra-university contest: graphs, strings and dynamic programming at contest pace, played in teams of three.",
      "",
      "Build your team, assign a captain, and register together before the start. The problem set is sealed until the opening bell; the live team scoreboard aggregates every member's accepted submissions into one result.",
      "",
      "### Why take part",
      "- A real team round with captain transfer and a shared scoreboard.",
      "- Three carefully ordered problems, from shortest paths to bracket matching.",
      "- Team honours and a permanent finish on the contest archive.",
    ].join("\n"),
    eligibility:
      "PrimeAsia University students and invited PAU OJ coders. Teams of exactly 3 coders; every member must have a PAU OJ account and join the same team before the start.",
    rules: [
      "### Team round rules",
      "- One team per coder, 3 members per team, captain creates the team and invites the rest.",
      "- A submission by any member counts for the whole team; penalties aggregate per team.",
      "- Team rounds are unrated for individual Elo, but the team finish stays in the archive.",
      "- Statements are watermarked and copy/tab signals are logged. Plagiarism can disqualify the whole team.",
      "- Contest crew, setters, editorial writers and test-case setters cannot compete.",
    ].join("\n"),
    prizes: [
      "### Team prizes",
      "- **Champion team** — intra-university champions trophy, medals and profile showcase.",
      "- **Runner-up & second runner-up** — medals and certificates for every team member.",
      "- **Best first-blood solve** — a special mention on the standings page.",
      "- **Every solver** — contest certificate and archive credit.",
    ].join("\n"),
    startAt: new Date(now + 7 * 24 * 60 * 60 * 1000),
    endAt: new Date(now + 9 * 24 * 60 * 60 * 1000),
    format: "GROUP",
    teamSize: 3,
    isOfficial: true,
    requiresFreshProblems: false,
    problemSlugs: [
      "longest-increasing-subsequence",
      "shortest-path",
      "balanced-brackets",
    ],
    problemMap,
  });

  return { activeId, activeStart, ended };
}
