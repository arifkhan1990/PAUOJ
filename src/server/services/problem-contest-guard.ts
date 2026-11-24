import { and, asc, desc, eq, gt, inArray, lte } from "drizzle-orm";
import { ApiError } from "@/server/api/errors";
import { getDb } from "@/server/db";
import {
  contestProblems,
  contestStaff,
  contests,
  users,
} from "@/server/db/schema";
import type { ContestStaffRole } from "@/lib/contest-ops";
import {
  buildContestWatermark,
  contestCrewProblemAccess,
  isContestEditorialLocked,
} from "@/lib/contest-security";
import { contestStatus } from "@/lib/contests";
import type { ContestStatus } from "@/lib/types";
import type { ActiveContestContext } from "./contests";

type RunningContestCrewContext = {
  role: ContestStaffRole;
  contestId: string;
  slug: string;
  title: string;
  label: string;
  startAt: Date;
  endAt: Date;
};

/**
 * One staff query: the viewer's crew role (INVITED/ACCEPTED) for a running
 * contest that contains this problem. Returns the contest row so a DIRECTOR
 * can preview the statement without a second contest lookup.
 */
async function loadRunningContestCrewContext(
  problemId: string,
  userId: string | null,
  needed: boolean,
): Promise<RunningContestCrewContext | null> {
  if (!needed || !userId) return null;
  const now = new Date();
  const rows = await getDb()
    .select({
      role: contestStaff.role,
      contestId: contests.id,
      slug: contests.slug,
      title: contests.title,
      label: contestProblems.label,
      startAt: contests.startAt,
      endAt: contests.endAt,
    })
    .from(contestStaff)
    .innerJoin(contests, eq(contests.id, contestStaff.contestId))
    .innerJoin(
      contestProblems,
      and(
        eq(contestProblems.contestId, contests.id),
        eq(contestProblems.problemId, problemId),
      ),
    )
    .where(
      and(
        eq(contestStaff.userId, userId),
        inArray(contestStaff.status, ["INVITED", "ACCEPTED"]),
        lte(contests.startAt, now),
        gt(contests.endAt, now),
      ),
    )
    .orderBy(asc(contests.startAt))
    .limit(1);
  return rows[0] ?? null;
}

/**
 * Crew blind access for problem pages: while the round runs, every crew
 * role except DIRECTOR gets a typed 403 that never reveals the statement.
 * Returns the DIRECTOR's running contest context for preview, else null.
 */
export async function enforceContestCrewGuard(
  problemId: string,
  userId: string | null,
  needed: boolean,
): Promise<RunningContestCrewContext | null> {
  const crewContext = await loadRunningContestCrewContext(
    problemId,
    userId,
    needed,
  );
  if (!crewContext) return null;
  const status = contestStatus(crewContext.startAt, crewContext.endAt);
  if (!contestCrewProblemAccess({ status, role: crewContext.role }).allowed) {
    throw new ApiError(
      "CONTEST_CREW_LOCKED",
      "Contest crew cannot open this problem while the round is running.",
      403,
      {
        contestSlug: crewContext.slug,
        title: crewContext.title,
        role: crewContext.role,
      },
    );
  }
  return crewContext.role === "DIRECTOR" ? crewContext : null;
}

export type ProblemContestView = {
  activeContest: {
    contestId: string;
    slug: string;
    title: string;
    label: string;
    startAt: Date;
    endAt: Date;
  } | null;
  status: ContestStatus | null;
  editorialSealed: boolean;
  integrityWatermark: string | null;
};

/**
 * Archived contest context: fresh contest problems stay private in the
 * practice list, but the public contest page must still open its problem
 * statements after the round. Returns the latest ended public contest that
 * contains the problem, or null.
 */
export async function getEndedContestForProblem(problemId: string): Promise<{
  contestId: string;
  slug: string;
  title: string;
  label: string;
  startAt: Date;
  endAt: Date;
} | null> {
  const now = new Date();
  const [row] = await getDb()
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
        eq(contests.isPublic, true),
        lte(contests.endAt, now),
      ),
    )
    .orderBy(desc(contests.endAt))
    .limit(1);
  return row ?? null;
}

/**
 * Assembles the running-contest view of a problem: the active context
 * (registered participant first, DIRECTOR preview second), the sealed
 * editorial flag and the per-view watermark. The watermark is only built
 * for registered participants/team members — never for admins, crew or
 * anonymous viewers.
 */
export async function buildProblemContestView(input: {
  contestAccess: { active: ActiveContestContext | null };
  directorContext: RunningContestCrewContext | null;
  userId: string | null;
  isAdmin: boolean;
}): Promise<ProblemContestView> {
  const activeContest = input.contestAccess.active ?? input.directorContext;
  const status = activeContest
    ? contestStatus(activeContest.startAt, activeContest.endAt)
    : null;
  const editorialSealed =
    activeContest !== null && status !== null
      ? isContestEditorialLocked({ status, hasContestContext: true })
      : false;
  let integrityWatermark: string | null = null;
  if (input.contestAccess.active && input.userId && !input.isAdmin) {
    const [viewer] = await getDb()
      .select({ username: users.username, displayName: users.displayName })
      .from(users)
      .where(eq(users.id, input.userId))
      .limit(1);
    if (viewer) {
      integrityWatermark = buildContestWatermark({
        displayName: viewer.displayName,
        username: viewer.username,
        contestSlug: input.contestAccess.active.slug,
        startAt: input.contestAccess.active.startAt,
      });
    }
  }
  return { activeContest, status, editorialSealed, integrityWatermark };
}

/**
 * Context lock for non-participants: a problem tied to a running contest
 * or assessment throws a typed 403 with the public context details only.
 */
export function assertProblemContextUnlocked(input: {
  hasActiveContext: boolean;
  contestAllowed: boolean;
  assessmentAllowed: boolean;
  isAdmin: boolean;
  blockingContest: { slug: string; title: string } | null;
  assessmentRestricted: boolean;
  blockingAssessment: { slug: string; title: string } | null;
}): void {
  if (
    !input.hasActiveContext ||
    input.isAdmin ||
    input.contestAllowed ||
    input.assessmentAllowed
  ) {
    return;
  }
  if (input.assessmentRestricted && input.blockingAssessment) {
    throw new ApiError(
      "ASSESSMENT_LOCKED",
      "This problem belongs to a running coding assessment. Join the assessment with your access code to open it.",
      403,
      input.blockingAssessment,
    );
  }
  throw new ApiError(
    "CONTEST_LOCKED",
    "This problem belongs to a running contest. Register for the contest to open it.",
    403,
    input.blockingContest,
  );
}
