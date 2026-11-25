import { and, asc, count, eq, inArray, isNull, sql } from "drizzle-orm";
import { errors } from "@/server/api/errors";
import { toOffset, type PaginationInput } from "@/server/api/validation";
import { getDb } from "@/server/db";
import {
  contestProblems,
  contestRegistrations,
  contestSponsors,
  contests,
  problems,
  submissions,
  users,
} from "@/server/db/schema";
import type { ContestSponsorBadge } from "@/lib/contest-ops";
import type {
  ContestDetail,
  ContestDivision,
  ContestListItem,
} from "@/lib/types";
import type { ContestFormat } from "@/lib/contest-ops";
import { contestStatus } from "@/lib/contests";
import { ratingReviewEndsAtIso } from "@/lib/contest-rating";
import { maybeFinalizeRatingSweep } from "./rating-sweep";
import {
  participantCountSql,
  problemCountSql,
  statusCondition,
  type ContestFilter,
} from "./contest-queries";
import {
  contestIntegrityWatermark,
  crewStatusFor,
  isActiveContestStaff,
} from "./contest-context";
import { getContestTeamState } from "./contest-teams";
import { listApprovedContestSponsors } from "./contest-sponsors";
import { isContestStaff } from "./contest-staff";

export { contestStatusCounts } from "./contest-queries";
export type {
  ActiveContestContext,
  ContestFilter,
  ContestStatusCounts,
} from "./contest-queries";
export {
  contestIntegrityWatermark,
  getActiveContestForProblem,
  getContestForSubmission,
  isActiveContestStaff,
  isRegisteredParticipant,
} from "./contest-context";

export function registeredContestSql(userId: string | null) {
  if (!userId) return sql<boolean>`false`;
  return sql<boolean>`(
    exists(select 1 from contest_registrations cr
      where cr.contest_id = ${contests.id} and cr.user_id = ${userId})
    or exists(select 1 from contest_team_members ctm
      join contest_teams ct on ct.id = ctm.team_id
      where ct.contest_id = ${contests.id} and ctm.user_id = ${userId})
  )`;
}

const SPONSOR_TIER_ORDER = sql`case ${contestSponsors.tier}
  when 'TITLE' then 0 when 'GOLD' then 1 when 'SILVER' then 2 else 3 end`;

async function loadTopSponsors(
  contestIds: string[],
): Promise<Map<string, ContestSponsorBadge>> {
  const top = new Map<string, ContestSponsorBadge>();
  if (contestIds.length === 0) return top;
  const rows = await getDb()
    .select({
      id: contestSponsors.id,
      contestId: contestSponsors.contestId,
      name: contestSponsors.name,
      tier: contestSponsors.tier,
      websiteUrl: contestSponsors.websiteUrl,
      logoUrl: contestSponsors.logoUrl,
      message: contestSponsors.message,
    })
    .from(contestSponsors)
    .where(
      and(
        inArray(contestSponsors.contestId, contestIds),
        eq(contestSponsors.status, "APPROVED"),
      ),
    )
    .orderBy(SPONSOR_TIER_ORDER, asc(contestSponsors.createdAt));
  for (const row of rows) {
    if (top.has(row.contestId)) continue;
    top.set(row.contestId, {
      id: row.id,
      name: row.name,
      tier: row.tier,
      websiteUrl: row.websiteUrl,
      logoUrl: row.logoUrl,
      message: row.message,
    });
  }
  return top;
}

function nullableText(value: string | null): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

