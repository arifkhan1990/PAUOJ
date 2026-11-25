import { and, asc, count, eq, inArray, or, sql } from "drizzle-orm";
import { ApiError, errors } from "@/server/api/errors";
import { toOffset, type PaginationInput } from "@/server/api/validation";
import { getDb } from "@/server/db";
import {
  contestProblems,
  contestStaff,
  contests,
  problems,
} from "@/server/db/schema";
import type { ContestInput } from "@/lib/schemas/contest";
import {
  contestStructureChanges,
  isContestStructureLocked,
} from "@/lib/contest-rating";
import type {
  AdminContestDetail,
  AdminContestListItem,
} from "@/lib/types";
import { slugify } from "@/lib/utils";
import type { SafeUser } from "@/server/auth/session";
import { participantCountSql, problemCountSql } from "./contest-queries";
import {
  listContestApprovalSummaries,
  listUnapprovedContestProblems,
  notifyContestApprovalRequests,
  syncContestProblemApprovals,
} from "./contest-problem-approvals";
import { applyFreshProblemPolicy } from "./contest-fresh-problems";

type FeeStatus = (typeof contests.$inferSelect)["feeStatus"];

type Transaction = Parameters<
  Parameters<ReturnType<typeof getDb>["transaction"]>[0]
>[0];

function resolveFeeStatus(
  feeBdt: number | undefined,
  current?: FeeStatus,
): FeeStatus {
  if (feeBdt === undefined) return "NOT_REQUIRED";
  if (current && current !== "NOT_REQUIRED") return current;
  return "PENDING";
}

async function upsertDirector(
  tx: Transaction,
  contestId: string,
  userId: string,
): Promise<void> {
  const now = new Date();
  await tx
    .insert(contestStaff)
    .values({
      contestId,
      userId,
      role: "DIRECTOR",
      status: "ACCEPTED",
      invitedById: userId,
      respondedAt: now,
    })
    .onConflictDoUpdate({
      target: [contestStaff.contestId, contestStaff.userId],
      set: {
        role: "DIRECTOR",
        status: "ACCEPTED",
        respondedAt: now,
        updatedAt: now,
      },
    });
}

export async function listAdminContests(
  page: PaginationInput,
  createdBy?: string,
): Promise<{ items: AdminContestListItem[]; total: number }> {
  const db = getDb();
  const where = createdBy ? eq(contests.createdBy, createdBy) : undefined;
  const [totalRow] = await db
    .select({ value: count() })
    .from(contests)
    .where(where);
  const rows = await db
    .select({
      id: contests.id,
      slug: contests.slug,
      title: contests.title,
      startAt: contests.startAt,
      endAt: contests.endAt,
      isPublic: contests.isPublic,
      division: contests.division,
      format: contests.format,
      teamSize: contests.teamSize,
      isOfficial: contests.isOfficial,
      feeStatus: contests.feeStatus,
      freezeMinutes: contests.freezeMinutes,
      problemCount: problemCountSql(),
      participantCount: participantCountSql(),
      pendingApprovals: sql<number>`(select count(*)::int from contest_problem_approvals cpa where cpa.contest_id = "contests"."id" and cpa.status <> 'APPROVED')`,
    })
    .from(contests)
    .where(where)
    .orderBy(asc(contests.startAt))
    .limit(page.pageSize)
    .offset(toOffset(page));

  return {
    total: Number(totalRow?.value ?? 0),
    items: rows.map((row) => ({
      id: row.id,
      slug: row.slug,
      title: row.title,
      startAt: row.startAt.toISOString(),
      endAt: row.endAt.toISOString(),
      isPublic: row.isPublic,
      division: row.division,
      format: row.format,
      teamSize: row.teamSize,
      isOfficial: row.isOfficial,
      feeStatus: row.feeStatus,
      freezeMinutes: row.freezeMinutes,
      problemCount: Number(row.problemCount),
      participantCount: Number(row.participantCount),
      pendingApprovals: Number(row.pendingApprovals),
    })),
  };
}

