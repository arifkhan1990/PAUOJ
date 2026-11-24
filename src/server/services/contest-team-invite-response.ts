import { and, count, eq, sql } from "drizzle-orm";
import { errors } from "@/server/api/errors";
import { getDb } from "@/server/db";
import {
  contestTeamInvites,
  contestTeamMembers,
  contestTeams,
} from "@/server/db/schema";
import type { ContestTeamInviteView } from "@/lib/contest-ops";
import { isContestCrewBlocked } from "./contest-crew";
import {
  findIncomingTeamInvite,
  loadTeamInviteView,
} from "./contest-team-invite-query";
import {
  LIVE_TEAM_STATUSES,
  assertTeamsOpen,
  findMembership,
  loadGroupContest,
  registerTeamMember,
} from "./contest-team-shared";
import { notifyUser } from "./notifications";

export async function respondContestTeamInvite(
  slug: string,
  actorId: string,
  inviteId: string,
  action: "ACCEPT" | "DECLINE",
): Promise<ContestTeamInviteView> {
  const contest = await loadGroupContest(slug);

  const outcome = await getDb().transaction(async (tx) => {
    const [invite] = await tx
      .select({
        id: contestTeamInvites.id,
        teamId: contestTeamInvites.teamId,
      })
      .from(contestTeamInvites)
      .where(
        and(
          eq(contestTeamInvites.id, inviteId),
          eq(contestTeamInvites.contestId, contest.id),
          eq(contestTeamInvites.invitedUserId, actorId),
        ),
      )
      .limit(1);
    if (!invite) throw errors.notFound("Invite not found.");
    assertTeamsOpen(contest.startAt);

    // Lock order is always team then invite (see inviteContestTeamMember).
    const [team] = await tx
      .select({
        id: contestTeams.id,
        contestId: contestTeams.contestId,
        name: contestTeams.name,
        captainId: contestTeams.captainId,
        status: contestTeams.status,
        maxMembers: contestTeams.maxMembers,
      })
      .from(contestTeams)
      .where(eq(contestTeams.id, invite.teamId))
      .for("update");
    if (!team || team.contestId !== contest.id) {
      throw errors.notFound("Invite not found.");
    }
    if (!LIVE_TEAM_STATUSES.includes(team.status)) {
      throw errors.conflict("That team is no longer active.");
    }

    const [locked] = await tx
      .select({ status: contestTeamInvites.status })
      .from(contestTeamInvites)
      .where(eq(contestTeamInvites.id, invite.id))
      .for("update");
    if (!locked) throw errors.notFound("Invite not found.");
    if (locked.status !== "PENDING") {
      throw errors.conflict("This invite is no longer pending.");
    }

    if (action === "ACCEPT") {
      // Team-row locks are per team, so two teams accepting the same coder at
      // once would both pass the membership check. This key serialises accepts
      // for one coder inside the contest.
      await tx.execute(
        sql`select pg_advisory_xact_lock(hashtext(${`contest-team-member:${contest.id}:${actorId}`}))`,
      );
      if (await isContestCrewBlocked(contest.id, actorId, tx)) {
        throw errors.forbidden("Contest crew cannot compete in this contest.");
      }
      const membership = await findMembership(tx, contest.id, actorId);
      if (membership) {
        if (membership.teamId === team.id) {
          throw errors.conflict("You are already on that team.");
        }
        throw errors.conflict(
          "You are already on another team in this contest.",
        );
      }

      const [roster] = await tx
        .select({ value: count() })
        .from(contestTeamMembers)
        .where(eq(contestTeamMembers.teamId, team.id));
      if (Number(roster?.value ?? 0) >= team.maxMembers) {
        throw errors.conflict("That team is already full.");
      }

      const [member] = await tx
        .insert(contestTeamMembers)
        .values({ teamId: team.id, userId: actorId, role: "MEMBER" })
        .onConflictDoNothing()
        .returning({ userId: contestTeamMembers.userId });
      if (!member) {
        throw errors.conflict("You are already on that team.");
      }
      await registerTeamMember(tx, contest.id, actorId, team.id);
    }

    const now = new Date();
    await tx
      .update(contestTeamInvites)
      .set({
        status: action === "ACCEPT" ? "ACCEPTED" : "DECLINED",
        respondedAt: now,
        updatedAt: now,
      })
      .where(eq(contestTeamInvites.id, invite.id));

    return {
      teamName: team.name,
      captainId: team.captainId,
      accepted: action === "ACCEPT",
    };
  });

  const view = await loadTeamInviteView(inviteId);
  if (!view) throw errors.notFound("Invite not found.");

  await notifyUser({
    userId: outcome.captainId,
    type: "SYSTEM",
    title: outcome.accepted ? "Team invite accepted" : "Team invite declined",
    body: outcome.accepted
      ? `${view.invitedUser.displayName} joined your team "${outcome.teamName}" for "${contest.title}".`
      : `${view.invitedUser.displayName} declined your invite to "${outcome.teamName}" for "${contest.title}".`,
    href: `/contests/${contest.slug}`,
    dedupeKey: `contest-team-invite:${inviteId}:${outcome.accepted ? "accepted" : "declined"}:${Date.now()}`,
  });

  return view;
}

export async function cancelContestTeamInvite(
  slug: string,
  actorId: string,
  inviteId: string,
): Promise<ContestTeamInviteView> {
  const contest = await loadGroupContest(slug);

  await getDb().transaction(async (tx) => {
    const [invite] = await tx
      .select({
        id: contestTeamInvites.id,
        teamId: contestTeamInvites.teamId,
      })
      .from(contestTeamInvites)
      .where(
        and(
          eq(contestTeamInvites.id, inviteId),
          eq(contestTeamInvites.contestId, contest.id),
        ),
      )
      .limit(1);
    if (!invite) throw errors.notFound("Invite not found.");

    // Same team-then-invite lock order as the other invite writers.
    const [team] = await tx
      .select({ captainId: contestTeams.captainId })
      .from(contestTeams)
      .where(eq(contestTeams.id, invite.teamId))
      .for("update");
    if (!team) throw errors.notFound("Invite not found.");
    if (team.captainId !== actorId) {
      throw errors.forbidden("Only the team captain can cancel invites.");
    }

    const [locked] = await tx
      .select({ status: contestTeamInvites.status })
      .from(contestTeamInvites)
      .where(eq(contestTeamInvites.id, invite.id))
      .for("update");
    if (!locked) throw errors.notFound("Invite not found.");
    if (locked.status !== "PENDING") {
      throw errors.conflict("This invite is no longer pending.");
    }

    const now = new Date();
    await tx
      .update(contestTeamInvites)
      .set({ status: "CANCELLED", respondedAt: now, updatedAt: now })
      .where(eq(contestTeamInvites.id, invite.id));
  });

  const view = await loadTeamInviteView(inviteId);
  if (!view) throw errors.notFound("Invite not found.");
  return view;
}

/** Latest pending invite for the viewer; null once they are on a team. */
export async function loadIncomingTeamInvite(
  contestId: string,
  userId: string,
): Promise<ContestTeamInviteView | null> {
  const membership = await findMembership(getDb(), contestId, userId);
  if (membership) return null;
  return findIncomingTeamInvite(contestId, userId);
}
