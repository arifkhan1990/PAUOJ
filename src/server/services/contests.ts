import { and, asc, count, eq, gt, inArray, isNull, lte, sql } from "drizzle-orm";
import { errors } from "@/server/api/errors";
import { toOffset, type PaginationInput } from "@/server/api/validation";
import { getDb } from "@/server/db";
import {
  contestProblems,
  contestRegistrations,
  contests,
  problems,
  submissions,
} from "@/server/db/schema";
import type {
  ContestDetail,
  ContestDivision,
  ContestListItem,
} from "@/lib/types";
import { contestStatus } from "@/lib/contests";
import { finalizeContestRatings } from "./ratings";
import {
  participantCountSql,
  problemCountSql,
  registeredSql,
  statusCondition,
  type ActiveContestContext,
  type ContestFilter,
} from "./contest-queries";

export type { ActiveContestContext, ContestFilter } from "./contest-queries";

async function finalizeRatingsIfEnded(
  slug: string,
  status: string,
): Promise<void> {
  if (status !== "ENDED") return;
  try {
    await finalizeContestRatings(slug);
  } catch (error) {
    console.error("Contest rating finalization failed", error);
  }
}

export async function listContests(input: {
  page: PaginationInput;
  filter: ContestFilter;
  division?: ContestDivision;
  userId: string | null;
}): Promise<{ items: ContestListItem[]; total: number }> {
  const db = getDb();
  const now = new Date();
  const where = and(
    eq(contests.isPublic, true),
    statusCondition(input.filter, now),
    input.division ? eq(contests.division, input.division) : undefined,
  );

  const [totalRow] = await db
    .select({ value: count() })
    .from(contests)
    .where(where);

  const rows = await db
    .select({
      id: contests.id,
      slug: contests.slug,
      title: contests.title,
      description: contests.description,
      startAt: contests.startAt,
      endAt: contests.endAt,
      isPublic: contests.isPublic,
      division: contests.division,
      freezeMinutes: contests.freezeMinutes,
      participantCount: participantCountSql(),
      problemCount: problemCountSql(),
      registered: registeredSql(input.userId),
    })
    .from(contests)
    .where(where)
    .orderBy(
      sql`case when ${contests.endAt} > now() then 0 else 1 end`,
      asc(contests.startAt),
    )
    .limit(input.page.pageSize)
    .offset(toOffset(input.page));

  return {
    total: Number(totalRow?.value ?? 0),
    items: rows.map((row) => ({
      id: row.id,
      slug: row.slug,
      title: row.title,
      description: row.description,
      startAt: row.startAt.toISOString(),
      endAt: row.endAt.toISOString(),
      status: contestStatus(row.startAt, row.endAt, now),
      division: row.division,
      freezeMinutes: row.freezeMinutes,
      participantCount: Number(row.participantCount),
      problemCount: Number(row.problemCount),
      registered: Boolean(row.registered),
    })),
  };
}

export async function getContestBySlug(
  slug: string,
  userId: string | null,
  isAdmin: boolean,
): Promise<ContestDetail | null> {
  const db = getDb();
  const now = new Date();
  const rows = await db
    .select()
    .from(contests)
    .where(eq(contests.slug, slug))
    .limit(1);
  const contest = rows[0];
  if (!contest) return null;
  if (!contest.isPublic && !isAdmin && contest.createdBy !== userId) {
    return null;
  }

  const status = contestStatus(contest.startAt, contest.endAt, now);
  await finalizeRatingsIfEnded(contest.slug, status);
  const [registration] = userId
    ? await db
        .select({ contestId: contestRegistrations.contestId })
        .from(contestRegistrations)
        .where(
          and(
            eq(contestRegistrations.contestId, contest.id),
            eq(contestRegistrations.userId, userId),
          ),
        )
        .limit(1)
    : [];

  const problemRows = await db
    .select({
      id: problems.id,
      label: contestProblems.label,
      position: contestProblems.position,
      slug: problems.slug,
      title: problems.title,
      difficulty: problems.difficulty,
      points: problems.points,
    })
    .from(contestProblems)
    .innerJoin(problems, eq(problems.id, contestProblems.problemId))
    .where(eq(contestProblems.contestId, contest.id))
    .orderBy(asc(contestProblems.position));

  const [participantRow] = await db
    .select({ value: count() })
    .from(contestRegistrations)
    .where(eq(contestRegistrations.contestId, contest.id));

  const showProblems = status !== "UPCOMING" || isAdmin;

  const userSubmissions = userId
    ? await db
        .select({ problemId: submissions.problemId, status: submissions.status })
        .from(submissions)
        .where(
          and(
            eq(submissions.contestId, contest.id),
            eq(submissions.userId, userId),
            isNull(submissions.virtualContestId),
          ),
        )
    : [];

  const solved = new Set(
    userSubmissions
      .filter((row) => row.status === "ACCEPTED")
      .map((row) => row.problemId),
  );
  const attempted = new Set(userSubmissions.map((row) => row.problemId));

  return {
    id: contest.id,
    slug: contest.slug,
    title: contest.title,
    description: contest.description,
    startAt: contest.startAt.toISOString(),
    endAt: contest.endAt.toISOString(),
    status,
    division: contest.division,
    freezeMinutes: contest.freezeMinutes,
    participantCount: Number(participantRow?.value ?? 0),
    problemCount: problemRows.length,
    registered: Boolean(registration),
    canRegister: Boolean(userId) && status !== "ENDED" && !registration,
    registrationCount: Number(participantRow?.value ?? 0),
    problems: showProblems
      ? problemRows.map((row) => ({
          label: row.label,
          slug: row.slug,
          title: row.title,
          difficulty: row.difficulty,
          points: row.points,
          solvedByMe: solved.has(row.id),
          attemptedByMe: attempted.has(row.id),
        }))
      : [],
  };
}