export async function getAdminContestDetail(
  id: string,
  createdBy?: string,
): Promise<AdminContestDetail | null> {
  const db = getDb();
  const rows = await db
    .select()
    .from(contests)
    .where(
      createdBy
        ? and(eq(contests.id, id), eq(contests.createdBy, createdBy))
        : eq(contests.id, id),
    )
    .limit(1);
  const contest = rows[0];
  if (!contest) return null;
  const problemRows = await db
    .select({ problemId: contestProblems.problemId })
    .from(contestProblems)
    .where(eq(contestProblems.contestId, contest.id))
    .orderBy(asc(contestProblems.position));
  const problemApprovals = await listContestApprovalSummaries(contest.id);
  return {
    id: contest.id,
    slug: contest.slug,
    title: contest.title,
    description: contest.description,
    bannerUrl: contest.bannerUrl,
    startAt: contest.startAt.toISOString(),
    endAt: contest.endAt.toISOString(),
    isPublic: contest.isPublic,
    division: contest.division,
    format: contest.format,
    teamSize: contest.teamSize,
    isOfficial: contest.isOfficial,
    feeStatus: contest.feeStatus,
    feeBdt: contest.feeBdt,
    feeReference: contest.feeReference,
    requiresFreshProblems: contest.requiresFreshProblems,
    eligibility: contest.eligibility,
    rules: contest.rules,
    prizes: contest.prizes,
    seriesId: contest.seriesId,
    freezeMinutes: contest.freezeMinutes,
    problemIds: problemRows.map((row) => row.problemId),
    problemApprovals,
  };
}

async function prepareProblems(
  problemIds: string[],
  ownerId?: string,
): Promise<string[]> {
  const unique = [...new Set(problemIds)];
  const rows = await getDb()
    .select({ id: problems.id })
    .from(problems)
    .where(
      ownerId
        ? and(
            inArray(problems.id, unique),
            or(eq(problems.isPublic, true), eq(problems.authorId, ownerId)),
          )
        : inArray(problems.id, unique),
    );
  if (rows.length !== unique.length) {
    throw errors.validation("One or more selected problems are not available.");
  }
  return unique;
}

function contestLinkRows(contestId: string, problemIds: string[]) {
  return problemIds.map((problemId, index) => ({
    contestId,
    problemId,
    label: String.fromCharCode(65 + index),
    position: String(index).padStart(2, "0"),
  }));
}

async function assertApprovalsComplete(
  contestId: string,
  executor: Parameters<typeof listUnapprovedContestProblems>[1],
): Promise<void> {
  const unapproved = await listUnapprovedContestProblems(contestId, executor);
  if (unapproved.length === 0) return;
  const names = unapproved
    .map((row) => `"${row.problemTitle}"`)
    .join(", ");
  throw errors.validation(
    `This contest cannot be public until its problem authors approve or remove: ${names}. Save it as a private draft, then publish after approval.`,
    { problems: unapproved },
  );
}

function contestValues(input: ContestInput, feeStatus: FeeStatus) {
  return {
    title: input.title,
    description: input.description,
    bannerUrl: input.bannerUrl || null,
    startAt: new Date(input.startAt),
    endAt: new Date(input.endAt),
    isPublic: input.isPublic,
    division: input.division,
    format: input.format,
    teamSize: input.teamSize,
    isOfficial: input.isOfficial,
    requiresFreshProblems: input.requiresFreshProblems,
    feeStatus,
    feeBdt: input.feeBdt ?? null,
    feeReference: input.feeReference || null,
    eligibility: input.eligibility || null,
    rules: input.rules || null,
    prizes: input.prizes || null,
    freezeMinutes: input.freezeMinutes,
  };
}

export async function createContest(
  actor: Pick<SafeUser, "id" | "role" | "displayName">,
  input: ContestInput,
): Promise<AdminContestDetail> {
  const db = getDb();
  const ownerId = actor.role === "TEACHER" ? actor.id : undefined;
  const problemIds = await prepareProblems(input.problemIds, ownerId);
  const slug = input.slug || slugify(input.title);
  const [existing] = await db
    .select({ id: contests.id })
    .from(contests)
    .where(eq(contests.slug, slug))
    .limit(1);
  if (existing) throw errors.conflict("A contest with that slug already exists.");

  const { id, requests } = await db.transaction(async (tx) => {
    const [created] = await tx
      .insert(contests)
      .values({
        ...contestValues(input, resolveFeeStatus(input.feeBdt)),
        slug,
        createdBy: actor.id,
      })
      .returning({ id: contests.id });
    if (!created) {
      throw new ApiError("CREATE_FAILED", "Could not create contest.", 500);
    }
    await tx.insert(contestProblems).values(contestLinkRows(created.id, problemIds));
    await applyFreshProblemPolicy(tx, {
      contestId: created.id,
      problemIds,
      requiresFresh: input.requiresFreshProblems,
    });
    await upsertDirector(tx, created.id, actor.id);
    const pending = await syncContestProblemApprovals(tx, {
      contestId: created.id,
      contestTitle: input.title,
      problemIds,
      actor,
    });
    if (input.isPublic) await assertApprovalsComplete(created.id, tx);
    return { id: created.id, requests: pending };
  });

  await notifyContestApprovalRequests(requests, actor.displayName);

  const detail = await getAdminContestDetail(id);
  if (!detail) throw new ApiError("CREATE_FAILED", "Could not load contest.", 500);
  return detail;
}

