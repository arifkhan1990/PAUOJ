import { randomBytes } from "node:crypto";
import { and, asc, count, eq, inArray } from "drizzle-orm";
import { errors } from "@/server/api/errors";
import { getDb } from "@/server/db";
import type { Database } from "@/server/db";
import {
  contestRegistrations,
  contestTeamMembers,
  contestTeams,
  contests,
  users,
} from "@/server/db/schema";
import {
  CONTEST_INVITE_CODE_LENGTH,
  encodeContestInviteCode,
} from "@/lib/contest-invites";
import type {
  ContestTeamInviteView,
  ContestTeamMemberView,
  ContestTeamStatus,
  ContestTeamView,
} from "@/lib/contest-ops";
import { loadTeamInvites } from "./contest-team-invite-query";
import { LIVE_TEAM_STATUSES } from "./contest-team-status";

type Transaction = Parameters<Parameters<Database["transaction"]>[0]>[0];
type Executor = Database | Transaction;

export { LIVE_TEAM_STATUSES } from "./contest-team-status";

function teamView(
  team: {
    id: string;
    name: string;
    captainId: string;
    status: ContestTeamStatus;
    maxMembers: number;
    inviteCode: string;
  },
  members: ContestTeamMemberView[],
  pendingInvites: ContestTeamInviteView[],
  viewerId: string | null,
): ContestTeamView {
  const isViewerMember = viewerId
    ? members.some((member) => member.userId === viewerId)
    : false;
  return {
    id: team.id,
    name: team.name,
    captainId: team.captainId,
    status: team.status,
    maxMembers: team.maxMembers,
    inviteCode: isViewerMember ? team.inviteCode : null,
    members,
    pendingInvites,
    isViewerCaptain: Boolean(viewerId) && team.captainId === viewerId,
    isViewerMember,
  };
}

export async function loadTeamView(
  teamId: string,
  viewerId: string | null,
  executor: Executor = getDb(),
): Promise<ContestTeamView | null> {
  const [team] = await executor
    .select({
      id: contestTeams.id,
      name: contestTeams.name,
      captainId: contestTeams.captainId,
      status: contestTeams.status,
      maxMembers: contestTeams.maxMembers,
      inviteCode: contestTeams.inviteCode,
    })
    .from(contestTeams)
    .where(eq(contestTeams.id, teamId))
    .limit(1);
  if (!team) return null;

  const rows = await executor
    .select({
      userId: contestTeamMembers.userId,
      username: users.username,
      displayName: users.displayName,
      role: contestTeamMembers.role,
      joinedAt: contestTeamMembers.joinedAt,
    })
    .from(contestTeamMembers)
    .innerJoin(users, eq(users.id, contestTeamMembers.userId))
    .where(eq(contestTeamMembers.teamId, teamId))
    .orderBy(asc(contestTeamMembers.joinedAt), asc(users.username));

  const members: ContestTeamMemberView[] = rows.map((row) => ({
    userId: row.userId,
    username: row.username,
    displayName: row.displayName,
    role: row.role === "CAPTAIN" ? "CAPTAIN" : "MEMBER",
    joinedAt: row.joinedAt.toISOString(),
  }));
  const pendingInvites = await loadTeamInvites(teamId, viewerId);
  return teamView(team, members, pendingInvites, viewerId);
}

/** Teams in the contest plus their roster size, one query for both counts. */
export async function loadLiveTeams(contestId: string) {
  return getDb()
    .select({
      id: contestTeams.id,
      maxMembers: contestTeams.maxMembers,
      members: count(contestTeamMembers.userId),
    })
    .from(contestTeams)
    .leftJoin(
      contestTeamMembers,
      eq(contestTeamMembers.teamId, contestTeams.id),
    )
    .where(
      and(
        eq(contestTeams.contestId, contestId),
        inArray(contestTeams.status, LIVE_TEAM_STATUSES),
      ),
    )
    .groupBy(contestTeams.id, contestTeams.maxMembers);
}

export async function loadGroupContest(slug: string) {
  const [contest] = await getDb()
    .select({
      id: contests.id,
      slug: contests.slug,
      title: contests.title,
      format: contests.format,
      teamSize: contests.teamSize,
      startAt: contests.startAt,
    })
    .from(contests)
    .where(eq(contests.slug, slug))
    .limit(1);
  if (!contest) throw errors.notFound("Contest not found.");
  if (contest.format !== "GROUP") {
    throw errors.validation("This contest is a solo contest; it has no teams.");
  }
  return contest;
}

export function assertTeamsOpen(startAt: Date): void {
  if (startAt.getTime() <= Date.now()) {
    throw errors.conflict("Teams are locked once the contest starts.");
  }
}

export async function reserveInviteCode(tx: Transaction): Promise<string> {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const code = encodeContestInviteCode(
      randomBytes(CONTEST_INVITE_CODE_LENGTH),
    );
    const [existing] = await tx
      .select({ id: contestTeams.id })
      .from(contestTeams)
      .where(eq(contestTeams.inviteCode, code))
      .limit(1);
    if (!existing) return code;
  }
  throw errors.conflict("Could not allocate a team invite code. Try again.");
}

export async function findMembership(
  executor: Executor,
  contestId: string,
  userId: string,
): Promise<{ teamId: string } | null> {
  const [row] = await executor
    .select({ teamId: contestTeamMembers.teamId })
    .from(contestTeamMembers)
    .innerJoin(contestTeams, eq(contestTeams.id, contestTeamMembers.teamId))
    .where(
      and(
        eq(contestTeamMembers.userId, userId),
        eq(contestTeams.contestId, contestId),
      ),
    )
    .limit(1);
  return row ?? null;
}

/** Upserts the contest registration so scoreboards see the team entry. */
export async function registerTeamMember(
  executor: Executor,
  contestId: string,
  userId: string,
  teamId: string,
): Promise<void> {
  await executor
    .insert(contestRegistrations)
    .values({ contestId, userId, teamId })
    .onConflictDoUpdate({
      target: [contestRegistrations.contestId, contestRegistrations.userId],
      set: { teamId },
    });
}
