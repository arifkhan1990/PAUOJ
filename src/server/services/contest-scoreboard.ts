import { and, asc, eq, inArray, isNull, lt, notInArray } from "drizzle-orm";
import { errors } from "@/server/api/errors";
import { getDb } from "@/server/db";
import {
  contestProblems,
  contestRegistrations,
  contestTeamMembers,
  contestTeams,
  contests,
  problems,
  submissions,
  users,
} from "@/server/db/schema";
import type { ContestScoreboard, ScoreboardRow } from "@/lib/types";
import {
  SCOREBOARD_DEFAULT_PAGE_SIZE,
  SCOREBOARD_MAX_PAGE_SIZE,
  type ContestScoreboardPagination,
  type ContestStatus,
} from "@/lib/contest-detail-types";
import { contestStatus } from "@/lib/contests";
import { ratingReviewEndsAtIso } from "@/lib/contest-rating";
import { maybeFinalizeRatingSweep } from "./rating-sweep";
import {
  computeScoreboard,
  type ScoringParticipant,
  type ScoringTeam,
} from "@/server/contests/scoring";
import {
  computeScoreboardEtag,
  rememberScoreboardEtag,
} from "./scoreboard-etag";
import {
  createStandingsCache,
  createStandingsCacheStore,
  standingsCacheKey,
  standingsTtlMs,
  type StandingsCacheStore,
} from "./standings-cache";

type ParticipantRow = {
  userId: string;
  username: string;
  displayName: string;
  avatarPreset: string | null;
  avatarImageUpdatedAt: string | null;
};

type ContestRow = typeof contests.$inferSelect;

/** The full ranked board, cached whole and sliced per request. */
type ScoreboardSnapshot = {
  contest: ContestScoreboard["contest"];
  frozen: boolean;
  freezeAt: string | null;
  labels: string[];
  rows: ScoreboardRow[];
  /** Epoch ms when the snapshot finished loading. */
  generatedAt: number;
  /** Per-page ETags reused for the lifetime of this snapshot. */
  pageEtags: Map<string, string>;
};

export type ScoreboardPageOptions = {
  page?: number;
  pageSize?: number;
};

function toAvatarIso(value: Date | null): string | null {
  return value?.toISOString() ?? null;
}

async function loadParticipantRows(contestId: string): Promise<ParticipantRow[]> {
  const rows = await getDb()
    .select({
      userId: contestRegistrations.userId,
      username: users.username,
      displayName: users.displayName,
      avatarPreset: users.avatarPreset,
      avatarImageUpdatedAt: users.avatarImageUpdatedAt,
    })
    .from(contestRegistrations)
    .innerJoin(users, eq(users.id, contestRegistrations.userId))
    .where(eq(contestRegistrations.contestId, contestId));
  return rows.map((row) => ({
    ...row,
    avatarImageUpdatedAt: toAvatarIso(row.avatarImageUpdatedAt),
  }));
}

async function loadTeamBoard(
  contestId: string,
  registered: ParticipantRow[],
): Promise<{ teams: ScoringTeam[]; participants: ScoringParticipant[] }> {
  const db = getDb();
  const teamRows = await db
    .select({
      id: contestTeams.id,
      name: contestTeams.name,
      captainId: contestTeams.captainId,
    })
    .from(contestTeams)
    .where(
      and(
        eq(contestTeams.contestId, contestId),
        notInArray(contestTeams.status, ["WITHDRAWN", "DISQUALIFIED"]),
      ),
    )
    .orderBy(asc(contestTeams.createdAt));
  if (teamRows.length === 0) {
    return { teams: [], participants: [] };
  }

  const teamIds = teamRows.map((team) => team.id);
  const memberRows = await db
    .select({
      teamId: contestTeamMembers.teamId,
      userId: contestTeamMembers.userId,
      username: users.username,
      displayName: users.displayName,
      avatarPreset: users.avatarPreset,
      avatarImageUpdatedAt: users.avatarImageUpdatedAt,
    })
    .from(contestTeamMembers)
    .innerJoin(users, eq(users.id, contestTeamMembers.userId))
    .where(inArray(contestTeamMembers.teamId, teamIds))
    .orderBy(asc(contestTeamMembers.joinedAt));

  const registeredIds = new Set(registered.map((row) => row.userId));
  const membersByTeam = new Map<string, ScoringParticipant[]>();
  for (const member of memberRows) {
    if (!registeredIds.has(member.userId)) continue;
    const list = membersByTeam.get(member.teamId) ?? [];
    list.push({
      userId: member.userId,
      username: member.username,
      displayName: member.displayName,
      avatarPreset: member.avatarPreset,
      avatarImageUpdatedAt: toAvatarIso(member.avatarImageUpdatedAt),
    });
    membersByTeam.set(member.teamId, list);
  }

  const teams: ScoringTeam[] = [];
  for (const team of teamRows) {
    const members = membersByTeam.get(team.id);
    if (!members || members.length === 0) continue;
    teams.push({
      id: team.id,
      name: team.name,
      captainId: team.captainId,
      members: [...members].sort((left, right) => {
        if (left.userId === team.captainId) return -1;
        if (right.userId === team.captainId) return 1;
        return 0;
      }),
    });
  }

  return {
    teams,
    participants: teams.flatMap((team) => team.members),
  };
}

