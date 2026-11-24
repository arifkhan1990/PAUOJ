import { and, asc, eq, gt, inArray, lte } from "drizzle-orm";
import { errors } from "@/server/api/errors";
import { getDb } from "@/server/db";
import {
  contestProblems,
  contestRegistrations,
  contestTeamMembers,
  contestTeams,
  contests,
} from "@/server/db/schema";
import type { ContestStaffRole, ContestStaffStatus } from "@/lib/contest-ops";
import { contestStatus } from "@/lib/contests";
import type { ActiveContestContext } from "./contest-queries";
import { isContestStaff, implicitContestCrewRole } from "./contest-staff";

const ACTIVE_STAFF_STATUSES: ContestStaffStatus[] = ["INVITED", "ACCEPTED"];

export function isActiveContestStaff(status: ContestStaffStatus): boolean {
  return ACTIVE_STAFF_STATUSES.includes(status);
}

/**
 * Per-view watermark for the contest integrity shield. Screenshots stay
 * traceable without exposing email or IP. Never include those fields here.
 */
export function contestIntegrityWatermark(input: {
  viewer: { username: string; displayName: string };
  contest: { slug: string; startAt: Date };
}): string {
  const date = input.contest.startAt.toISOString().slice(0, 10);
  return `${input.viewer.displayName} (@${input.viewer.username}) · ${input.contest.slug} · ${date}`;
}

export async function crewStatusFor(
  contestId: string,
  userId: string | null,
): Promise<{ role: ContestStaffRole; status: ContestStaffStatus } | null> {
  if (!userId) return null;
  const staff = await isContestStaff(contestId, userId);
  if (staff) return staff;
  const implicit = await implicitContestCrewRole(contestId, userId);
  return implicit ? { role: implicit, status: "ACCEPTED" } : null;
}

export async function isRegisteredParticipant(
  contestId: string,
  userId: string,
): Promise<boolean> {
  const db = getDb();
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
  if (registration) return true;
  const [member] = await db
    .select({ teamId: contestTeamMembers.teamId })
    .from(contestTeamMembers)
    .innerJoin(contestTeams, eq(contestTeams.id, contestTeamMembers.teamId))
    .where(
      and(
        eq(contestTeams.contestId, contestId),
        eq(contestTeamMembers.userId, userId),
      ),
    )
    .limit(1);
  return Boolean(member);
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
    const contestIds = rows.map((row) => row.contestId);
    const participation = await db
      .select({ contestId: contestRegistrations.contestId })
      .from(contestRegistrations)
      .where(
        and(
          eq(contestRegistrations.userId, userId),
          inArray(contestRegistrations.contestId, contestIds),
        ),
      );
    const teamRows = await db
      .select({ contestId: contestTeams.contestId })
      .from(contestTeamMembers)
      .innerJoin(contestTeams, eq(contestTeams.id, contestTeamMembers.teamId))
      .where(
        and(
          eq(contestTeamMembers.userId, userId),
          inArray(contestTeams.contestId, contestIds),
        ),
      );
    const registered = new Set([
      ...participation.map((row) => row.contestId),
      ...teamRows.map((row) => row.contestId),
    ]);
    const active = rows.find((row) => registered.has(row.contestId));
    if (active) {
      return { active, restricted: false, blockingContest: null };
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

  const crew = await crewStatusFor(contestId, userId);
  if (crew && isActiveContestStaff(crew.status)) {
    throw errors.forbidden("Contest crew cannot submit to their own contest.");
  }
  if (!(await isRegisteredParticipant(contestId, userId))) {
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
