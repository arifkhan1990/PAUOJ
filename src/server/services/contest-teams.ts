import { and, asc, count, eq, sql } from "drizzle-orm";
import { errors } from "@/server/api/errors";
import { getDb } from "@/server/db";
import {
  contestRegistrations,
  contestTeamMembers,
  contestTeams,
  contests,
} from "@/server/db/schema";
import { isUniqueViolation } from "@/lib/db-errors";
import {
  isValidContestInviteCode,
  normalizeContestInviteCode,
} from "@/lib/contest-invites";
import type { ContestTeamInviteView, ContestTeamView } from "@/lib/contest-ops";
import { isContestCrewBlocked } from "./contest-crew";
import { notifyContestRegistrationSafe } from "./contest-notifications";
import { loadIncomingTeamInvite } from "./contest-team-invites";
import {
  LIVE_TEAM_STATUSES,
  assertTeamsOpen,
  findMembership,
  loadGroupContest,
  loadLiveTeams,
  loadTeamView,
  registerTeamMember,
  reserveInviteCode,
} from "./contest-team-shared";

export async function getContestTeamState(
  contestId: string,
  userId: string | null,
): Promise<{
  team: ContestTeamView | null;
  teamCount: number;
  canCreate: boolean;
  canJoin: boolean;
  incomingInvite: ContestTeamInviteView | null;
}> {
  const [contest] = await getDb()
    .select({
      id: contests.id,
      format: contests.format,
      startAt: contests.startAt,
    })
    .from(contests)
    .where(eq(contests.id, contestId))
    .limit(1);
  if (!contest || contest.format !== "GROUP") {
    return {
      team: null,
      teamCount: 0,
      canCreate: false,
      canJoin: false,
      incomingInvite: null,
    };
  }

  const liveTeams = await loadLiveTeams(contestId);
  const teamCount = liveTeams.length;
  const hasOpenTeam = liveTeams.some(
    (row) => Number(row.members) < row.maxMembers,
  );
  if (!userId) {
    return {
      team: null,
      teamCount,
      canCreate: false,
      canJoin: false,
      incomingInvite: null,
    };
  }

  const membership = await findMembership(getDb(), contestId, userId);
  const [team, incomingInvite] = await Promise.all([
    membership ? loadTeamView(membership.teamId, userId) : Promise.resolve(null),
    membership
      ? Promise.resolve(null)
      : loadIncomingTeamInvite(contestId, userId),
  ]);
  const teamsOpen = contest.startAt.getTime() > Date.now();
  const crewBlocked = await isContestCrewBlocked(contestId, userId);

  return {
    team,
    teamCount,
    canCreate: !team && !crewBlocked && teamsOpen,
    canJoin: !team && !crewBlocked && teamsOpen && hasOpenTeam,
    incomingInvite,
  };
}

export async function createContestTeam(
  slug: string,
  userId: string,
  name: string,
): Promise<ContestTeamView> {
  const contest = await loadGroupContest(slug);
  assertTeamsOpen(contest.startAt);
  if (await isContestCrewBlocked(contest.id, userId)) {
    throw errors.forbidden("Contest crew cannot compete in their own contest.");
  }

  const teamName = name.trim();
  const normalizedName = teamName.toLowerCase();
  let teamId: string;
  try {
    teamId = await getDb().transaction(async (tx) => {
      // Serialises same-name creates so the case-insensitive check is reliable.
      await tx.execute(
        sql`select pg_advisory_xact_lock(hashtext(${`contest-team:${contest.id}:${normalizedName}`}))`,
      );
      await tx.execute(
        sql`select pg_advisory_xact_lock(hashtext(${`contest-team-member:${contest.id}:${userId}`}))`,
      );
      const membership = await findMembership(tx, contest.id, userId);
      if (membership) {
        throw errors.conflict("You are already on a team in this contest.");
      }
      const [duplicate] = await tx
        .select({ id: contestTeams.id })
        .from(contestTeams)
        .where(
          and(
            eq(contestTeams.contestId, contest.id),
            sql`lower(${contestTeams.name}) = ${normalizedName}`,
          ),
        )
        .limit(1);
      if (duplicate) {
        throw errors.conflict("That team name is already taken in this contest.");
      }

      const inviteCode = await reserveInviteCode(tx);
      const [created] = await tx
        .insert(contestTeams)
        .values({
          contestId: contest.id,
          name: teamName,
          inviteCode,
          captainId: userId,
          maxMembers: contest.teamSize,
        })
        .returning({ id: contestTeams.id });
      if (!created) throw errors.conflict("Could not create the team.");

      await tx
        .insert(contestTeamMembers)
        .values({ teamId: created.id, userId, role: "CAPTAIN" });
      await registerTeamMember(tx, contest.id, userId, created.id);
      return created.id;
    });
  } catch (error) {
    if (isUniqueViolation(error)) {
      throw errors.conflict("That team name is already taken in this contest.");
    }
    throw error;
  }

  const view = await loadTeamView(teamId, userId);
  if (!view) throw errors.notFound("Team not found.");
  // Registration is committed now, so the confirmation cannot be rolled back
  // by a mail failure.
  await notifyContestRegistrationSafe(userId, contest);
  return view;
}

