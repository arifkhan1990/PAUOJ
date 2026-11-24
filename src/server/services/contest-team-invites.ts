import { and, count, eq } from "drizzle-orm";
import { errors } from "@/server/api/errors";
import { getDb } from "@/server/db";
import {
  contestRegistrations,
  contestTeamInvites,
  contestTeamMembers,
  contestTeams,
  users,
} from "@/server/db/schema";
import type { ContestTeamInviteView } from "@/lib/contest-ops";
import { isUniqueViolation } from "@/lib/db-errors";
import { isContestCrewBlocked } from "./contest-crew";
import { loadTeamInviteView } from "./contest-team-invite-query";
import {
  LIVE_TEAM_STATUSES,
  assertTeamsOpen,
  findMembership,
  loadGroupContest,
} from "./contest-team-shared";
import { notifyUser } from "./notifications";

export { loadTeamInvites } from "./contest-team-invite-query";

const CAPTAIN_ONLY = "Only the team captain can invite coders.";

export async function inviteContestTeamMember(
  slug: string,
  actorId: string,
  username: string,
): Promise<ContestTeamInviteView> {
  const contest = await loadGroupContest(slug);
  assertTeamsOpen(contest.startAt);

  const lookup = username.trim().toLowerCase();
  let invite: {
    inviteId: string;
    teamName: string;
    targetId: string;
    inviterName: string;
  };
  try {
    invite = await getDb().transaction(async (tx) => {
      const membership = await findMembership(tx, contest.id, actorId);
      if (!membership) throw errors.forbidden(CAPTAIN_ONLY);

      // Team row lock serialises invites, accepts and joins for this team, so
      // the roster and duplicate checks below cannot race. Authorization runs
      // before the username lookup so non-captains cannot probe accounts.
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
        .where(eq(contestTeams.id, membership.teamId))
        .for("update");
      if (!team || team.contestId !== contest.id) {
        throw errors.notFound("Team not found.");
      }
      if (team.captainId !== actorId) throw errors.forbidden(CAPTAIN_ONLY);
      if (!LIVE_TEAM_STATUSES.includes(team.status)) {
        throw errors.conflict("Your team is no longer active.");
      }

      const [roster] = await tx
        .select({ value: count() })
        .from(contestTeamMembers)
        .where(eq(contestTeamMembers.teamId, team.id));
      if (Number(roster?.value ?? 0) >= team.maxMembers) {
        throw errors.conflict("Your team is already full.");
      }

      const [target] = await tx
        .select({
          id: users.id,
          displayName: users.displayName,
          isBanned: users.isBanned,
        })
        .from(users)
        .where(eq(users.username, lookup))
        .limit(1);
      if (!target || target.isBanned) {
        throw errors.notFound("No coder uses that username.");
      }
      if (target.id === actorId) {
        throw errors.validation("You cannot invite yourself.");
      }

      if (await isContestCrewBlocked(contest.id, target.id, tx)) {
        throw errors.forbidden("Contest crew cannot compete in this contest.");
      }

      const targetMembership = await findMembership(tx, contest.id, target.id);
      if (targetMembership) {
        throw errors.conflict(
          "That coder is already on a team in this contest.",
        );
      }
      const [registration] = await tx
        .select({ userId: contestRegistrations.userId })
        .from(contestRegistrations)
        .where(
          and(
            eq(contestRegistrations.contestId, contest.id),
            eq(contestRegistrations.userId, target.id),
          ),
        )
        .limit(1);
      if (registration) {
        throw errors.conflict(
          "That coder is already registered for this contest.",
        );
      }

      const [existing] = await tx
        .select({
          id: contestTeamInvites.id,
          status: contestTeamInvites.status,
        })
        .from(contestTeamInvites)
        .where(
          and(
            eq(contestTeamInvites.teamId, team.id),
            eq(contestTeamInvites.invitedUserId, target.id),
          ),
        )
        .limit(1);
      const now = new Date();
      let inviteId: string;

      if (existing) {
        if (existing.status === "PENDING") {
          throw errors.conflict(
            "That coder already has a pending invite to your team.",
          );
        }
        // A declined/cancelled invite can be re-sent; an ACCEPTED row whose
        // member later left is stale and may be re-sent too.
        const [updated] = await tx
          .update(contestTeamInvites)
          .set({
            status: "PENDING",
            invitedById: actorId,
            respondedAt: null,
            createdAt: now,
            updatedAt: now,
          })
          .where(eq(contestTeamInvites.id, existing.id))
          .returning({ id: contestTeamInvites.id });
        if (!updated) throw errors.conflict("Could not send the invite.");
        inviteId = updated.id;
      } else {
        const [created] = await tx
          .insert(contestTeamInvites)
          .values({
            contestId: contest.id,
            teamId: team.id,
            invitedUserId: target.id,
            invitedById: actorId,
            status: "PENDING",
          })
          .returning({ id: contestTeamInvites.id });
        if (!created) throw errors.conflict("Could not send the invite.");
        inviteId = created.id;
      }

      const [actor] = await tx
        .select({ displayName: users.displayName })
        .from(users)
        .where(eq(users.id, actorId))
        .limit(1);

      return {
        inviteId,
        teamName: team.name,
        targetId: target.id,
        inviterName: actor?.displayName ?? "Your captain",
      };
    });
  } catch (error) {
    if (isUniqueViolation(error)) {
      throw errors.conflict(
        "That coder already has a pending invite to your team.",
      );
    }
    throw error;
  }

  await notifyUser({
    userId: invite.targetId,
    type: "SYSTEM",
    title: `Team invite: ${invite.teamName}`,
    body: `${invite.inviterName} invited you to join "${invite.teamName}" in "${contest.title}". Accept or decline from the contest page.`,
    href: `/contests/${contest.slug}`,
    dedupeKey: `contest-team-invite:${invite.inviteId}:${Date.now()}`,
  });

  const view = await loadTeamInviteView(invite.inviteId);
  if (!view) throw errors.notFound("Invite not found.");
  return view;
}

export {
  cancelContestTeamInvite,
  loadIncomingTeamInvite,
  respondContestTeamInvite,
} from "./contest-team-invite-response";