async function loadContest(
  slug: string,
  isAdmin: boolean,
  now: Date,
): Promise<{ contest: ContestRow; status: ContestStatus }> {
  const [contest] = await getDb()
    .select()
    .from(contests)
    .where(eq(contests.slug, slug))
    .limit(1);
  if (!contest || (!contest.isPublic && !isAdmin)) {
    throw errors.notFound("Contest not found.");
  }
  const status = contestStatus(contest.startAt, contest.endAt, now);
  if (status === "UPCOMING" && !isAdmin) {
    throw errors.forbidden(
      "The scoreboard is not available before the contest starts.",
    );
  }
  return { contest, status };
}

/** Ordered, best-effort fallback for worker downtime; the worker is primary. */
async function resolveRatedAt(
  contest: ContestRow,
  status: ContestStatus,
): Promise<Date | null> {
  if (status !== "ENDED") return contest.ratedAt;
  await maybeFinalizeRatingSweep();
  const [fresh] = await getDb()
    .select({ ratedAt: contests.ratedAt })
    .from(contests)
    .where(eq(contests.id, contest.id))
    .limit(1);
  return fresh?.ratedAt ?? null;
}

async function loadProblemLabels(
  contestId: string,
): Promise<{ id: string; label: string }[]> {
  return getDb()
    .select({
      id: problems.id,
      label: contestProblems.label,
    })
    .from(contestProblems)
    .innerJoin(problems, eq(problems.id, contestProblems.problemId))
    .where(eq(contestProblems.contestId, contestId))
    .orderBy(asc(contestProblems.position));
}

type SubmissionRow = {
  userId: string;
  problemId: string;
  status: (typeof submissions.$inferSelect)["status"];
  createdAt: Date;
};

async function loadSubmissionRows(
  contestId: string,
  frozen: boolean,
  freezeAt: Date | null,
): Promise<SubmissionRow[]> {
  const conditions = [
    eq(submissions.contestId, contestId),
    isNull(submissions.virtualContestId),
  ];
  if (frozen && freezeAt) {
    conditions.push(lt(submissions.createdAt, freezeAt));
  }
  return getDb()
    .select({
      userId: submissions.userId,
      problemId: submissions.problemId,
      status: submissions.status,
      createdAt: submissions.createdAt,
    })
    .from(submissions)
    .where(and(...conditions))
    // Stable input for same-timestamp runs and first-blood attribution.
    .orderBy(asc(submissions.createdAt), asc(submissions.id));
}

