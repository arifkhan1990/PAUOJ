import { and, asc, eq, sql } from "drizzle-orm";
import { errors } from "@/server/api/errors";
import { getDb } from "@/server/db";
import {
  contestProblemCandidates,
  contestProblems,
  contestStaffNotes,
  problems,
  users,
} from "@/server/db/schema";
import { isUniqueViolation } from "@/lib/db-errors";
import type {
  ContestProblemCandidateView,
  ContestStaffNoteView,
} from "@/lib/contest-ops";
import type {
  ContestCandidateInput,
  ContestStaffNoteInput,
} from "@/lib/schemas/contest-ops";
import type { SafeUser } from "@/server/auth/session";
import {
  assertCandidateCurator,
  assertCrewMember,
  isContestStaff,
  loadContestSummary,
} from "./contest-crew";

function noteView(row: {
  id: string;
  body: string;
  problemId: string | null;
  problemTitle: string | null;
  createdAt: Date;
  username: string;
  displayName: string;
}): ContestStaffNoteView {
  return {
    id: row.id,
    body: row.body,
    problemId: row.problemId,
    problemTitle: row.problemTitle,
    createdAt: row.createdAt.toISOString(),
    author: { username: row.username, displayName: row.displayName },
  };
}

function candidateView(row: {
  id: string;
  problemId: string;
  title: string;
  slug: string;
  difficulty: string;
  status: "PROPOSED" | "SHORTLISTED" | "REJECTED";
  note: string | null;
  createdAt: Date;
  proposedByUsername: string | null;
  proposedByDisplayName: string | null;
}): ContestProblemCandidateView {
  return {
    id: row.id,
    problemId: row.problemId,
    title: row.title,
    slug: row.slug,
    difficulty: row.difficulty,
    status: row.status,
    note: row.note,
    createdAt: row.createdAt.toISOString(),
    proposedBy:
      row.proposedByUsername && row.proposedByDisplayName
        ? {
            username: row.proposedByUsername,
            displayName: row.proposedByDisplayName,
          }
        : null,
  };
}

function candidateStatusRankSql() {
  return sql`case ${contestProblemCandidates.status}
    when 'PROPOSED' then 0
    when 'SHORTLISTED' then 1
    else 2
  end`;
}

export async function listContestStaffNotes(
  contestId: string,
): Promise<ContestStaffNoteView[]> {
  const rows = await getDb()
    .select({
      id: contestStaffNotes.id,
      body: contestStaffNotes.body,
      problemId: contestStaffNotes.problemId,
      problemTitle: problems.title,
      createdAt: contestStaffNotes.createdAt,
      username: users.username,
      displayName: users.displayName,
    })
    .from(contestStaffNotes)
    .innerJoin(users, eq(users.id, contestStaffNotes.authorId))
    .leftJoin(problems, eq(problems.id, contestStaffNotes.problemId))
    .where(eq(contestStaffNotes.contestId, contestId))
    .orderBy(asc(contestStaffNotes.createdAt))
    .limit(200);
  return rows.map(noteView);
}

export async function addContestStaffNote(
  actor: SafeUser,
  contestId: string,
  input: ContestStaffNoteInput,
): Promise<ContestStaffNoteView> {
  await loadContestSummary(contestId);
  await assertCrewMember(
    actor,
    contestId,
    "Only contest crew can write crew notes.",
  );
  const body = input.body.trim();
  if (!body) throw errors.validation("Write a note.");

  const problemId = input.problemId?.trim() || null;
  let problemTitle: string | null = null;
  if (problemId) {
    const [problem] = await getDb()
      .select({ title: problems.title })
      .from(contestProblems)
      .innerJoin(problems, eq(problems.id, contestProblems.problemId))
      .where(
        and(
          eq(contestProblems.contestId, contestId),
          eq(contestProblems.problemId, problemId),
        ),
      )
      .limit(1);
    if (!problem) {
      throw errors.validation("That problem is not part of this contest.");
    }
    problemTitle = problem.title;
  }

  const [created] = await getDb()
    .insert(contestStaffNotes)
    .values({ contestId, authorId: actor.id, problemId, body })
    .returning({
      id: contestStaffNotes.id,
      createdAt: contestStaffNotes.createdAt,
    });
  if (!created) throw errors.conflict("Could not save that note.");

  return {
    id: created.id,
    body,
    problemId,
    problemTitle,
    createdAt: created.createdAt.toISOString(),
    author: { username: actor.username, displayName: actor.displayName },
  };
}