export async function joinContestTeam(
  slug: string,
  userId: string,
  inviteCode: string,
): Promise<ContestTeamView> {
  const contest = await loadGroupContest(slug);
  assertTeamsOpen(contest.startAt);
  if (await isContestCrewBlocked(contest.id, userId)) {
    throw errors.forbidden("Contest crew cannot compete in their own contest.");
  }

  const code = normalizeContestInviteCode(inviteCode);
  if (!isValidContestInviteCode(code)) {
    throw errors.validation("Enter the 8-character team invite code.");
  }

  let teamId: string;
  try {
    teamId = await getDb().transaction(async (tx) => {
      const [team] = await tx
        .select({
          id: contestTeams.id,
          contestId: contestTeams.contestId,
          status: contestTeams.status,
          maxMembers: contestTeams.maxMembers,
        })
        .from(contestTeams)
        .where(eq(contestTeams.inviteCode, code))
        .for("update");
      if (!team || team.contestId !== contest.id) {
        throw errors.notFound("No team matches that invite code.");
      }
      if (!LIVE_TEAM_STATUSES.includes(team.status)) {
        throw errors.conflict("That team is no longer active.");
      }

      await tx.execute(
        sql`select pg_advisory_xact_lock(hashtext(${`contest-team-member:${contest.id}:${userId}`}))`,
      );
      const membership = await findMembership(tx, contest.id, userId);
      if (membership) {
        if (membership.teamId === team.id) return team.id;
        throw errors.conflict("You are already on another team in this contest.");
      }

      const [roster] = await tx
        .select({ value: count() })
        .from(contestTeamMembers)
        .where(eq(contestTeamMembers.teamId, team.id));
      if (Number(roster?.value ?? 0) >= team.maxMembers) {
        throw errors.conflict("That team is already full.");
      }

      await tx
        .insert(contestTeamMembers)
        .values({ teamId: team.id, userId, role: "MEMBER" });
      await registerTeamMember(tx, contest.id, userId, team.id);
      return team.id;
    });
  } catch (error) {
    if (isUniqueViolation(error)) {
      throw errors.conflict("You are already on a team in this contest.");
    }
    throw error;
  }

  const view = await loadTeamView(teamId, userId);
  if (!view) throw errors.notFound("Team not found.");
  // Only the newly registered member is notified; others were told before.
  await notifyContestRegistrationSafe(userId, contest);
  return view;
}

export async function leaveContestTeam(
  slug: string,
  userId: string,
): Promise<void> {
  const contest = await loadGroupContest(slug);
  assertTeamsOpen(contest.startAt);

  await getDb().transaction(async (tx) => {
    const membership = await findMembership(tx, contest.id, userId);
    if (!membership) {
      throw errors.notFound("You are not on a team in this contest.");
    }
    const [team] = await tx
      .select({ id: contestTeams.id, captainId: contestTeams.captainId })
      .from(contestTeams)
      .where(eq(contestTeams.id, membership.teamId))
      .for("update");
    if (!team) throw errors.notFound("Team not found.");

    const [stillMember] = await tx
      .select({ teamId: contestTeamMembers.teamId })
      .from(contestTeamMembers)
      .where(
        and(
          eq(contestTeamMembers.teamId, team.id),
          eq(contestTeamMembers.userId, userId),
        ),
      )
      .limit(1);
    if (!stillMember) {
      throw errors.notFound("You are not on a team in this contest.");
    }

    await tx
      .delete(contestTeamMembers)
      .where(
        and(
          eq(contestTeamMembers.teamId, team.id),
          eq(contestTeamMembers.userId, userId),
        ),
      );
    await tx
      .delete(contestRegistrations)
      .where(
        and(
          eq(contestRegistrations.contestId, contest.id),
          eq(contestRegistrations.userId, userId),
        ),
      );

    const remaining = await tx
      .select({ userId: contestTeamMembers.userId })
      .from(contestTeamMembers)
      .where(eq(contestTeamMembers.teamId, team.id))
      .orderBy(
        asc(contestTeamMembers.joinedAt),
        asc(contestTeamMembers.userId),
      );
    if (remaining.length === 0) {
      await tx.delete(contestTeams).where(eq(contestTeams.id, team.id));
      return;
    }
    if (team.captainId === userId) {
      const nextCaptain = remaining[0];
      if (!nextCaptain) return;
      await tx
        .update(contestTeams)
        .set({ captainId: nextCaptain.userId, updatedAt: new Date() })
        .where(eq(contestTeams.id, team.id));
      await tx
        .update(contestTeamMembers)
        .set({ role: "CAPTAIN" })
        .where(
          and(
            eq(contestTeamMembers.teamId, team.id),
            eq(contestTeamMembers.userId, nextCaptain.userId),
          ),
        );
    }
  });
}
