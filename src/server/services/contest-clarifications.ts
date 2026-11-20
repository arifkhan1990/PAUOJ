import { and, count, desc, eq } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { errors } from "@/server/api/errors";
import { toOffset } from "@/server/api/validation";
import { getDb } from "@/server/db";
import {
  auditLogs,
  contestClarifications,
  contestProblems,
  problems,
  users,
} from "@/server/db/schema";
import type { ContestClarificationItem } from "@/lib/types";
import type {
  ClarificationAnswerInput,
  ClarificationQuestionInput,
} from "@/lib/schemas/clarification";
import {
  canAnswerClarification,
  getContestAccess,
  type ContestViewer,
} from "./contest-access";
import { notifyUser } from "./notifications";

export const CLARIFICATIONS_PAGE_SIZE = 10;

export async function listContestClarifications(
  slug: string,
  viewer: ContestViewer,
  page: number,
): Promise<{ items: ContestClarificationItem[]; total: number }> {
  const access = await getContestAccess(slug, viewer);
  if (!access.canViewContent) {
    throw errors.forbidden(
      "Clarifications are available to registered participants while the contest runs.",
    );
  }

  const db = getDb();
  const answerers = alias(users, "answerers");
  const where = eq(contestClarifications.contestId, access.contest.id);
  const [totalRow, rows] = await Promise.all([
    db
      .select({ value: count() })
      .from(contestClarifications)
      .where(where),
    db
      .select({
        id: contestClarifications.id,
        question: contestClarifications.question,
        answer: contestClarifications.answer,
        createdAt: contestClarifications.createdAt,
        answeredAt: contestClarifications.answeredAt,
        problemId: problems.id,
        problemLabel: contestProblems.label,
        problemTitle: problems.title,
        problemSlug: problems.slug,
        problemAuthorId: problems.authorId,
        askerUsername: users.username,
        askerDisplayName: users.displayName,
        answererUsername: answerers.username,
        answererDisplayName: answerers.displayName,
      })
      .from(contestClarifications)
      .innerJoin(users, eq(users.id, contestClarifications.userId))
      .leftJoin(problems, eq(problems.id, contestClarifications.problemId))
      .leftJoin(
        contestProblems,
        and(
          eq(contestProblems.contestId, contestClarifications.contestId),
          eq(contestProblems.problemId, contestClarifications.problemId),
        ),
      )
      .leftJoin(
        answerers,
        eq(answerers.id, contestClarifications.answeredById),
      )
      .where(where)
      .orderBy(desc(contestClarifications.createdAt))
      .limit(CLARIFICATIONS_PAGE_SIZE)
      .offset(toOffset({ page, pageSize: CLARIFICATIONS_PAGE_SIZE })),
  ]);

  return {
    total: Number(totalRow[0]?.value ?? 0),
    items: rows.map((row) => ({
      id: row.id,
      question: row.question,
      answer: row.answer,
      createdAt: row.createdAt.toISOString(),
      answeredAt: row.answeredAt?.toISOString() ?? null,
      problem: row.problemId
        ? {
            id: row.problemId,
            label: row.problemLabel ?? "?",
            title: row.problemTitle ?? "Problem",
            slug: row.problemSlug ?? "",
          }
        : null,
      asker: {
        username: row.askerUsername,
        displayName: row.askerDisplayName,
      },
      answerer:
        row.answererUsername && row.answererDisplayName
          ? {
              username: row.answererUsername,
              displayName: row.answererDisplayName,
            }
          : null,
      canAnswer: canAnswerClarification({
        isAdmin: access.isAdmin,
        contestCreatedBy: access.contest.createdBy,
        problemAuthorId: row.problemAuthorId,
        viewerId: viewer?.id ?? null,
      }),
    })),
  };
}

export async function createContestClarification(
  slug: string,
  viewer: ContestViewer,
  input: ClarificationQuestionInput,
): Promise<{ id: string }> {
  if (!viewer) throw errors.unauthorized();
  const access = await getContestAccess(slug, viewer);
  if (!access.canViewContent) {
    throw errors.forbidden(
      "Register for the contest before asking a clarification.",
    );
  }
  if (!access.canAsk) {
    throw errors.conflict("This contest is no longer accepting questions.");
  }
  if (input.problemId) {
    const valid = access.problems.some(
      (problem) => problem.id === input.problemId,
    );
    if (!valid) {
      throw errors.validation("That problem is not part of this contest.");
    }
  }

  const now = new Date();
  const [row] = await getDb()
    .insert(contestClarifications)
    .values({
      contestId: access.contest.id,
      problemId: input.problemId ?? null,
      userId: viewer.id,
      question: input.question,
      createdAt: now,
      updatedAt: now,
    })
    .returning({ id: contestClarifications.id });
  if (!row) throw errors.unavailable("Could not save your question.");

  const creator = access.contest.createdBy;
  if (creator && creator !== viewer.id) {
    try {
      await notifyUser({
        userId: creator,
        type: "CLARIFICATION",
        title: "New contest clarification",
        body: input.question.slice(0, 180),
        href: `/contests/${access.contest.slug}/clarifications`,
        dedupeKey: `clarification-new:${row.id}`,
      });
    } catch (error) {
      console.error("Could not notify the contest organiser", error);
    }
  }
  return { id: row.id };
}

export async function answerContestClarification(
  slug: string,
  viewer: ContestViewer,
  clarificationId: string,
  input: ClarificationAnswerInput,
): Promise<{ id: string }> {
  if (!viewer) throw errors.unauthorized();
  const access = await getContestAccess(slug, viewer);
  if (!access.canViewContent) {
    throw errors.forbidden("You cannot answer this clarification.");
  }

  const db = getDb();
  const [row] = await db
    .select({
      id: contestClarifications.id,
      contestId: contestClarifications.contestId,
      userId: contestClarifications.userId,
      problemAuthorId: problems.authorId,
    })
    .from(contestClarifications)
    .leftJoin(problems, eq(problems.id, contestClarifications.problemId))
    .where(
      and(
        eq(contestClarifications.id, clarificationId),
        eq(contestClarifications.contestId, access.contest.id),
      ),
    )
    .limit(1);
  if (!row) throw errors.notFound("Clarification not found.");

  const allowed = canAnswerClarification({
    isAdmin: access.isAdmin,
    contestCreatedBy: access.contest.createdBy,
    problemAuthorId: row.problemAuthorId,
    viewerId: viewer.id,
  });
  if (!allowed) {
    throw errors.forbidden(
      "Only the contest organiser, problem author or an admin can answer.",
    );
  }

  const now = new Date();
  await db
    .update(contestClarifications)
    .set({
      answer: input.answer,
      answeredById: viewer.id,
      answeredAt: now,
      updatedAt: now,
    })
    .where(eq(contestClarifications.id, row.id));
  await db.insert(auditLogs).values({
    actorId: viewer.id,
    action: "clarification.answer",
    entityType: "contest_clarification",
    entityId: row.id,
  });

  if (row.userId !== viewer.id) {
    try {
      await notifyUser({
        userId: row.userId,
        type: "CLARIFICATION",
        title: "Your clarification was answered",
        body: input.answer.slice(0, 180),
        href: `/contests/${access.contest.slug}/clarifications`,
        dedupeKey: `clarification-answered:${row.id}`,
      });
    } catch (error) {
      console.error("Could not notify the participant", error);
    }
  }
  return { id: row.id };
}
