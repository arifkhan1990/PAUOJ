import { eq } from "drizzle-orm";
import { errors } from "@/server/api/errors";
import { getDb } from "@/server/db";
import {
  contestHostRequests,
  contestStaff,
  contests,
} from "@/server/db/schema";
import { slugify } from "@/lib/utils";
import type { SafeUser } from "@/server/auth/session";
import { notifyUser } from "./notifications";

function assertAdmin(actor: Pick<SafeUser, "role">): void {
  if (actor.role !== "ADMIN") {
    throw errors.forbidden("Only an admin can review hosting requests.");
  }
}

export async function convertContestHostRequest(
  actor: SafeUser,
  id: string,
): Promise<{ contestId: string; slug: string }> {
  assertAdmin(actor);

  const converted = await getDb().transaction(async (tx) => {
    const [request] = await tx
      .select()
      .from(contestHostRequests)
      .where(eq(contestHostRequests.id, id))
      .for("update");
    if (!request) throw errors.notFound("Hosting request not found.");
    if (request.status === "CONVERTED") {
      throw errors.conflict("This request has already been converted.");
    }
    if (request.status !== "APPROVED" && request.status !== "UNDER_REVIEW") {
      throw errors.conflict("Approve the hosting request before scheduling it.");
    }
    if (request.paymentStatus !== "PAID") {
      throw errors.conflict(
        "Record the arrangement fee as paid before scheduling this contest.",
      );
    }
    if (request.startAt.getTime() <= Date.now()) {
      throw errors.conflict(
        "This request's start time has already passed. Ask the organiser to submit a new window.",
      );
    }

    const now = new Date();
    const baseSlug = slugify(request.title) || "hosted-contest";
    let contest: { id: string; slug: string } | null = null;
    for (let attempt = 0; attempt < 25 && !contest; attempt += 1) {
      const slug = attempt === 0 ? baseSlug : `${baseSlug}-${attempt + 1}`;
      const [created] = await tx
        .insert(contests)
        .values({
          slug,
          title: request.title,
          description: request.description,
          bannerUrl: request.bannerUrl,
          startAt: request.startAt,
          endAt: request.endAt,
          isPublic: false,
          division: request.division,
          format: request.format,
          teamSize: request.teamSize,
          isOfficial: false,
          autoCreated: false,
          feeStatus: "PAID",
          feeBdt: request.feeBdt,
          feeReference: request.paymentReference,
          requiresFreshProblems: true,
          createdBy: request.requestedById,
        })
        .onConflictDoNothing({ target: contests.slug })
        .returning({ id: contests.id, slug: contests.slug });
      if (created) contest = created;
    }
    if (!contest) {
      throw errors.conflict(
        "Could not allocate a contest slug. Adjust the request title and retry.",
      );
    }

    await tx
      .insert(contestStaff)
      .values({
        contestId: contest.id,
        userId: request.requestedById,
        role: "DIRECTOR",
        status: "ACCEPTED",
        invitedById: actor.id,
        respondedAt: now,
        updatedAt: now,
      })
      .onConflictDoNothing();

    await tx
      .update(contestHostRequests)
      .set({
        status: "CONVERTED",
        contestId: contest.id,
        reviewedById: actor.id,
        reviewedAt: now,
        updatedAt: now,
      })
      .where(eq(contestHostRequests.id, id));

    return {
      contestId: contest.id,
      slug: contest.slug,
      title: request.title,
      requestedById: request.requestedById,
    };
  });

  await notifyUser({
    userId: converted.requestedById,
    type: "SYSTEM",
    title: "Your contest is scheduled",
    body: `"${converted.title}" now exists as a private draft contest. You are the contest director; ask the contest team to attach fresh problems, then publish it.`,
    href: `/contests/${converted.slug}`,
    dedupeKey: `contest-host:${id}:converted`,
  });

  return { contestId: converted.contestId, slug: converted.slug };
}
