import { and, count, desc, eq } from "drizzle-orm";
import { errors } from "@/server/api/errors";
import { toOffset, type PaginationInput } from "@/server/api/validation";
import { getDb } from "@/server/db";
import {
  contestSponsors,
  contests,
  users,
} from "@/server/db/schema";
import {
  publicSponsorBadges,
  type ContestSponsorBadge,
  type ContestSponsorStatus,
  type ContestSponsorTier,
} from "@/lib/contest-ops";
import type { ContestSponsorRequestInput } from "@/lib/schemas/contest-ops";
import type { SafeUser } from "@/server/auth/session";
import { isContestStaff } from "./contest-staff";
import { notifyUser } from "./notifications";

export type ContestSponsorAdminItem = {
  id: string;
  name: string;
  tier: ContestSponsorTier;
  status: ContestSponsorStatus;
  websiteUrl: string | null;
  logoUrl: string | null;
  message: string | null;
  amountBdt: number | null;
  reviewNote: string | null;
  reviewedAt: string | null;
  createdAt: string;
  contest: { id: string; slug: string; title: string };
  requestedBy: { username: string; displayName: string } | null;
};

function normalizeSponsorUrl(
  value: string | undefined,
  label: string,
): string | null {
  const trimmed = value?.trim();
  if (!trimmed) return null;
  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    throw errors.validation(`${label} must be a valid http(s) URL.`);
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw errors.validation(`${label} must start with http:// or https://.`);
  }
  return parsed.toString();
}

function assertAdmin(actor: Pick<SafeUser, "role">): void {
  if (actor.role !== "ADMIN") {
    throw errors.forbidden("Only an admin can review sponsorship requests.");
  }
}

export async function requestContestSponsorship(
  actor: SafeUser,
  slug: string,
  input: ContestSponsorRequestInput,
): Promise<{ id: string; status: "PENDING" }> {
  const db = getDb();
  const [contest] = await db
    .select({
      id: contests.id,
      slug: contests.slug,
      isPublic: contests.isPublic,
      createdBy: contests.createdBy,
    })
    .from(contests)
    .where(eq(contests.slug, slug))
    .limit(1);
  if (!contest) throw errors.notFound("Contest not found.");
  if (!contest.isPublic) {
    const privileged =
      actor.role === "ADMIN" ||
      contest.createdBy === actor.id ||
      (await isContestStaff(contest.id, actor.id)) !== null;
    if (!privileged) throw errors.notFound("Contest not found.");
  }

  if (
    input.amountBdt !== undefined &&
    (!Number.isInteger(input.amountBdt) || input.amountBdt < 0)
  ) {
    throw errors.validation("Sponsorship amounts must be a whole BDT value.");
  }

  const [created] = await db
    .insert(contestSponsors)
    .values({
      contestId: contest.id,
      name: input.name.trim(),
      tier: input.tier,
      websiteUrl: normalizeSponsorUrl(input.websiteUrl, "Website URL"),
      logoUrl: normalizeSponsorUrl(input.logoUrl, "Logo URL"),
      message: input.message?.trim() || null,
      amountBdt: input.amountBdt ?? null,
      status: "PENDING",
      requestedById: actor.id,
    })
    .returning({ id: contestSponsors.id });
  if (!created) throw errors.conflict("Could not submit the sponsorship request.");
  return { id: created.id, status: "PENDING" };
}

export async function listApprovedContestSponsors(
  contestId: string,
): Promise<ContestSponsorBadge[]> {
  const rows = await getDb()
    .select({
      id: contestSponsors.id,
      name: contestSponsors.name,
      tier: contestSponsors.tier,
      websiteUrl: contestSponsors.websiteUrl,
      logoUrl: contestSponsors.logoUrl,
      message: contestSponsors.message,
    })
    .from(contestSponsors)
    .where(
      and(
        eq(contestSponsors.contestId, contestId),
        eq(contestSponsors.status, "APPROVED"),
      ),
    )
    .orderBy(desc(contestSponsors.createdAt));
  return publicSponsorBadges(rows);
}

