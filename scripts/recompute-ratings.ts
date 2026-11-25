import "dotenv/config";
import { and, asc, eq, inArray } from "drizzle-orm";
import { closeDb, getDb } from "@/server/db";
import {
  auditLogs,
  contestRatingChanges,
  contests,
  users,
} from "@/server/db/schema";
import { compactRanks, computeRatingChanges } from "@/server/contests/rating";
import type { RatingParticipant } from "@/lib/rating-types";

const APPLY = process.argv.includes("--apply");
const MINIMUM_RATING = 100;

type ChangeRow = typeof contestRatingChanges.$inferSelect;
type WriteRow = {
  contestId: string;
  userId: string;
  rank: number;
  oldRating: number;
  newRating: number;
  delta: number;
};

function signed(value: number): string {
  return value > 0 ? `+${value}` : `${value}`;
}

async function main(): Promise<void> {
  const db = getDb();
  const [contestRows, changeRows] = await Promise.all([
    db
      .select({
        id: contests.id,
        slug: contests.slug,
        format: contests.format,
        ratedAt: contests.ratedAt,
        endAt: contests.endAt,
      })
      .from(contests)
      .orderBy(asc(contests.endAt), asc(contests.id)),
    db
      .select()
      .from(contestRatingChanges)
      .orderBy(
        asc(contestRatingChanges.createdAt),
        asc(contestRatingChanges.contestId),
        asc(contestRatingChanges.userId),
      ),
  ]);

  // The participant set comes from stored changes only; submissions are never
  // re-read, so a repair cannot invent or drop a rated participant.
  const changesByContest = new Map<string, ChangeRow[]>();
  const baseRatings = new Map<string, number>();
  for (const row of changeRows) {
    const list = changesByContest.get(row.contestId);
    if (list) list.push(row);
    else changesByContest.set(row.contestId, [row]);
    // changeRows is ordered by created_at, so this is each user's earliest row.
    if (!baseRatings.has(row.userId)) {
      baseRatings.set(row.userId, row.oldRating);
    }
  }

  const chain = new Map(baseRatings);
  const replayedUsers = new Set<string>();
  const writes: WriteRow[] = [];
  const summaries: string[] = [];
  const skipped: string[] = [];
  let totalChangedRows = 0;
  let totalMaxDeltaChange = 0;

  process.stdout.write(
    `rating recompute (${APPLY ? "APPLY" : "DRY RUN"})\n`,
  );
  process.stdout.write(
    `users with a base rating: ${baseRatings.size}\n\n`,
  );

  for (const contest of contestRows) {
    const rows = changesByContest.get(contest.id);
    if (!rows || rows.length === 0) {
      if (contest.ratedAt) skipped.push(`${contest.slug} (no changes)`);
      continue;
    }
    if (contest.format !== "SINGLE") {
      skipped.push(`${contest.slug} (GROUP)`);
      continue;
    }
    if (!contest.ratedAt) {
      skipped.push(`${contest.slug} (unfinalized)`);
      continue;
    }
    if (rows.length < 2) {
      skipped.push(`${contest.slug} (fewer than 2 rows)`);
      continue;
    }

    // Stored ranks are dense; replay needs competition ranks so filtered or
    // missing participants do not compress the field. Tie-break by user id so
    // equal ranks replay deterministically.
    const ordered = [...rows].sort(
      (left, right) =>
        left.rank - right.rank || left.userId.localeCompare(right.userId),
    );
    const compacted = compactRanks(
      ordered.map((row) => ({ userId: row.userId, rank: row.rank })),
    );
    const rankByUser = new Map(
      compacted.map((row) => [row.userId, row.rank]),
    );
    const participants: RatingParticipant[] = ordered.map((row) => {
      const rating = chain.get(row.userId);
      if (rating === undefined) {
        throw new Error(
          `No base rating for user ${row.userId} in ${contest.slug}`,
        );
      }
      return {
        userId: row.userId,
        rank: rankByUser.get(row.userId) ?? row.rank,
        rating,
      };
    });

    const results = computeRatingChanges(participants);
    if (results.length !== ordered.length) {
      throw new Error(
        `${contest.slug}: computed ${results.length} changes for ${ordered.length} rows`,
      );
    }

    const existingByUser = new Map(rows.map((row) => [row.userId, row]));
    let oldSum = 0;
    let newSum = 0;
    let maxDeltaChange = 0;
    let changedRows = 0;

    for (const result of results) {
      if (result.newRating < MINIMUM_RATING) {
        throw new Error(
          `${contest.slug}: ${result.userId} falls below the rating floor`,
        );
      }
      const existing = existingByUser.get(result.userId);
      if (!existing) {
        throw new Error(
          `${contest.slug}: no stored change for user ${result.userId}`,
        );
      }
      oldSum += existing.delta;
      newSum += result.delta;
      maxDeltaChange = Math.max(
        maxDeltaChange,
        Math.abs(result.delta - existing.delta),
      );

      const changed =
        existing.rank !== result.rank ||
        existing.oldRating !== result.oldRating ||
        existing.newRating !== result.newRating ||
        existing.delta !== result.delta;
      if (changed) {
        changedRows += 1;
        writes.push({ contestId: contest.id, ...result });
      }
      chain.set(result.userId, result.newRating);
      replayedUsers.add(result.userId);
    }

    totalChangedRows += changedRows;
    totalMaxDeltaChange = Math.max(totalMaxDeltaChange, maxDeltaChange);
    summaries.push(
      `${contest.slug.padEnd(22)} rows ${String(rows.length).padEnd(3)} sum ${signed(oldSum)} -> ${signed(newSum)}  max|Δdelta| ${String(maxDeltaChange).padEnd(3)} changed ${changedRows}`,
    );
  }

  const userIds = [...replayedUsers];
  const userRows =
    userIds.length > 0
      ? await db
          .select({ id: users.id, username: users.username, rating: users.rating })
          .from(users)
          .where(inArray(users.id, userIds))
      : [];
  const userById = new Map(userRows.map((row) => [row.id, row]));

  const finalRatings = userIds.map((id) => {
    const rating = chain.get(id);
    if (rating === undefined) throw new Error(`No final rating for user ${id}`);
    const user = userById.get(id);
    return {
      id,
      username: user?.username ?? id,
      oldRating: user?.rating ?? null,
      newRating: rating,
    };
  });
  const userUpdates = finalRatings.filter(
    (user) => user.oldRating !== user.newRating,
  );

  if (summaries.length > 0) {
    for (const line of summaries) process.stdout.write(`${line}\n`);
  } else {
    process.stdout.write("no finalized SINGLE contests with changes\n");
  }
  if (skipped.length > 0) {
    process.stdout.write("\nskipped:\n");
    for (const line of skipped) process.stdout.write(`  ${line}\n`);
  }

  process.stdout.write("\nuser ratings (last recomputed new_rating):\n");
  for (const user of finalRatings) {
    const delta =
      user.oldRating === null ? 0 : user.newRating - user.oldRating;
    process.stdout.write(
      `  ${user.username.padEnd(20)} ${user.oldRating ?? "?"} -> ${user.newRating} (${signed(delta)})\n`,
    );
  }
  process.stdout.write(
    `\nchanged rows: ${totalChangedRows}/${changeRows.length}  max|Δdelta| ${totalMaxDeltaChange}\n`,
  );

  if (!APPLY) {
    process.stdout.write(
      "dry run: no writes. Re-run with --apply to persist.\n",
    );
    return;
  }

  const now = new Date();
  await db.transaction(async (tx) => {
    for (const write of writes) {
      await tx
        .update(contestRatingChanges)
        .set({
          rank: write.rank,
          oldRating: write.oldRating,
          newRating: write.newRating,
          delta: write.delta,
          updatedAt: now,
        })
        .where(
          and(
            eq(contestRatingChanges.contestId, write.contestId),
            eq(contestRatingChanges.userId, write.userId),
          ),
        );
    }
    for (const user of userUpdates) {
      await tx
        .update(users)
        .set({ rating: user.newRating, updatedAt: now })
        .where(eq(users.id, user.id));
    }
    await tx.insert(auditLogs).values({
      action: "ratings.recompute",
      entityType: "system",
      metadata: {
        contests: summaries.length,
        changedRows: writes.length,
        users: userUpdates.length,
        appliedAt: now.toISOString(),
      },
    });
  });
  process.stdout.write(
    `applied ${writes.length} row updates and ${userUpdates.length} user rating updates\n`,
  );
}

async function run(): Promise<void> {
  try {
    await main();
  } catch (error: unknown) {
    process.stderr.write(
      error instanceof Error
        ? error.message
        : `recompute failed: ${String(error)}`,
    );
    process.stderr.write("\n");
    process.exitCode = 1;
  } finally {
    await closeDb();
  }
}

void run();