export async function registerForContest(
  slug: string,
  userId: string,
): Promise<{ registrationCount: number }> {
  const db = getDb();
  const rows = await db
    .select()
    .from(contests)
    .where(eq(contests.slug, slug))
    .limit(1);
  const contest = rows[0];
  if (!contest || !contest.isPublic) throw errors.notFound("Contest not found.");
  const status = contestStatus(contest.startAt, contest.endAt);
  if (status === "ENDED") {
    throw errors.conflict("This contest has already ended.");
  }

  await db
    .insert(contestRegistrations)
    .values({ contestId: contest.id, userId })
    .onConflictDoNothing();

  const [row] = await db
    .select({ value: count() })
    .from(contestRegistrations)
    .where(eq(contestRegistrations.contestId, contest.id));

  return { registrationCount: Number(row?.value ?? 0) };
}

export async function getActiveContestForProblem(
  problemId: string,
  userId: string | null,
  isAdmin: boolean,
): Promise<{
  active: ActiveContestContext | null;
  restricted: boolean;
  blockingContest: { slug: string; title: string } | null;
}> {
  const db = getDb();
  const now = new Date();
  const rows = await db
    .select({
      contestId: contests.id,
      slug: contests.slug,
      title: contests.title,
      label: contestProblems.label,
      startAt: contests.startAt,
      endAt: contests.endAt,
    })
    .from(contestProblems)
    .innerJoin(contests, eq(contests.id, contestProblems.contestId))
    .where(
      and(
        eq(contestProblems.problemId, problemId),
        lte(contests.startAt, now),
        gt(contests.endAt, now),
      ),
    )
    .orderBy(asc(contests.startAt));

  if (rows.length === 0) {
    return { active: null, restricted: false, blockingContest: null };
  }
  if (isAdmin) {
    return { active: rows[0] ?? null, restricted: false, blockingContest: null };
  }
  if (userId) {
    const registrations = await db
      .select({ contestId: contestRegistrations.contestId })
      .from(contestRegistrations)
      .where(
        and(
          eq(contestRegistrations.userId, userId),
          inArray(
            contestRegistrations.contestId,
            rows.map((row) => row.contestId),
          ),
        ),
      );
    const registered = new Set(registrations.map((row) => row.contestId));
    const active = rows.find((row) => registered.has(row.contestId));
    if (active) {
      return {
        active,
        restricted: false,
        blockingContest: null,
      };
    }
  }
  const blocker = rows[0];
  return {
    active: null,
    restricted: true,
    blockingContest: blocker
      ? { slug: blocker.slug, title: blocker.title }
      : null,
  };
}

export async function getContestForSubmission(
  contestId: string,
  problemId: string,
  userId: string,
): Promise<{ contestId: string; startAt: Date }> {
  const db = getDb();
  const rows = await db
    .select({ id: contests.id, startAt: contests.startAt, endAt: contests.endAt })
    .from(contests)
    .where(eq(contests.id, contestId))
    .limit(1);
  const contest = rows[0];
  if (!contest) throw errors.notFound("Contest not found.");
  if (contestStatus(contest.startAt, contest.endAt) !== "RUNNING") {
    throw errors.conflict("This contest is not running.");
  }

  const [registration] = await db
    .select({ contestId: contestRegistrations.contestId })
    .from(contestRegistrations)
    .where(
      and(
        eq(contestRegistrations.contestId, contestId),
        eq(contestRegistrations.userId, userId),
      ),
    )
    .limit(1);
  if (!registration) {
    throw errors.forbidden("Register for the contest before submitting.");
  }

  const [entry] = await db
    .select({ problemId: contestProblems.problemId })
    .from(contestProblems)
    .where(
      and(
        eq(contestProblems.contestId, contestId),
        eq(contestProblems.problemId, problemId),
      ),
    )
    .limit(1);
  if (!entry) {
    throw errors.validation("That problem is not part of this contest.");
  }
  return { contestId: contest.id, startAt: contest.startAt };
}

export { getScoreboard } from "./contest-scoreboard";
