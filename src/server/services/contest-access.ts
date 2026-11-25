import { and, asc, eq, inArray } from "drizzle-orm";
import { errors } from "@/server/api/errors";
import { getDb } from "@/server/db";
import {
  contestProblems,
  contestRegistrations,
  contestStaff,
  contestTeamMembers,
  contestTeams,
  contests,
  problems,
} from "@/server/db/schema";
import type { ContestProblemOption, ContestStatus } from "@/lib/types";
import { contestStatus } from "@/lib/contests";
import { implicitContestCrewRole, isContestStaff } from "./contest-staff";

export type ContestViewer = {
  id: string;
  role: "USER" | "TEACHER" | "ADMIN";
} | null;

export type ContestAccess = {
  contest: {
    id: string;
    slug: string;
    title: string;
    startAt: Date;
    endAt: Date;
    isPublic: boolean;
    createdBy: string | null;
  };
  status: ContestStatus;
  registered: boolean;
  isAdmin: boolean;
  isCrew: boolean;
  team: { id: string; name: string } | null;
  canViewContent: boolean;
  canAsk: boolean;
  problems: ContestProblemOption[];
};

export function resolveContestContentAccess(input: {
  status: ContestStatus;
  isPublic: boolean;
  registered: boolean;
  isAdmin: boolean;
  isCrew?: boolean;
}): boolean {
  return (
    input.isAdmin ||
    input.registered ||
    Boolean(input.isCrew) ||
    (input.isPublic && input.status === "ENDED")
  );
}

export function canAnswerClarification(input: {
  isAdmin: boolean;
  contestCreatedBy: string | null;
  problemAuthorId: string | null;
  viewerId: string | null;
}): boolean {
  if (!input.viewerId) return false;
  return (
    input.isAdmin ||
    input.contestCreatedBy === input.viewerId ||
    input.problemAuthorId === input.viewerId
  );
}

async function loadViewerParticipation(contestId: string, viewer: ContestViewer) {
  const db = getDb();
  if (!viewer) {
    return {
      registered: false,
      team: null as ContestAccess["team"],
      isCrew: false,
    };
  }

  const [registration] = await db
    .select({ contestId: contestRegistrations.contestId })
    .from(contestRegistrations)
    .where(
      and(
        eq(contestRegistrations.contestId, contestId),
        eq(contestRegistrations.userId, viewer.id),
      ),
    )
    .limit(1);

  const [team] = await db
    .select({ id: contestTeams.id, name: contestTeams.name })
    .from(contestTeamMembers)
    .innerJoin(contestTeams, eq(contestTeams.id, contestTeamMembers.teamId))
    .where(
      and(
        eq(contestTeams.contestId, contestId),
        eq(contestTeamMembers.userId, viewer.id),
      ),
    )
    .limit(1);

  const [crew] = await db
    .select({ id: contestStaff.id })
    .from(contestStaff)
    .where(
      and(
        eq(contestStaff.contestId, contestId),
        eq(contestStaff.userId, viewer.id),
        inArray(contestStaff.status, ["INVITED", "ACCEPTED"]),
      ),
    )
    .limit(1);

  return {
    registered: Boolean(registration) || Boolean(team),
    team: team ?? null,
    isCrew: Boolean(crew),
  };
}

export async function assertContestCrewAccess(
  contestId: string,
  viewer: { id: string; role: string },
): Promise<void> {
  if (viewer.role === "ADMIN") return;
  const db = getDb();
  const [contest] = await db
    .select({ createdBy: contests.createdBy })
    .from(contests)
    .where(eq(contests.id, contestId))
    .limit(1);
  if (!contest) throw errors.notFound("Contest not found.");
  if (contest.createdBy === viewer.id) return;
  const [crew] = await db
    .select({ id: contestStaff.id })
    .from(contestStaff)
    .where(
      and(
        eq(contestStaff.contestId, contestId),
        eq(contestStaff.userId, viewer.id),
        inArray(contestStaff.status, ["INVITED", "ACCEPTED"]),
      ),
    )
    .limit(1);
  if (!crew) {
    if (await implicitContestCrewRole(contestId, viewer.id)) return;
    throw errors.forbidden(
      "Only contest crew can open the contest operations workspace.",
    );
  }
}

export async function getContestAccess(
  slug: string,
  viewer: ContestViewer,
): Promise<ContestAccess> {
  const db = getDb();
  const rows = await db
    .select({
      id: contests.id,
      slug: contests.slug,
      title: contests.title,
      startAt: contests.startAt,
      endAt: contests.endAt,
      isPublic: contests.isPublic,
      createdBy: contests.createdBy,
    })
    .from(contests)
    .where(eq(contests.slug, slug))
    .limit(1);
  const contest = rows[0];
  const isAdmin = viewer?.role === "ADMIN";
  if (!contest) {
    throw errors.notFound("Contest not found.");
  }
  if (!contest.isPublic && !isAdmin) {
    const crew = viewer ? await isContestStaff(contest.id, viewer.id) : null;
    if (!crew) throw errors.notFound("Contest not found.");
  }

  const { registered, team, isCrew } = await loadViewerParticipation(
    contest.id,
    viewer,
  );
  const status = contestStatus(contest.startAt, contest.endAt);
  const canViewContent = resolveContestContentAccess({
    status,
    isPublic: contest.isPublic,
    registered,
    isAdmin,
    isCrew,
  });

  const problemRows = canViewContent
    ? await db
        .select({
          id: problems.id,
          label: contestProblems.label,
          title: problems.title,
        })
        .from(contestProblems)
        .innerJoin(problems, eq(problems.id, contestProblems.problemId))
        .where(eq(contestProblems.contestId, contest.id))
        .orderBy(asc(contestProblems.position))
    : [];

  return {
    contest,
    status,
    registered,
    isAdmin,
    isCrew,
    team,
    canViewContent,
    canAsk: (registered || isAdmin) && status !== "ENDED",
    problems: problemRows,
  };
}
