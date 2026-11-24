import { and, eq, inArray } from "drizzle-orm";
import { errors } from "@/server/api/errors";
import { getDb } from "@/server/db";
import type { Database } from "@/server/db";
import {
  contestProblems,
  contestStaff,
  contests,
  problemContributions,
  problems,
} from "@/server/db/schema";
import type { ContestStaffRole, ContestStaffStatus } from "@/lib/contest-ops";
import type { SafeUser } from "@/server/auth/session";

type Transaction = Parameters<Parameters<Database["transaction"]>[0]>[0];
export type Executor = Database | Transaction;

/** Invited and accepted crew are contest crew; declined/removed are past crew. */
export const ACTIVE_CONTEST_STAFF_STATUSES: ContestStaffStatus[] = [
  "INVITED",
  "ACCEPTED",
];

/** Roles that may curate the contest problem shortlist. */
export const CANDIDATE_CURATOR_ROLES: ContestStaffRole[] = [
  "DIRECTOR",
  "SETTER",
];

export async function loadContestSummary(contestId: string) {
  const [contest] = await getDb()
    .select({ id: contests.id, slug: contests.slug, title: contests.title })
    .from(contests)
    .where(eq(contests.id, contestId))
    .limit(1);
  if (!contest) throw errors.notFound("Contest not found.");
  return contest;
}

/**
 * Crew check used by every participation path: a contest_staff row that is
 * INVITED or ACCEPTED blocks registration, team membership and submissions.
 */
export async function isContestStaff(
  contestId: string,
  userId: string,
  executor: Executor = getDb(),
): Promise<{ role: ContestStaffRole; status: ContestStaffStatus } | null> {
  const [row] = await executor
    .select({ role: contestStaff.role, status: contestStaff.status })
    .from(contestStaff)
    .where(
      and(
        eq(contestStaff.contestId, contestId),
        eq(contestStaff.userId, userId),
        inArray(contestStaff.status, ACTIVE_CONTEST_STAFF_STATUSES),
      ),
    )
    .limit(1);
  return row ?? null;
}

/** True when the user cannot compete because they are contest crew. */
export async function isContestCrewBlocked(
  contestId: string,
  userId: string,
  executor: Executor = getDb(),
): Promise<boolean> {
  if (await isContestStaff(contestId, userId, executor)) return true;
  return (await implicitContestCrewRole(contestId, userId, executor)) !== null;
}

/**
 * Implicit crew: the author of a contest problem, an approved editorial
 * contributor or an approved test-case contributor cannot compete in the round
 * that uses their work, even when no explicit contest_staff row exists.
 */
export async function implicitContestCrewRole(
  contestId: string,
  userId: string,
  executor: Executor = getDb(),
): Promise<ContestStaffRole | null> {
  const [setter] = await executor
    .select({ problemId: contestProblems.problemId })
    .from(contestProblems)
    .innerJoin(problems, eq(problems.id, contestProblems.problemId))
    .where(
      and(
        eq(contestProblems.contestId, contestId),
        eq(problems.authorId, userId),
      ),
    )
    .limit(1);
  if (setter) return "SETTER";

  const [contributor] = await executor
    .select({ kind: problemContributions.kind })
    .from(problemContributions)
    .innerJoin(
      contestProblems,
      eq(contestProblems.problemId, problemContributions.problemId),
    )
    .where(
      and(
        eq(contestProblems.contestId, contestId),
        eq(problemContributions.contributorId, userId),
        inArray(problemContributions.status, ["PENDING", "APPROVED"]),
        inArray(problemContributions.kind, ["EDITORIAL", "TESTS"]),
      ),
    )
    .limit(1);
  if (!contributor) return null;
  return contributor.kind === "EDITORIAL" ? "EDITORIAL" : "TESTER";
}

export async function assertCanManageCrew(
  actor: Pick<SafeUser, "id" | "role">,
  contestId: string,
): Promise<void> {
  if (actor.role === "ADMIN") return;
  const staff = await isContestStaff(contestId, actor.id);
  if (staff?.role !== "DIRECTOR") {
    throw errors.forbidden(
      "Only a contest director or an admin can manage the contest crew.",
    );
  }
}

export async function assertCrewMember(
  actor: Pick<SafeUser, "id" | "role">,
  contestId: string,
  message: string,
): Promise<void> {
  if (actor.role === "ADMIN") return;
  if (await isContestStaff(contestId, actor.id)) return;
  if (await implicitContestCrewRole(contestId, actor.id)) return;
  throw errors.forbidden(message);
}

export async function assertCandidateCurator(
  actor: Pick<SafeUser, "id" | "role">,
  contestId: string,
): Promise<void> {
  if (actor.role === "ADMIN") return;
  const staff = await isContestStaff(contestId, actor.id);
  const role = staff?.role ?? (await implicitContestCrewRole(contestId, actor.id));
  if (!role || !CANDIDATE_CURATOR_ROLES.includes(role)) {
    throw errors.forbidden(
      "Only directors and setters can curate the contest problem shortlist.",
    );
  }
}
