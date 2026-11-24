import { and, asc, count, eq, inArray, ne, sql } from "drizzle-orm";
import { errors } from "@/server/api/errors";
import { getDb } from "@/server/db";
import { contestStaff, users } from "@/server/db/schema";
import { isUniqueViolation } from "@/lib/db-errors";
import type {
  ContestStaffRole,
  ContestStaffStatus,
  ContestStaffView,
} from "@/lib/contest-ops";
import type { ContestStaffInviteInput } from "@/lib/schemas/contest-ops";
import type { SafeUser } from "@/server/auth/session";
import { findUserByUsername } from "./auth";
import {
  ACTIVE_CONTEST_STAFF_STATUSES,
  assertCanManageCrew,
  loadContestSummary,
} from "./contest-crew";
import { notifyUser } from "./notifications";

export {
  implicitContestCrewRole,
  isContestCrewBlocked,
  isContestStaff,
} from "./contest-crew";
export {
  addContestStaffNote,
  decideContestCandidate,
  listContestCandidates,
  listContestStaffNotes,
  proposeContestCandidate,
} from "./contest-staff-workspace";

function roleRankSql() {
  return sql`case ${contestStaff.role}
    when 'DIRECTOR' then 0
    when 'SETTER' then 1
    when 'EDITORIAL' then 2
    when 'TESTER' then 3
    else 4
  end`;
}

function staffView(row: {
  id: string;
  userId: string;
  username: string;
  displayName: string;
  role: ContestStaffRole;
  status: ContestStaffStatus;
  createdAt: Date;
}): ContestStaffView {
  return {
    id: row.id,
    userId: row.userId,
    username: row.username,
    displayName: row.displayName,
    role: row.role,
    status: row.status,
    createdAt: row.createdAt.toISOString(),
  };
}

export async function listContestStaff(
  contestId: string,
): Promise<ContestStaffView[]> {
  const rows = await getDb()
    .select({
      id: contestStaff.id,
      userId: contestStaff.userId,
      username: users.username,
      displayName: users.displayName,
      role: contestStaff.role,
      status: contestStaff.status,
      createdAt: contestStaff.createdAt,
    })
    .from(contestStaff)
    .innerJoin(users, eq(users.id, contestStaff.userId))
    .where(eq(contestStaff.contestId, contestId))
    .orderBy(asc(roleRankSql()), asc(contestStaff.createdAt));
  return rows.map(staffView);
}

export async function addContestStaff(
  actor: SafeUser,
  contestId: string,
  input: ContestStaffInviteInput,
): Promise<ContestStaffView> {
  const contest = await loadContestSummary(contestId);
  await assertCanManageCrew(actor, contestId);

  const target = await findUserByUsername(input.username);
  if (!target) {
    throw errors.notFound("No coder uses that username.");
  }

  const db = getDb();
  const [existing] = await db
    .select({ id: contestStaff.id, status: contestStaff.status })
    .from(contestStaff)
    .where(
      and(
        eq(contestStaff.contestId, contestId),
        eq(contestStaff.userId, target.id),
      ),
    )
    .limit(1);
  if (existing && ACTIVE_CONTEST_STAFF_STATUSES.includes(existing.status)) {
    throw errors.conflict("That user is already on the contest crew.");
  }

  const now = new Date();
  let staffId: string;
  let createdAt: Date;
  try {
    if (existing) {
      const [updated] = await db
        .update(contestStaff)
        .set({
          role: input.role,
          status: "ACCEPTED",
          invitedById: actor.id,
          respondedAt: now,
          updatedAt: now,
        })
        .where(eq(contestStaff.id, existing.id))
        .returning({ id: contestStaff.id, createdAt: contestStaff.createdAt });
      if (!updated) throw errors.notFound("Crew member not found.");
      staffId = updated.id;
      createdAt = updated.createdAt;
    } else {
      const [created] = await db
        .insert(contestStaff)
        .values({
          contestId,
          userId: target.id,
          role: input.role,
          status: "ACCEPTED",
          invitedById: actor.id,
          respondedAt: now,
          updatedAt: now,
        })
        .returning({ id: contestStaff.id, createdAt: contestStaff.createdAt });
      if (!created) {
        throw errors.conflict("That user is already on the contest crew.");
      }
      staffId = created.id;
      createdAt = created.createdAt;
    }
  } catch (error) {
    if (isUniqueViolation(error)) {
      throw errors.conflict("That user is already on the contest crew.");
    }
    throw error;
  }

  await notifyUser({
    userId: target.id,
    type: "SYSTEM",
    title: "Contest crew access",
    body: `${actor.displayName} added you to the crew of "${contest.title}". You cannot compete in a contest you work on.`,
    href: `/contests/${contest.slug}`,
  });

  return {
    id: staffId,
    userId: target.id,
    username: target.username,
    displayName: target.displayName,
    role: input.role,
    status: "ACCEPTED",
    createdAt: createdAt.toISOString(),
  };
}

export async function removeContestStaff(
  actor: SafeUser,
  contestId: string,
  staffId: string,
): Promise<void> {
  const contest = await loadContestSummary(contestId);
  await assertCanManageCrew(actor, contestId);

  const db = getDb();
  const removed = await db.transaction(async (tx) => {
    const [row] = await tx
      .select({
        id: contestStaff.id,
        userId: contestStaff.userId,
        role: contestStaff.role,
        status: contestStaff.status,
      })
      .from(contestStaff)
      .where(
        and(eq(contestStaff.id, staffId), eq(contestStaff.contestId, contestId)),
      )
      .for("update");
    if (!row) throw errors.notFound("Crew member not found.");
    if (row.status === "REMOVED") return null;

    if (row.role === "DIRECTOR") {
      const [remaining] = await tx
        .select({ value: count() })
        .from(contestStaff)
        .where(
          and(
            eq(contestStaff.contestId, contestId),
            eq(contestStaff.role, "DIRECTOR"),
            inArray(contestStaff.status, ACTIVE_CONTEST_STAFF_STATUSES),
            ne(contestStaff.id, staffId),
          ),
        );
      if (Number(remaining?.value ?? 0) === 0) {
        throw errors.conflict(
          "A contest must keep at least one active director. Add another director first.",
        );
      }
    }

    await tx
      .update(contestStaff)
      .set({ status: "REMOVED", updatedAt: new Date() })
      .where(eq(contestStaff.id, staffId));
    return { userId: row.userId };
  });
  if (!removed) return;

  await notifyUser({
    userId: removed.userId,
    type: "SYSTEM",
    title: "Removed from contest crew",
    body: `${actor.displayName} removed you from the crew of "${contest.title}".`,
    href: `/contests/${contest.slug}`,
  });
}
