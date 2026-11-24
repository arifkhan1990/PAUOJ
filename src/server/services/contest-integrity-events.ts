import { and, count, desc, eq, gte, sql } from "drizzle-orm";
import { errors } from "@/server/api/errors";
import { getDb } from "@/server/db";
import {
  contestIntegrityEvents,
  contestProblems,
  contestRegistrations,
  contestTeamMembers,
  contestTeams,
  contests,
  problems,
  users,
} from "@/server/db/schema";
import { contestStatus } from "@/lib/contests";
import type {
  ContestIntegrityEventType,
  ContestIntegritySummary,
} from "@/lib/contest-ops";
import type { ContestIntegrityEventInput } from "@/lib/schemas/contest-ops";
import type { SafeUser } from "@/server/auth/session";
import { isContestCrewBlocked } from "./contest-staff";

export const CONTEST_INTEGRITY_EVENT_TYPES: ContestIntegrityEventType[] = [
  "TAB_HIDDEN",
  "PASTE",
  "COPY",
  "CONTEXT_MENU",
  "PRINT",
  "FULLSCREEN_EXIT",
  "RAPID_SUBMIT",
];

const MAX_DETAIL_LENGTH = 200;
const RECENT_EVENT_LIMIT = 100;
const FLAGGED_WINDOW_HOURS = 24;
const FLAGGED_USER_LIMIT = 20;

function emptyTotals(): Record<ContestIntegrityEventType, number> {
  return Object.fromEntries(
    CONTEST_INTEGRITY_EVENT_TYPES.map((type) => [type, 0]),
  ) as Record<ContestIntegrityEventType, number>;
}

async function isContestParticipant(
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
        eq(contestTeamMembers.userId, userId),
        eq(contestTeams.contestId, contestId),
      ),
    )
    .limit(1);
  return Boolean(member);
}

export async function recordContestIntegrityEvent(
  actor: SafeUser,
  slug: string,
  input: ContestIntegrityEventInput,
): Promise<void> {
  const db = getDb();
  const [contest] = await db
    .select({
      id: contests.id,
      startAt: contests.startAt,
      endAt: contests.endAt,
    })
    .from(contests)
    .where(eq(contests.slug, slug))
    .limit(1);
  if (!contest) throw errors.notFound("Contest not found.");
  if (contestStatus(contest.startAt, contest.endAt) !== "RUNNING") {
    throw errors.conflict(
      "Integrity events are only recorded while the contest is running.",
    );
  }
  if (await isContestCrewBlocked(contest.id, actor.id)) {
    throw errors.forbidden("Contest crew cannot report as a participant.");
  }
  if (!(await isContestParticipant(contest.id, actor.id))) {
    throw errors.forbidden(
      "Only registered participants can report integrity events.",
    );
  }

  const detail = input.detail?.trim() || null;
  if (detail && detail.length > MAX_DETAIL_LENGTH) {
    throw errors.validation("Keep the event detail under 200 characters.");
  }

  const problemId = input.problemId?.trim() || null;
  if (problemId) {
    const [entry] = await db
      .select({ problemId: contestProblems.problemId })
      .from(contestProblems)
      .where(
        and(
          eq(contestProblems.contestId, contest.id),
          eq(contestProblems.problemId, problemId),
        ),
      )
      .limit(1);
    if (!entry) {
      throw errors.validation("That problem is not part of this contest.");
    }
  }

  await db.insert(contestIntegrityEvents).values({
    contestId: contest.id,
    userId: actor.id,
    problemId,
    type: input.type,
    detail,
  });
}

export async function getContestIntegritySummary(
  contestId: string,
): Promise<ContestIntegritySummary> {
  const db = getDb();
  const [contest] = await db
    .select({ id: contests.id })
    .from(contests)
    .where(eq(contests.id, contestId))
    .limit(1);
  if (!contest) throw errors.notFound("Contest not found.");

  const since = new Date(Date.now() - FLAGGED_WINDOW_HOURS * 60 * 60 * 1000);
  const [totalRows, recentRows, flaggedRows] = await Promise.all([
    db
      .select({ type: contestIntegrityEvents.type, value: count() })
      .from(contestIntegrityEvents)
      .where(eq(contestIntegrityEvents.contestId, contestId))
      .groupBy(contestIntegrityEvents.type),
    db
      .select({
        id: contestIntegrityEvents.id,
        type: contestIntegrityEvents.type,
        detail: contestIntegrityEvents.detail,
        createdAt: contestIntegrityEvents.createdAt,
        username: users.username,
        displayName: users.displayName,
        problemTitle: problems.title,
      })
      .from(contestIntegrityEvents)
      .innerJoin(users, eq(users.id, contestIntegrityEvents.userId))
      .leftJoin(problems, eq(problems.id, contestIntegrityEvents.problemId))
      .where(eq(contestIntegrityEvents.contestId, contestId))
      .orderBy(desc(contestIntegrityEvents.createdAt))
      .limit(RECENT_EVENT_LIMIT),
    db
      .select({
        userId: contestIntegrityEvents.userId,
        username: users.username,
        displayName: users.displayName,
        events: count(),
        lastEventAt: sql<Date>`max(${contestIntegrityEvents.createdAt})`,
      })
      .from(contestIntegrityEvents)
      .innerJoin(users, eq(users.id, contestIntegrityEvents.userId))
      .where(
        and(
          eq(contestIntegrityEvents.contestId, contestId),
          gte(contestIntegrityEvents.createdAt, since),
        ),
      )
      .groupBy(
        contestIntegrityEvents.userId,
        users.username,
        users.displayName,
      )
      .orderBy(
        desc(count()),
        desc(sql`max(${contestIntegrityEvents.createdAt})`),
      )
      .limit(FLAGGED_USER_LIMIT),
  ]);

  const totals = emptyTotals();
  for (const row of totalRows) {
    totals[row.type] = Number(row.value);
  }

  return {
    totals,
    events: recentRows.map((row) => ({
      id: row.id,
      type: row.type,
      detail: row.detail,
      createdAt: row.createdAt.toISOString(),
      user: { username: row.username, displayName: row.displayName },
      problem: row.problemTitle ? { title: row.problemTitle } : null,
    })),
    flaggedUsers: flaggedRows.map((row) => ({
      userId: row.userId,
      username: row.username,
      displayName: row.displayName,
      events: Number(row.events),
      lastEventAt: new Date(row.lastEventAt).toISOString(),
    })),
  };
}
