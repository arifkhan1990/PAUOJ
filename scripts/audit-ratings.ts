import "dotenv/config";
import postgres from "postgres";

/**
 * Read-only integrity audit for contest ratings. Reports, per rated contest:
 * format, ratedAt, change count, delta sum, rating range, old->new chain
 * breaks, plus cross-contest checks: users.rating drift against the latest
 * change, changes on GROUP/unfinalized contests, floor violations, and the
 * profile ratedUserCount versus distinct rated users.
 *
 * Exit code 1 only on critical integrity issues (chain breaks, floor
 * violations, changes on GROUP/unfinalized contests, live rating drift).
 * Historical +/-1 delta sums, early finalization and overdue unfinalized
 * contests are warnings; with --strict they also fail the run. Contests with
 * no rating changes (GROUP or fewer than two participants) are informational.
 * Never writes to the DB.
 */

type ContestRow = {
  slug: string;
  format: string;
  ratedAt: Date | null;
  endAt: Date;
  changes: number;
  sumDelta: number;
  minRating: number | null;
  maxRating: number | null;
  floorViolations: number;
};

type BreakRow = { contestId: string; breaks: number };
type FlaggedRow = { slug: string; format: string; ratedAt: Date | null; changes: number };
type UnratedRow = { slug: string; format: string };
type UserStatsRow = { rated: number; bannedRated: number };
type OverdueRow = { slug: string; endAt: Date };

const MINIMUM_RATING = 100;
const strict = process.argv.includes("--strict");

function formatDate(date: Date | null): string {
  return date ? date.toISOString().slice(0, 10) : "unfinalized";
}

function signed(value: number): string {
  return value > 0 ? `+${value}` : `${value}`;
}

