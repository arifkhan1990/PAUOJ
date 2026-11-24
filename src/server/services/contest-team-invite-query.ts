import { and, asc, desc, eq, inArray } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { getDb } from "@/server/db";
import { contestTeamInvites, contestTeams, users } from "@/server/db/schema";
import type {
  ContestTeamInviteStatus,
  ContestTeamInviteView,
} from "@/lib/contest-ops";
import { LIVE_TEAM_STATUSES } from "./contest-team-status";

const inviterUser = alias(users, "team_invite_inviter");
const invitedUser = alias(users, "team_invite_invited");

export type ContestTeamInviteRow = {
  id: string;
  contestId: string;
  teamId: string;
  teamName: string;
  status: ContestTeamInviteStatus;
  invitedById: string;
  invitedByUsername: string;
  invitedByDisplayName: string;
  invitedUserId: string;
  invitedUsername: string;
  invitedDisplayName: string;
  createdAt: Date;
  respondedAt: Date | null;
};

const inviteColumns = {
  id: contestTeamInvites.id,
  contestId: contestTeamInvites.contestId,
  teamId: contestTeamInvites.teamId,
  teamName: contestTeams.name,
  status: contestTeamInvites.status,
  invitedById: contestTeamInvites.invitedById,
  invitedByUsername: inviterUser.username,
  invitedByDisplayName: inviterUser.displayName,
  invitedUserId: contestTeamInvites.invitedUserId,
  invitedUsername: invitedUser.username,
  invitedDisplayName: invitedUser.displayName,
  createdAt: contestTeamInvites.createdAt,
  respondedAt: contestTeamInvites.respondedAt,
};

function inviteQuery() {
  return getDb()
    .select(inviteColumns)
    .from(contestTeamInvites)
    .innerJoin(contestTeams, eq(contestTeams.id, contestTeamInvites.teamId))
    .innerJoin(inviterUser, eq(inviterUser.id, contestTeamInvites.invitedById))
    .innerJoin(
      invitedUser,
      eq(invitedUser.id, contestTeamInvites.invitedUserId),
    );
}

/** Public invite payload: usernames and display names only, never emails. */
export function mapContestTeamInvite(
  row: ContestTeamInviteRow,
): ContestTeamInviteView {
  return {
    id: row.id,
    contestId: row.contestId,
    teamId: row.teamId,
    teamName: row.teamName,
    status: row.status,
    invitedBy: {
      userId: row.invitedById,
      username: row.invitedByUsername,
      displayName: row.invitedByDisplayName,
    },
    invitedUser: {
      userId: row.invitedUserId,
      username: row.invitedUsername,
      displayName: row.invitedDisplayName,
    },
    createdAt: row.createdAt.toISOString(),
    respondedAt: row.respondedAt?.toISOString() ?? null,
  };
}

export async function loadTeamInviteView(
  inviteId: string,
): Promise<ContestTeamInviteView | null> {
  const rows = await inviteQuery()
    .where(eq(contestTeamInvites.id, inviteId))
    .limit(1);
  const row = rows[0];
  return row ? mapContestTeamInvite(row) : null;
}

/** Pending invites for a team, newest first. Callers gate by captain. */
export async function loadPendingTeamInvites(
  teamId: string,
): Promise<ContestTeamInviteView[]> {
  const rows = await inviteQuery()
    .where(
      and(
        eq(contestTeamInvites.teamId, teamId),
        eq(contestTeamInvites.status, "PENDING"),
      ),
    )
    .orderBy(asc(contestTeamInvites.createdAt), asc(invitedUser.username));
  return rows.map(mapContestTeamInvite);
}

/** Pending invites are visible to the team captain only. */
export async function loadTeamInvites(
  teamId: string,
  viewerId: string | null,
): Promise<ContestTeamInviteView[]> {
  if (!viewerId) return [];
  const [team] = await getDb()
    .select({ captainId: contestTeams.captainId })
    .from(contestTeams)
    .where(eq(contestTeams.id, teamId))
    .limit(1);
  if (!team || team.captainId !== viewerId) return [];
  return loadPendingTeamInvites(teamId);
}

/**
 * The newest pending invite addressed to this user in the contest, ignoring
 * invites from teams that are no longer active. Membership is checked by the
 * caller (`loadIncomingTeamInvite`).
 */
export async function findIncomingTeamInvite(
  contestId: string,
  userId: string,
): Promise<ContestTeamInviteView | null> {
  const rows = await inviteQuery()
    .where(
      and(
        eq(contestTeamInvites.contestId, contestId),
        eq(contestTeamInvites.invitedUserId, userId),
        eq(contestTeamInvites.status, "PENDING"),
        inArray(contestTeams.status, LIVE_TEAM_STATUSES),
      ),
    )
    .orderBy(
      desc(contestTeamInvites.createdAt),
      desc(contestTeamInvites.id),
    )
    .limit(1);
  const row = rows[0];
  return row ? mapContestTeamInvite(row) : null;
}
