import { and, asc, eq } from "drizzle-orm";
import { errors } from "@/server/api/errors";
import { getDb } from "@/server/db";
import {
  contestProblems,
  contestRegistrations,
  contests,
  problems,
} from "@/server/db/schema";
import type { ContestProblemOption, ContestStatus } from "@/lib/types";
import { contestStatus } from "@/lib/contests";
import { finalizeContestRatings } from "./ratings";

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
  canViewContent: boolean;
  canAsk: boolean;
  problems: ContestProblemOption[];
};

export function resolveContestContentAccess(input: {
  status: ContestStatus;
  isPublic: boolean;
  registered: boolean;
  isAdmin: boolean;
}): boolean {
  return (
    input.isAdmin ||
    input.registered ||
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
  if (!contest || (!contest.isPublic && !isAdmin)) {
    throw errors.notFound("Contest not found.");
  }

  const registered = viewer
    ? Boolean(
        (
          await db
            .select({ contestId: contestRegistrations.contestId })
            .from(contestRegistrations)
            .where(
              and(
                eq(contestRegistrations.contestId, contest.id),
                eq(contestRegistrations.userId, viewer.id),
              ),
            )
            .limit(1)
        )[0],
      )
    : false;
  const status = contestStatus(contest.startAt, contest.endAt);
  if (status === "ENDED") {
    try {
      await finalizeContestRatings(contest.slug);
    } catch (error) {
      console.error("Contest rating finalization failed", error);
    }
  }
  const canViewContent = resolveContestContentAccess({
    status,
    isPublic: contest.isPublic,
    registered,
    isAdmin,
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
    canViewContent,
    canAsk: (registered || isAdmin) && status !== "ENDED",
    problems: problemRows,
  };
}