export async function listAdminContestSponsors(
  page: PaginationInput,
  status?: ContestSponsorStatus,
): Promise<{ items: ContestSponsorAdminItem[]; total: number }> {
  const db = getDb();
  const where = status ? eq(contestSponsors.status, status) : undefined;
  const [totalRow] = await db
    .select({ value: count() })
    .from(contestSponsors)
    .where(where);
  const rows = await db
    .select({
      id: contestSponsors.id,
      name: contestSponsors.name,
      tier: contestSponsors.tier,
      status: contestSponsors.status,
      websiteUrl: contestSponsors.websiteUrl,
      logoUrl: contestSponsors.logoUrl,
      message: contestSponsors.message,
      amountBdt: contestSponsors.amountBdt,
      reviewNote: contestSponsors.reviewNote,
      reviewedAt: contestSponsors.reviewedAt,
      createdAt: contestSponsors.createdAt,
      contestId: contests.id,
      contestSlug: contests.slug,
      contestTitle: contests.title,
      username: users.username,
      displayName: users.displayName,
    })
    .from(contestSponsors)
    .innerJoin(contests, eq(contests.id, contestSponsors.contestId))
    .leftJoin(users, eq(users.id, contestSponsors.requestedById))
    .where(where)
    .orderBy(desc(contestSponsors.createdAt))
    .limit(page.pageSize)
    .offset(toOffset(page));

  return {
    total: Number(totalRow?.value ?? 0),
    items: rows.map((row) => ({
      id: row.id,
      name: row.name,
      tier: row.tier,
      status: row.status,
      websiteUrl: row.websiteUrl,
      logoUrl: row.logoUrl,
      message: row.message,
      amountBdt: row.amountBdt,
      reviewNote: row.reviewNote,
      reviewedAt: row.reviewedAt?.toISOString() ?? null,
      createdAt: row.createdAt.toISOString(),
      contest: {
        id: row.contestId,
        slug: row.contestSlug,
        title: row.contestTitle,
      },
      requestedBy:
        row.username && row.displayName
          ? { username: row.username, displayName: row.displayName }
          : null,
    })),
  };
}

export async function reviewContestSponsorship(
  actor: SafeUser,
  contestId: string,
  sponsorId: string,
  decision: "APPROVED" | "REJECTED",
  note: string | null,
): Promise<void> {
  assertAdmin(actor);
  const reviewNote = note?.trim() || null;
  if (decision === "REJECTED" && !reviewNote) {
    throw errors.validation("Explain why the sponsorship was rejected.");
  }

  const sponsor = await getDb().transaction(async (tx) => {
    const [row] = await tx
      .select({
        id: contestSponsors.id,
        name: contestSponsors.name,
        requestedById: contestSponsors.requestedById,
        contestSlug: contests.slug,
        contestTitle: contests.title,
      })
      .from(contestSponsors)
      .innerJoin(contests, eq(contests.id, contestSponsors.contestId))
      .where(
        and(
          eq(contestSponsors.id, sponsorId),
          eq(contestSponsors.contestId, contestId),
        ),
      )
      .for("update");
    if (!row) throw errors.notFound("Sponsorship request not found.");

    const now = new Date();
    await tx
      .update(contestSponsors)
      .set({
        status: decision,
        reviewedById: actor.id,
        reviewNote,
        reviewedAt: now,
        updatedAt: now,
      })
      .where(eq(contestSponsors.id, sponsorId));
    return row;
  });

  if (!sponsor.requestedById) return;
  await notifyUser({
    userId: sponsor.requestedById,
    type: "CONTEST_APPROVAL",
    title:
      decision === "APPROVED"
        ? "Sponsorship approved"
        : "Sponsorship request declined",
    body:
      decision === "APPROVED"
        ? `"${sponsor.name}" is now a public sponsor of "${sponsor.contestTitle}".`
        : `"${sponsor.name}" was not approved for "${sponsor.contestTitle}".${reviewNote ? ` Note: ${reviewNote}` : ""}`,
    href: `/contests/${sponsor.contestSlug}`,
    dedupeKey: `contest-sponsor:${sponsorId}:${decision}`,
  });
}
