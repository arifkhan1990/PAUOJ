import { asc, eq } from "drizzle-orm";
import { errors } from "@/server/api/errors";
import { getDb } from "@/server/db";
import { contestSponsors, contests } from "@/server/db/schema";
import type { ContestOperationsDetail } from "@/lib/contest-ops";
import { getContestIntegritySummary } from "./contest-integrity-events";
import {
  listContestCandidates,
  listContestStaff,
  listContestStaffNotes,
} from "./contest-staff";

async function listOperationsSponsors(
  contestId: string,
): Promise<ContestOperationsDetail["sponsors"]> {
  const rows = await getDb()
    .select({
      id: contestSponsors.id,
      name: contestSponsors.name,
      tier: contestSponsors.tier,
      status: contestSponsors.status,
      amountBdt: contestSponsors.amountBdt,
      websiteUrl: contestSponsors.websiteUrl,
      reviewedAt: contestSponsors.reviewedAt,
    })
    .from(contestSponsors)
    .where(eq(contestSponsors.contestId, contestId))
    .orderBy(asc(contestSponsors.createdAt));
  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    tier: row.tier,
    status: row.status,
    amountBdt: row.amountBdt,
    websiteUrl: row.websiteUrl,
    reviewedAt: row.reviewedAt?.toISOString() ?? null,
  }));
}

/**
 * One aggregate for the crew workspace page. Batched by construction: the
 * five sources are independent queries fired together, never per row.
 */
export async function getContestOperationsDetail(
  contestId: string,
): Promise<ContestOperationsDetail> {
  const [contest] = await getDb()
    .select({
      id: contests.id,
      slug: contests.slug,
      title: contests.title,
      format: contests.format,
      teamSize: contests.teamSize,
      startAt: contests.startAt,
      endAt: contests.endAt,
      isOfficial: contests.isOfficial,
      feeStatus: contests.feeStatus,
      feeBdt: contests.feeBdt,
      requiresFreshProblems: contests.requiresFreshProblems,
      seriesId: contests.seriesId,
    })
    .from(contests)
    .where(eq(contests.id, contestId))
    .limit(1);
  if (!contest) throw errors.notFound("Contest not found.");

  const [staff, notes, candidates, sponsors, integrity] = await Promise.all([
    listContestStaff(contest.id),
    listContestStaffNotes(contest.id),
    listContestCandidates(contest.id),
    listOperationsSponsors(contest.id),
    getContestIntegritySummary(contest.id),
  ]);

  return {
    contest: {
      id: contest.id,
      slug: contest.slug,
      title: contest.title,
      format: contest.format,
      teamSize: contest.teamSize,
      startAt: contest.startAt.toISOString(),
      endAt: contest.endAt.toISOString(),
      isOfficial: contest.isOfficial,
      feeStatus: contest.feeStatus,
      feeBdt: contest.feeBdt,
      requiresFreshProblems: contest.requiresFreshProblems,
      seriesId: contest.seriesId,
    },
    staff,
    notes,
    candidates,
    sponsors,
    integrity,
  };
}