async function loadFullScoreboard(
  slug: string,
  isAdmin: boolean,
): Promise<{ snapshot: ScoreboardSnapshot; status: ContestStatus }> {
  const now = new Date();
  const { contest, status } = await loadContest(slug, isAdmin, now);
  const ratedAt = await resolveRatedAt(contest, status);
  const problemRows = await loadProblemLabels(contest.id);
  const participantRows = await loadParticipantRows(contest.id);
  const teamBoard =
    contest.format === "GROUP"
      ? await loadTeamBoard(contest.id, participantRows)
      : null;

  const freezeAt =
    contest.freezeMinutes > 0
      ? new Date(contest.endAt.getTime() - contest.freezeMinutes * 60_000)
      : null;
  const frozen = Boolean(
    !isAdmin && status === "RUNNING" && freezeAt && now >= freezeAt,
  );
  const submissionRows = await loadSubmissionRows(
    contest.id,
    frozen,
    freezeAt,
  );

  const rows = computeScoreboard({
    startAt: contest.startAt,
    problems: problemRows,
    participants: teamBoard ? teamBoard.participants : participantRows,
    submissions: submissionRows,
    teams: teamBoard?.teams,
    mode: teamBoard ? "TEAM" : "INDIVIDUAL",
  });

  return {
    status,
    snapshot: {
      contest: {
        slug: contest.slug,
        title: contest.title,
        startAt: contest.startAt.toISOString(),
        endAt: contest.endAt.toISOString(),
        status,
        freezeMinutes: contest.freezeMinutes,
        format: contest.format,
        teamSize: contest.teamSize,
        ratingFinalizedAt: ratedAt?.toISOString() ?? null,
        ratingReviewEndsAt: ratingReviewEndsAtIso(contest.endAt),
      },
      frozen,
      freezeAt: freezeAt?.toISOString() ?? null,
      labels: problemRows.map((row) => row.label),
      rows,
      generatedAt: Date.now(),
      pageEtags: new Map(),
    },
  };
}

function normalizeInt(value: number | undefined, fallback: number): number {
  if (value === undefined || !Number.isFinite(value)) return fallback;
  return Math.trunc(value);
}

/**
 * Clamps the requested page into range. An empty board still reports one page
 * so clients can render "page 1 of 1" without special cases.
 */
export function resolveScoreboardPage(
  total: number,
  options: ScoreboardPageOptions = {},
): ContestScoreboardPagination {
  const ranked = Number.isFinite(total) && total > 0 ? Math.trunc(total) : 0;
  const pageSize = Math.min(
    SCOREBOARD_MAX_PAGE_SIZE,
    Math.max(1, normalizeInt(options.pageSize, SCOREBOARD_DEFAULT_PAGE_SIZE)),
  );
  const totalPages = Math.max(1, Math.ceil(ranked / pageSize));
  const page = Math.min(Math.max(1, normalizeInt(options.page, 1)), totalPages);
  return { page, pageSize, total: ranked, totalPages };
}

// Dev hot reload re-evaluates modules; keep one store per process.
const globalForStandings = globalThis as typeof globalThis & {
  __pauojStandingsCache?: StandingsCacheStore<ScoreboardSnapshot>;
};
const scoreboardCache = createStandingsCache<ScoreboardSnapshot>(
  (globalForStandings.__pauojStandingsCache ??=
    createStandingsCacheStore<ScoreboardSnapshot>()),
);

export async function getScoreboard(
  slug: string,
  isAdmin: boolean,
  options: ScoreboardPageOptions = {},
): Promise<ContestScoreboard> {
  const entry = await scoreboardCache.get(
    standingsCacheKey(slug, isAdmin),
    async () => {
      const { snapshot, status } = await loadFullScoreboard(slug, isAdmin);
      return { value: snapshot, ttlMs: standingsTtlMs(status) };
    },
  );

  const { rows, generatedAt, pageEtags, ...detail } = entry.value;
  const pagination = resolveScoreboardPage(rows.length, options);
  const start = (pagination.page - 1) * pagination.pageSize;
  const result: ContestScoreboard = {
    ...detail,
    generatedAt: new Date(generatedAt).toISOString(),
    pagination,
    rows: rows.slice(start, start + pagination.pageSize),
  };

  // Hash once per (snapshot, page); the route reuses it for 304 responses.
  const pageKey = `${pagination.page}:${pagination.pageSize}`;
  let etag = pageEtags.get(pageKey);
  if (!etag) {
    etag = computeScoreboardEtag(result);
    pageEtags.set(pageKey, etag);
  }
  rememberScoreboardEtag(result, etag);
  return result;
}
