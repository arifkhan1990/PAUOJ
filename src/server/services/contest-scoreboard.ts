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
import type { ContestScoreboard } from "@/lib/types";
import { contestStatus } from "@/lib/contests";
import { ratingReviewEndsAtIso } from "@/lib/contest-rating";
import { maybeFinalizeRatingSweep } from "./rating-sweep";
import {
  computeScoreboard,
  type ScoringParticipant,
  type ScoringTeam,
} from "@/server/contests/scoring";

type ParticipantRow = {
  userId: string;
  username: string;
  displayName: string;
  avatarPreset: string | null;
  avatarImageUpdatedAt: string | null;
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

export async function getScoreboard(
  slug: string,
  isAdmin: boolean,
): Promise<ContestScoreboard> {
  const db = getDb();
  const now = new Date();
  const rows = await db
    .select()
    .from(contests)
    .where(eq(contests.slug, slug))
    .limit(1);
  const contest = rows[0];
  if (!contest || (!contest.isPublic && !isAdmin)) {
    throw errors.notFound("Contest not found.");
  }
  const status = contestStatus(contest.startAt, contest.endAt, now);
  if (status === "UPCOMING" && !isAdmin) {
    throw errors.forbidden(
      "The scoreboard is not available before the contest starts.",
    );
  }
  // Ordered, best-effort fallback for worker downtime; the worker is primary.
  let ratedAt: Date | null = contest.ratedAt;
  if (status === "ENDED") {
    await maybeFinalizeRatingSweep();
    const [fresh] = await db
      .select({ ratedAt: contests.ratedAt })
      .from(contests)
      .where(eq(contests.id, contest.id))
      .limit(1);
    ratedAt = fresh?.ratedAt ?? null;
  }

  const problemRows = await db
    .select({
      id: problems.id,
      label: contestProblems.label,
    })
    .from(contestProblems)
    .innerJoin(problems, eq(problems.id, contestProblems.problemId))
    .where(eq(contestProblems.contestId, contest.id))
    .orderBy(asc(contestProblems.position));

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
  const submissionConditions = [
    eq(submissions.contestId, contest.id),
    isNull(submissions.virtualContestId),
  ];
  if (frozen && freezeAt) {
    submissionConditions.push(lt(submissions.createdAt, freezeAt));
  }
  const submissionRows = await db
    .select({
      userId: submissions.userId,
      problemId: submissions.problemId,
      status: submissions.status,
      createdAt: submissions.createdAt,
    })
    .from(submissions)
    .where(and(...submissionConditions))
    // Stable input for same-timestamp runs and first-blood attribution.
    .orderBy(asc(submissions.createdAt), asc(submissions.id));

  const scoreboard = computeScoreboard({
    startAt: contest.startAt,
    problems: problemRows,
    participants: teamBoard ? teamBoard.participants : participantRows,
    submissions: submissionRows,
    teams: teamBoard?.teams,
    mode: teamBoard ? "TEAM" : "INDIVIDUAL",
  });

  return {
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
    rows: scoreboard,
  };
}