export async function listContests(input: {
  page: PaginationInput;
  filter: ContestFilter;
  division?: ContestDivision;
  format?: ContestFormat;
  userId: string | null;
}): Promise<{ items: ContestListItem[]; total: number }> {
  const db = getDb();
  const now = new Date();
  const where = and(
    eq(contests.isPublic, true),
    statusCondition(input.filter, now),
    input.division ? eq(contests.division, input.division) : undefined,
    input.format ? eq(contests.format, input.format) : undefined,
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
      bannerUrl: contests.bannerUrl,
      startAt: contests.startAt,
      endAt: contests.endAt,
      division: contests.division,
      format: contests.format,
      teamSize: contests.teamSize,
      isOfficial: contests.isOfficial,
      seriesId: contests.seriesId,
      feeStatus: contests.feeStatus,
      freezeMinutes: contests.freezeMinutes,
      participantCount: participantCountSql(),
      problemCount: problemCountSql(),
      registered: registeredContestSql(input.userId),
    })
    .from(contests)
    .where(where)
    .orderBy(
      sql`case when ${contests.endAt} > now() then 0 else 1 end`,
      sql`case when ${contests.endAt} > now() then ${contests.startAt} end asc nulls last`,
      sql`case when ${contests.endAt} <= now() then ${contests.startAt} end desc nulls last`,
    )
    .limit(input.page.pageSize)
    .offset(toOffset(input.page));

  const sponsors = await loadTopSponsors(rows.map((row) => row.id));

  return {
    total: Number(totalRow?.value ?? 0),
    items: rows.map((row) => ({
      id: row.id,
      slug: row.slug,
      title: row.title,
      description: row.description,
      bannerUrl: row.bannerUrl,
      startAt: row.startAt.toISOString(),
      endAt: row.endAt.toISOString(),
      status: contestStatus(row.startAt, row.endAt, now),
      division: row.division,
      format: row.format,
      teamSize: row.teamSize,
      isOfficial: row.isOfficial,
      seriesId: row.seriesId,
      feeStatus: row.feeStatus,
      sponsor: sponsors.get(row.id) ?? null,
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
    const crew = userId ? await isContestStaff(contest.id, userId) : null;
    if (!crew) return null;
  }

  const status = contestStatus(contest.startAt, contest.endAt, now);
  // Ordered, best-effort fallback for worker downtime. The worker sweep stays
  // primary; this only ever finalises the earliest due contest.
  let ratedAt: Date | null = contest.ratedAt;
  if (status === "ENDED") {
    await maybeFinalizeRatingSweep();
    // Always refresh: the fallback may have finalised this contest on another
    // concurrent request even when the first read was already stale.
    const [fresh] = await db
      .select({ ratedAt: contests.ratedAt })
      .from(contests)
      .where(eq(contests.id, contest.id))
      .limit(1);
    ratedAt = fresh?.ratedAt ?? null;
  }

  const [registration, participantRow, viewerRow, teamState, crew, sponsors] =
    await Promise.all([
      userId
        ? db
            .select({ contestId: contestRegistrations.contestId })
            .from(contestRegistrations)
            .where(
              and(
                eq(contestRegistrations.contestId, contest.id),
                eq(contestRegistrations.userId, userId),
              ),
            )
            .limit(1)
            .then((result) => result[0])
        : Promise.resolve(undefined),
      db
        .select({ value: count() })
        .from(contestRegistrations)
        .where(eq(contestRegistrations.contestId, contest.id))
        .then((result) => result[0]),
      userId
        ? db
            .select({ username: users.username, displayName: users.displayName })
            .from(users)
            .where(eq(users.id, userId))
            .limit(1)
            .then((result) => result[0])
        : Promise.resolve(undefined),
      getContestTeamState(contest.id, userId),
      crewStatusFor(contest.id, userId),
      listApprovedContestSponsors(contest.id),
    ]);

  const registered = Boolean(registration) || Boolean(teamState.team);
  const isCrew = crew ? isActiveContestStaff(crew.status) : false;

  const problemRows = await db
    .select({
      id: problems.id,
      label: contestProblems.label,
      slug: problems.slug,
      title: problems.title,
      difficulty: problems.difficulty,
      points: problems.points,
    })
    .from(contestProblems)
    .innerJoin(problems, eq(problems.id, contestProblems.problemId))
    .where(eq(contestProblems.contestId, contest.id))
    .orderBy(asc(contestProblems.position));

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

  const canRegister =
    Boolean(userId) &&
    !isCrew &&
    status !== "ENDED" &&
    !registered &&
    contest.format === "SINGLE";
  const watermark =
    status === "RUNNING" && registered && viewerRow
      ? contestIntegrityWatermark({ viewer: viewerRow, contest })
      : null;

  return {
    id: contest.id,
    slug: contest.slug,
    title: contest.title,
    description: contest.description,
    bannerUrl: contest.bannerUrl,
    startAt: contest.startAt.toISOString(),
    endAt: contest.endAt.toISOString(),
    status,
    division: contest.division,
    format: contest.format,
    teamSize: contest.teamSize,
    isOfficial: contest.isOfficial,
    seriesId: contest.seriesId,
    feeStatus: contest.feeStatus,
    sponsor: sponsors[0] ?? null,
    freezeMinutes: contest.freezeMinutes,
    participantCount: Number(participantRow?.value ?? 0),
    problemCount: problemRows.length,
    registered,
    canRegister,
    registrationCount: Number(participantRow?.value ?? 0),
    teamCount: teamState.teamCount,
    sponsors,
    viewerTeam: teamState.team,
    incomingTeamInvite: teamState.incomingInvite,
    canCreateTeam: teamState.canCreate,
    canJoinTeam: teamState.canJoin,
    eligibility: nullableText(contest.eligibility),
    rules: nullableText(contest.rules),
    prizes: nullableText(contest.prizes),
    editorialLocked: status === "RUNNING",
    integrityWatermark: watermark,
    viewerStaffRole: crew?.role ?? null,
    viewerStaffStatus: crew?.status ?? null,
    ratingFinalizedAt: ratedAt?.toISOString() ?? null,
    ratingReviewEndsAt: ratingReviewEndsAtIso(contest.endAt),
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
  if (contest.format === "GROUP") {
    throw errors.conflict(
      "Register a team for this team contest. Open the contest page to create or join a team.",
    );
  }
  const crew = await crewStatusFor(contest.id, userId);
  if (crew && isActiveContestStaff(crew.status)) {
    throw errors.forbidden("Contest crew cannot compete in their own contest.");
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

export { getScoreboard } from "./contest-scoreboard";