export async function listContestCandidates(
  contestId: string,
): Promise<ContestProblemCandidateView[]> {
  const rows = await getDb()
    .select({
      id: contestProblemCandidates.id,
      problemId: contestProblemCandidates.problemId,
      title: problems.title,
      slug: problems.slug,
      difficulty: problems.difficulty,
      status: contestProblemCandidates.status,
      note: contestProblemCandidates.note,
      createdAt: contestProblemCandidates.createdAt,
      proposedByUsername: users.username,
      proposedByDisplayName: users.displayName,
    })
    .from(contestProblemCandidates)
    .innerJoin(problems, eq(problems.id, contestProblemCandidates.problemId))
    .leftJoin(users, eq(users.id, contestProblemCandidates.proposedById))
    .where(eq(contestProblemCandidates.contestId, contestId))
    .orderBy(
      asc(candidateStatusRankSql()),
      asc(contestProblemCandidates.createdAt),
    )
    .limit(200);
  return rows.map(candidateView);
}

export async function proposeContestCandidate(
  actor: SafeUser,
  contestId: string,
  input: ContestCandidateInput,
): Promise<ContestProblemCandidateView> {
  await loadContestSummary(contestId);
  await assertCandidateCurator(actor, contestId);

  const [problem] = await getDb()
    .select({
      id: problems.id,
      title: problems.title,
      slug: problems.slug,
      difficulty: problems.difficulty,
    })
    .from(problems)
    .where(eq(problems.id, input.problemId))
    .limit(1);
  if (!problem) throw errors.notFound("Problem not found.");

  const note = input.note?.trim() || null;
  try {
    const [created] = await getDb()
      .insert(contestProblemCandidates)
      .values({
        contestId,
        problemId: problem.id,
        proposedById: actor.id,
        note,
      })
      .returning({
        id: contestProblemCandidates.id,
        status: contestProblemCandidates.status,
        createdAt: contestProblemCandidates.createdAt,
      });
    if (!created) throw errors.conflict("Could not shortlist that problem.");
    return {
      id: created.id,
      problemId: problem.id,
      title: problem.title,
      slug: problem.slug,
      difficulty: problem.difficulty,
      status: created.status,
      note,
      createdAt: created.createdAt.toISOString(),
      proposedBy: { username: actor.username, displayName: actor.displayName },
    };
  } catch (error) {
    if (isUniqueViolation(error)) {
      throw errors.conflict("That problem is already on the shortlist.");
    }
    throw error;
  }
}

export async function decideContestCandidate(
  actor: SafeUser,
  contestId: string,
  candidateId: string,
  status: "SHORTLISTED" | "REJECTED",
): Promise<void> {
  if (actor.role !== "ADMIN") {
    const staff = await isContestStaff(contestId, actor.id);
    if (staff?.role !== "DIRECTOR") {
      throw errors.forbidden(
        "Only a contest director or an admin can decide the shortlist.",
      );
    }
  }

  const [updated] = await getDb()
    .update(contestProblemCandidates)
    .set({ status, updatedAt: new Date() })
    .where(
      and(
        eq(contestProblemCandidates.id, candidateId),
        eq(contestProblemCandidates.contestId, contestId),
      ),
    )
    .returning({ id: contestProblemCandidates.id });
  if (!updated) throw errors.notFound("Shortlisted problem not found.");
}