export async function updateContest(
  actor: Pick<SafeUser, "id" | "role" | "displayName">,
  id: string,
  input: ContestInput,
): Promise<AdminContestDetail> {
  const db = getDb();
  const createdBy = actor.role === "TEACHER" ? actor.id : undefined;
  const [owned] = await db
    .select({
      id: contests.id,
      createdBy: contests.createdBy,
      feeStatus: contests.feeStatus,
      startAt: contests.startAt,
      endAt: contests.endAt,
      format: contests.format,
      division: contests.division,
      ratedAt: contests.ratedAt,
    })
    .from(contests)
    .where(
      createdBy
        ? and(eq(contests.id, id), eq(contests.createdBy, createdBy))
        : eq(contests.id, id),
    )
    .limit(1);
  if (!owned) throw errors.notFound("Contest not found.");
  const problemIds = await prepareProblems(input.problemIds, createdBy);
  const slug = input.slug || slugify(input.title);

  const existingProblemRows = await db
    .select({ problemId: contestProblems.problemId })
    .from(contestProblems)
    .where(eq(contestProblems.contestId, id));
  const currentProblemIds = existingProblemRows
    .map((row) => row.problemId)
    .sort();
  const nextProblemIds = [...problemIds].sort();
  const problemSetChanged =
    currentProblemIds.length !== nextProblemIds.length ||
    currentProblemIds.some((value, index) => value !== nextProblemIds[index]);
  const structureChanges = contestStructureChanges(
    owned,
    {
      startAt: new Date(input.startAt),
      endAt: new Date(input.endAt),
      format: input.format,
      division: input.division,
    },
    problemSetChanged,
  );

  const [existing] = await db
    .select({ id: contests.id })
    .from(contests)
    .where(eq(contests.slug, slug))
    .limit(1);
  if (existing && existing.id !== id) {
    throw errors.conflict("A contest with that slug already exists.");
  }

  const requests = await db.transaction(async (tx) => {
    const [locked] = await tx
      .select({ ratedAt: contests.ratedAt })
      .from(contests)
      .where(eq(contests.id, id))
      .for("update")
      .limit(1);
    if (!locked) throw errors.notFound("Contest not found.");
    // Re-check under the same lock the finalizer takes, so a rating run cannot
    // land between the edit check and this update.
    if (isContestStructureLocked(locked.ratedAt, structureChanges)) {
      throw errors.conflict(
        "Contest ratings are finalized; the contest problems and schedule are locked.",
      );
    }
    await tx
      .update(contests)
      .set({
        ...contestValues(
          input,
          resolveFeeStatus(input.feeBdt, owned.feeStatus),
        ),
        slug,
        updatedAt: new Date(),
      })
      .where(eq(contests.id, id));
    await tx.delete(contestProblems).where(eq(contestProblems.contestId, id));
    await tx.insert(contestProblems).values(contestLinkRows(id, problemIds));
    await applyFreshProblemPolicy(tx, {
      contestId: id,
      problemIds,
      requiresFresh: input.requiresFreshProblems,
    });
    await upsertDirector(tx, id, owned.createdBy ?? actor.id);
    const pending = await syncContestProblemApprovals(tx, {
      contestId: id,
      contestTitle: input.title,
      problemIds,
      actor,
    });
    if (input.isPublic) await assertApprovalsComplete(id, tx);
    return pending;
  });

  await notifyContestApprovalRequests(requests, actor.displayName);

  const detail = await getAdminContestDetail(id, createdBy);
  if (!detail) throw errors.notFound("Contest not found.");
  return detail;
}
