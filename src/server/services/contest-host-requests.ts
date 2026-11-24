import { and, count, desc, eq, inArray, sql } from "drizzle-orm";
import { errors } from "@/server/api/errors";
import { toOffset, type PaginationInput } from "@/server/api/validation";
import { getDb } from "@/server/db";
import {
  contestHostRequests,
  contests,
  users,
} from "@/server/db/schema";
import {
  checkContestHostWindow,
  isValidContestHostingFee,
} from "@/lib/contest-hosting";
import {
  contestHostPath,
  type ContestHostRequestStatus,
  type ContestHostRequestView,
} from "@/lib/contest-ops";
import type { ContestHostRequestInput } from "@/lib/schemas/contest-ops";
import type { SafeUser } from "@/server/auth/session";
import { notifyUser } from "./notifications";

/** Requests that have not reached a final state yet. */
const OPEN_HOST_REQUEST_STATUSES: ContestHostRequestStatus[] = [
  "SUBMITTED",
  "UNDER_REVIEW",
  "APPROVED",
];

function hostRequestQuery() {
  return getDb()
    .select({
      id: contestHostRequests.id,
      title: contestHostRequests.title,
      description: contestHostRequests.description,
      bannerUrl: contestHostRequests.bannerUrl,
      format: contestHostRequests.format,
      division: contestHostRequests.division,
      startAt: contestHostRequests.startAt,
      endAt: contestHostRequests.endAt,
      teamSize: contestHostRequests.teamSize,
      expectedParticipants: contestHostRequests.expectedParticipants,
      sponsorNote: contestHostRequests.sponsorNote,
      contactEmail: contestHostRequests.contactEmail,
      contactPhone: contestHostRequests.contactPhone,
      feeBdt: contestHostRequests.feeBdt,
      paymentStatus: contestHostRequests.paymentStatus,
      paymentReference: contestHostRequests.paymentReference,
      status: contestHostRequests.status,
      adminNote: contestHostRequests.adminNote,
      createdAt: contestHostRequests.createdAt,
      reviewedAt: contestHostRequests.reviewedAt,
      contestId: contests.id,
      contestSlug: contests.slug,
      contestTitle: contests.title,
      username: users.username,
      displayName: users.displayName,
    })
    .from(contestHostRequests)
    .innerJoin(users, eq(users.id, contestHostRequests.requestedById))
    .leftJoin(contests, eq(contests.id, contestHostRequests.contestId));
}

type HostRequestRow = Awaited<ReturnType<typeof hostRequestQuery>>[number];

function mapHostRequest(row: HostRequestRow): ContestHostRequestView {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    bannerUrl: row.bannerUrl,
    format: row.format,
    division: row.division,
    startAt: row.startAt.toISOString(),
    endAt: row.endAt.toISOString(),
    teamSize: row.teamSize,
    expectedParticipants: row.expectedParticipants,
    sponsorNote: row.sponsorNote,
    contactEmail: row.contactEmail,
    contactPhone: row.contactPhone,
    feeBdt: row.feeBdt,
    paymentStatus: row.paymentStatus,
    paymentReference: row.paymentReference,
    status: row.status,
    adminNote: row.adminNote,
    contest:
      row.contestId && row.contestSlug && row.contestTitle
        ? {
            id: row.contestId,
            slug: row.contestSlug,
            title: row.contestTitle,
          }
        : null,
    requestedBy: { username: row.username, displayName: row.displayName },
    createdAt: row.createdAt.toISOString(),
    reviewedAt: row.reviewedAt?.toISOString() ?? null,
  };
}

async function loadHostRequest(id: string): Promise<ContestHostRequestView> {
  const rows = await hostRequestQuery()
    .where(eq(contestHostRequests.id, id))
    .limit(1);
  const request = rows[0];
  if (!request) throw errors.notFound("Hosting request not found.");
  return mapHostRequest(request);
}

function assertAdmin(actor: Pick<SafeUser, "role">): void {
  if (actor.role !== "ADMIN") {
    throw errors.forbidden("Only an admin can review hosting requests.");
  }
}