async function main(): Promise<void> {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required (see .env.example)");
  }
  const sql = postgres(databaseUrl, { max: 1 });

  let critical = 0;
  let warnings = 0;

  try {
    const [contests, breaks, flagged, unrated, userStats, driftRows, overdue] =
      await Promise.all([
        sql<ContestRow[]>`
          select c.slug, c.format, c.rated_at as "ratedAt", c.end_at as "endAt",
                 count(r.user_id)::int as changes,
                 coalesce(sum(r.delta), 0)::int as "sumDelta",
                 min(r.new_rating)::int as "minRating",
                 max(r.new_rating)::int as "maxRating",
                 count(*) filter (
                   where r.old_rating < ${MINIMUM_RATING}
                      or r.new_rating < ${MINIMUM_RATING}
                 )::int as "floorViolations"
          from contests c
          left join contest_rating_changes r on r.contest_id = c.id
          where c.rated_at is not null or r.contest_id is not null
          group by c.id, c.slug, c.format, c.rated_at, c.end_at
          order by c.rated_at nulls last, c.slug
        `,
        sql<BreakRow[]>`
          with ordered as (
            select contest_id, user_id, old_rating,
                   lag(new_rating) over (
                     partition by user_id order by created_at, contest_id
                   ) as prev_rating
            from contest_rating_changes
          )
          select contest_id as "contestId", count(*)::int as breaks
          from ordered
          where prev_rating is not null and old_rating <> prev_rating
          group by contest_id
        `,
        sql<FlaggedRow[]>`
          select c.slug, c.format, c.rated_at as "ratedAt", count(*)::int as changes
          from contests c
          join contest_rating_changes r on r.contest_id = c.id
          where c.format = 'GROUP' or c.rated_at is null
          group by c.slug, c.format, c.rated_at
          order by c.slug
        `,
        sql<UnratedRow[]>`
          select c.slug, c.format
          from contests c
          where c.rated_at is not null
            and not exists (
              select 1 from contest_rating_changes r where r.contest_id = c.id
            )
          order by c.slug
        `,
        sql<UserStatsRow[]>`
          select count(distinct r.user_id)::int as rated,
                 count(distinct r.user_id)
                   filter (where u.is_banned)::int as "bannedRated"
          from contest_rating_changes r
          join users u on u.id = r.user_id
        `,
        sql<{ drifted: number }[]>`
          with latest as (
            select distinct on (user_id) user_id, new_rating
            from contest_rating_changes
            order by user_id, created_at desc, contest_id desc
          )
          select count(*)::int as drifted
          from latest l
          join users u on u.id = l.user_id
          where u.rating <> l.new_rating
        `,
        sql<OverdueRow[]>`
          select c.slug, c.end_at as "endAt"
          from contests c
          where c.rated_at is null
            and c.end_at <= ${new Date(Date.now() - 60 * 60 * 1000)}
          order by c.end_at, c.id
        `,
      ]);

    const breaksByContest = new Map(breaks.map((row) => [row.contestId, row.breaks]));
    const contestIds = await sql<{ id: string; slug: string }[]>`
      select id, slug from contests where rated_at is not null
    `;
    const breaksBySlug = new Map(
      contestIds.map((row) => [row.slug, breaksByContest.get(row.id) ?? 0]),
    );

    process.stdout.write(`contest rating audit${strict ? " (strict)" : ""}\n`);
    process.stdout.write(
      "slug                format   ratedAt      changes  sum      ratings     flags\n",
    );

    let totalChanges = 0;
    for (const contest of contests) {
      const chainBreaks = breaksBySlug.get(contest.slug) ?? 0;
      const flags: string[] = [];
      if (contest.floorViolations > 0) {
        flags.push(`floor-violations=${contest.floorViolations}`);
        critical += 1;
      }
      if (chainBreaks > 0) {
        flags.push(`chain-breaks=${chainBreaks}`);
        critical += 1;
      }
      if (contest.format === "GROUP" && contest.changes > 0) {
        flags.push("group-with-changes");
        critical += 1;
      }
      if (contest.ratedAt === null) {
        flags.push("unfinalized-with-changes");
        critical += 1;
      }
      if (
        contest.ratedAt !== null &&
        contest.ratedAt.getTime() <
          contest.endAt.getTime() + 60 * 60 * 1000
      ) {
        flags.push("finalized-early");
        warnings += 1;
      }
      if (contest.changes === 0) {
        // Expected for GROUP contests or fields with fewer than two submitted
        // participants; informational, not an integrity warning.
        flags.push("no-changes");
      } else if (contest.sumDelta !== 0) {
        flags.push(`sum!=0`);
        warnings += 1;
      }
      totalChanges += contest.changes;
      const range =
        contest.minRating === null || contest.maxRating === null
          ? "-"
          : `${contest.minRating}..${contest.maxRating}`;
      process.stdout.write(
        `${contest.slug.padEnd(19)} ${contest.format.padEnd(8)} ${formatDate(contest.ratedAt).padEnd(11)} ${String(contest.changes).padEnd(8)} ${signed(contest.sumDelta).padEnd(7)} ${range.padEnd(11)} ${flags.join(" ")}\n`,
      );
    }

    const drift = driftRows[0]?.drifted ?? 0;
    if (drift > 0) {
      process.stdout.write(
        `rating drift: ${drift} user(s) diverge from latest change\n`,
      );
      critical += 1;
    } else {
      process.stdout.write("rating drift: none\n");
    }

    const [stats] = userStats;
    const profileCount = (stats?.rated ?? 0) - (stats?.bannedRated ?? 0);
    process.stdout.write(
      `rated users: ${stats?.rated ?? 0} total, profiles show ${profileCount} (${stats?.bannedRated ?? 0} banned excluded)\n`,
    );

    if (unrated.length > 0) {
      process.stdout.write(
        `finalized but unrated: ${unrated.map((row) => row.slug).join(", ")}\n`,
      );
    }
    if (flagged.length > 0) {
      process.stdout.write(
        `changes on GROUP/unfinalized: ${flagged
          .map((row) => `${row.slug} (${row.format}, ${row.changes})`)
          .join(", ")}\n`,
      );
    }
    if (overdue.length > 0) {
      warnings += overdue.length;
      process.stdout.write(
        `overdue unfinalized: ${overdue
          .map((row) => `${row.slug} (ended ${row.endAt.toISOString()})`)
          .join(", ")}\n`,
      );
    }

    process.stdout.write(
      `contests: ${contests.length} | changes: ${totalChanges} | critical: ${critical} | warnings: ${warnings}\n`,
    );
  } finally {
    await sql.end({ timeout: 5 });
  }

  if (critical > 0 || (strict && warnings > 0)) {
    process.exit(1);
  }
}

main().catch((error: unknown) => {
  process.stderr.write(
    error instanceof Error ? error.message : `audit failed: ${String(error)}`,
  );
  process.stderr.write("\n");
  process.exit(1);
});