export async function createContestHostRequest(
  actor: SafeUser,
  input: ContestHostRequestInput,
): Promise<ContestHostRequestView> {
  if (!isValidContestHostingFee(input.feeBdt)) {
    throw errors.validation("The arrangement fee must be 3000–5000 BDT.");
  }
  const window = checkContestHostWindow(
    new Date(input.startAt),
    new Date(input.endAt),
  );
  if (!window.valid) throw errors.validation(window.message);
  if (new Date(input.startAt).getTime() <= Date.now()) {
    throw errors.validation("Choose a start time in the future.");
  }

  const title = input.title.trim();
  const normalizedTitle = title.toLowerCase();
  const requestId = await getDb().transaction(async (tx) => {
    // Serialises duplicate submits for the same organiser and title.
    await tx.execute(
      sql`select pg_advisory_xact_lock(hashtext(${`contest-host:${actor.id}:${normalizedTitle}`}))`,
    );
    const [duplicate] = await tx
      .select({ id: contestHostRequests.id })
      .from(contestHostRequests)
      .where(
        and(
          eq(contestHostRequests.requestedById, actor.id),
          inArray(contestHostRequests.status, OPEN_HOST_REQUEST_STATUSES),
          sql`lower(${contestHostRequests.title}) = ${normalizedTitle}`,
        ),
      )
      .limit(1);
    if (duplicate) {
      throw errors.conflict(
        "You already have an open hosting request for that title.",
      );
    }

    const paymentReference = input.paymentReference.trim();
    await tx.execute(
      sql`select pg_advisory_xact_lock(hashtext(${`contest-host-trx:${paymentReference}`}))`,
    );
    const [reusedReference] = await tx
      .select({ id: contestHostRequests.id })
      .from(contestHostRequests)
      .where(eq(contestHostRequests.paymentReference, paymentReference))
      .limit(1);
    if (reusedReference) {
      throw errors.conflict(
        "That payment reference is already attached to another hosting request.",
      );
    }

    const [created] = await tx
      .insert(contestHostRequests)
      .values({
        requestedById: actor.id,
        title,
        description: input.description.trim(),
        bannerUrl: input.bannerUrl?.trim() || null,
        format: input.format,
        division: input.division,
        startAt: new Date(input.startAt),
        endAt: new Date(input.endAt),
        teamSize: input.teamSize,
        expectedParticipants: input.expectedParticipants,
        sponsorNote: input.sponsorNote?.trim() || null,
        contactEmail: input.contactEmail.trim(),
        contactPhone: input.contactPhone?.trim() || null,
        feeBdt: input.feeBdt,
        paymentStatus: "PENDING",
        paymentReference,
        status: "SUBMITTED",
      })
      .returning({ id: contestHostRequests.id });
    if (!created) throw errors.conflict("Could not submit the hosting request.");
    return created.id;
  });

  return loadHostRequest(requestId);
}

export async function listMyContestHostRequests(
  userId: string,
): Promise<ContestHostRequestView[]> {
  const rows = await hostRequestQuery()
    .where(eq(contestHostRequests.requestedById, userId))
    .orderBy(desc(contestHostRequests.createdAt))
    .limit(100);
  return rows.map(mapHostRequest);
}

export async function listAdminContestHostRequests(
  page: PaginationInput,
  status?: ContestHostRequestStatus,
): Promise<{ items: ContestHostRequestView[]; total: number }> {
  const db = getDb();
  const where = status ? eq(contestHostRequests.status, status) : undefined;
  const [totalRow] = await db
    .select({ value: count() })
    .from(contestHostRequests)
    .where(where);
  const rows = await hostRequestQuery()
    .where(where)
    .orderBy(desc(contestHostRequests.createdAt))
    .limit(page.pageSize)
    .offset(toOffset(page));
  return {
    total: Number(totalRow?.value ?? 0),
    items: rows.map(mapHostRequest),
  };
}

export async function reviewContestHostRequest(
  actor: SafeUser,
  id: string,
  decision: "UNDER_REVIEW" | "APPROVED" | "REJECTED",
  note: string | null,
): Promise<ContestHostRequestView> {
  assertAdmin(actor);
  const reviewNote = note?.trim() || null;
  if (decision === "REJECTED" && !reviewNote) {
    throw errors.validation("Explain why the hosting request was rejected.");
  }

  const now = new Date();
  const review = await getDb().transaction(async (tx) => {
    const [row] = await tx
      .select({
        status: contestHostRequests.status,
        title: contestHostRequests.title,
        requestedById: contestHostRequests.requestedById,
      })
      .from(contestHostRequests)
      .where(eq(contestHostRequests.id, id))
      .for("update");
    if (!row) throw errors.notFound("Hosting request not found.");
    if (row.status === "CONVERTED") {
      throw errors.conflict(
        "This request is already a scheduled contest; it cannot be reviewed again.",
      );
    }
    await tx
      .update(contestHostRequests)
      .set({
        status: decision,
        // Approval means an admin verified the bKash/Nagad TrxID; the
        // conversion step then requires a paid request.
        ...(decision === "APPROVED" ? { paymentStatus: "PAID" as const } : {}),
        adminNote: reviewNote,
        reviewedById: actor.id,
        reviewedAt: now,
        updatedAt: now,
      })
      .where(eq(contestHostRequests.id, id));
    return { requestedById: row.requestedById };
  });

  const request = await loadHostRequest(id);
  const copy =
    decision === "APPROVED"
      ? {
          title: "Hosting request approved",
          body: `Your request to host "${request.title}" was approved. Watch for payment confirmation and the scheduled contest.${reviewNote ? ` Note: ${reviewNote}` : ""}`,
        }
      : decision === "UNDER_REVIEW"
        ? {
            title: "Hosting request under review",
            body: `An admin is reviewing your request to host "${request.title}".${reviewNote ? ` Note: ${reviewNote}` : ""}`,
          }
        : {
            title: "Hosting request declined",
            body: `Your request to host "${request.title}" was declined.${reviewNote ? ` Note: ${reviewNote}` : ""}`,
          };
  await notifyUser({
    userId: review.requestedById,
    type: "CONTEST_APPROVAL",
    title: copy.title,
    body: copy.body,
    href: contestHostPath(),
    dedupeKey: `contest-host:${request.id}:${decision}`,
  });

  return request;
}

export { convertContestHostRequest } from "./contest-host-conversion";
