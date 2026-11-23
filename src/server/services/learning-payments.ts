import { and, count, desc, eq, sql } from "drizzle-orm";
import { errors } from "@/server/api/errors";
import { toOffset } from "@/server/api/validation";
import { getDb } from "@/server/db";
import {
  auditLogs,
  lessonEntitlements,
  paymentOrders,
  users,
} from "@/server/db/schema";
import { isUniqueViolation } from "@/lib/db-errors";
import {
  PAID_MODULES,
  isValidTrxId,
  modulesForProduct,
  normalizeTrxId,
  priceForProduct,
  productLabel,
  type PaidProduct,
} from "@/lib/learning/payments";
import type { SafeUser } from "@/server/auth/session";
import type {
  FreeAccessRequestInput,
  PurchaseOrderInput,
} from "@/lib/schemas/learning-payments";

export const PAYMENT_PAGE_SIZE = 20;

export type PaymentOrderStatus = "PENDING" | "APPROVED" | "REJECTED";

export type PaymentOrderView = {
  id: string;
  kind: "PURCHASE" | "FREE_REQUEST";
  product: PaidProduct;
  moduleSlug: string | null;
  amountBdt: number;
  trxId: string | null;
  senderNumber: string | null;
  userNote: string | null;
  status: PaymentOrderStatus;
  adminNote: string | null;
  reviewedAt: string | null;
  createdAt: string;
  user: { username: string; displayName: string };
  label: string;
};

type OrderRow = {
  id: string;
  kind: string;
  product: string;
  moduleSlug: string | null;
  amountBdt: number;
  trxId: string | null;
  senderNumber: string | null;
  userNote: string | null;
  status: string;
  adminNote: string | null;
  reviewedAt: Date | null;
  createdAt: Date;
  username: string;
  displayName: string;
};

function mapOrder(row: OrderRow): PaymentOrderView {
  const product = row.product === "BUNDLE" ? "BUNDLE" : "MODULE";
  return {
    id: row.id,
    kind: row.kind === "FREE_REQUEST" ? "FREE_REQUEST" : "PURCHASE",
    product,
    moduleSlug: row.moduleSlug,
    amountBdt: row.amountBdt,
    trxId: row.trxId,
    senderNumber: row.senderNumber,
    userNote: row.userNote,
    status:
      row.status === "APPROVED"
        ? "APPROVED"
        : row.status === "REJECTED"
          ? "REJECTED"
          : "PENDING",
    adminNote: row.adminNote,
    reviewedAt: row.reviewedAt ? row.reviewedAt.toISOString() : null,
    createdAt: row.createdAt.toISOString(),
    user: { username: row.username, displayName: row.displayName },
    label: productLabel(product, row.moduleSlug),
  };
}

const orderSelection = {
  id: paymentOrders.id,
  kind: paymentOrders.kind,
  product: paymentOrders.product,
  moduleSlug: paymentOrders.moduleSlug,
  amountBdt: paymentOrders.amountBdt,
  trxId: paymentOrders.trxId,
  senderNumber: paymentOrders.senderNumber,
  userNote: paymentOrders.userNote,
  status: paymentOrders.status,
  adminNote: paymentOrders.adminNote,
  reviewedAt: paymentOrders.reviewedAt,
  createdAt: paymentOrders.createdAt,
  username: users.username,
  displayName: users.displayName,
};

/** Modules this user may open (admins get every premium module). */
export async function getEntitledModuleSlugs(
  userId: string | null,
  role?: string,
): Promise<Set<string>> {
  if (role === "ADMIN") return new Set(PAID_MODULES.map((m) => m.slug));
  if (!userId) return new Set();
  const rows = await getDb()
    .select({ moduleSlug: lessonEntitlements.moduleSlug })
    .from(lessonEntitlements)
    .where(eq(lessonEntitlements.userId, userId));
  return new Set(rows.map((row) => row.moduleSlug));
}

export async function listOwnOrders(userId: string): Promise<PaymentOrderView[]> {
  const rows = await getDb()
    .select(orderSelection)
    .from(paymentOrders)
    .innerJoin(users, eq(users.id, paymentOrders.userId))
    .where(eq(paymentOrders.userId, userId))
    .orderBy(desc(paymentOrders.createdAt))
    .limit(PAYMENT_PAGE_SIZE);
  return rows.map(mapOrder);
}

function assertProduct(
  product: PaidProduct,
  moduleSlug: string | null | undefined,
): string | null {
  if (product === "BUNDLE") return null;
  if (!moduleSlug || !modulesForProduct("MODULE", moduleSlug).length) {
    throw errors.validation("Choose one of the premium modules.");
  }
  return moduleSlug;
}

export async function createPurchaseOrder(
  user: Pick<SafeUser, "id">,
  input: PurchaseOrderInput,
): Promise<PaymentOrderView> {
  const moduleSlug = assertProduct(input.product, input.moduleSlug);
  const amountBdt = priceForProduct(input.product, moduleSlug);
  if (amountBdt === null) throw errors.validation("This product is unavailable.");

  const trxId = normalizeTrxId(input.trxId);
  if (!isValidTrxId(trxId)) {
    throw errors.validation(
      "Enter the transaction ID exactly as it appears in your payment SMS.",
    );
  }

  const db = getDb();
  const [existing] = await db
    .select({ id: paymentOrders.id })
    .from(paymentOrders)
    .where(eq(paymentOrders.trxId, trxId))
    .limit(1);
  if (existing) {
    throw errors.conflict("This transaction ID has already been submitted.");
  }

  const now = new Date();
  try {
    const [row] = await db
      .insert(paymentOrders)
      .values({
        userId: user.id,
        kind: "PURCHASE",
        product: input.product,
        moduleSlug,
        amountBdt,
        trxId,
        senderNumber: input.senderNumber,
        status: "PENDING",
        createdAt: now,
        updatedAt: now,
      })
      .returning({ id: paymentOrders.id });

    if (!row) throw errors.unavailable("Could not save your payment.");

    const [view] = await db
      .select(orderSelection)
      .from(paymentOrders)
      .innerJoin(users, eq(users.id, paymentOrders.userId))
      .where(eq(paymentOrders.id, row.id))
      .limit(1);
    if (!view) throw errors.unavailable("Could not load your payment.");
    return mapOrder(view);
  } catch (error) {
    if (isUniqueViolation(error)) {
      throw errors.conflict("This transaction ID has already been submitted.");
    }
    throw error;
  }
}

export async function createFreeAccessRequest(
  user: Pick<SafeUser, "id">,
  input: FreeAccessRequestInput,
): Promise<PaymentOrderView> {
  const moduleSlug = assertProduct(input.product, input.moduleSlug);
  const db = getDb();

  const duplicate = and(
    eq(paymentOrders.userId, user.id),
    eq(paymentOrders.kind, "FREE_REQUEST"),
    eq(paymentOrders.status, "PENDING"),
    eq(paymentOrders.product, input.product),
    moduleSlug
      ? eq(paymentOrders.moduleSlug, moduleSlug)
      : sql`${paymentOrders.moduleSlug} is null`,
  );
  const [pending] = await db
    .select({ id: paymentOrders.id })
    .from(paymentOrders)
    .where(duplicate)
    .limit(1);
  if (pending) {
    throw errors.conflict("You already have a pending free-access request.");
  }

  const now = new Date();
  const [row] = await db
    .insert(paymentOrders)
    .values({
      userId: user.id,
      kind: "FREE_REQUEST",
      product: input.product,
      moduleSlug,
      amountBdt: 0,
      userNote: input.reason,
      status: "PENDING",
      createdAt: now,
      updatedAt: now,
    })
    .returning({ id: paymentOrders.id });
  if (!row) throw errors.unavailable("Could not save your request.");

  const [view] = await db
    .select(orderSelection)
    .from(paymentOrders)
    .innerJoin(users, eq(users.id, paymentOrders.userId))
    .where(eq(paymentOrders.id, row.id))
    .limit(1);
  if (!view) throw errors.unavailable("Could not load your request.");
  return mapOrder(view);
}

export async function listAdminOrders({
  status = "pending",
  page = 1,
}: {
  status?: "pending" | "all";
  page?: number;
} = {}): Promise<{ items: PaymentOrderView[]; total: number }> {
  const db = getDb();
  const filter =
    status === "pending" ? eq(paymentOrders.status, "PENDING") : undefined;
  const [rows, totals] = await Promise.all([
    db
      .select(orderSelection)
      .from(paymentOrders)
      .innerJoin(users, eq(users.id, paymentOrders.userId))
      .where(filter)
      .orderBy(desc(paymentOrders.createdAt))
      .limit(PAYMENT_PAGE_SIZE)
      .offset(toOffset({ page, pageSize: PAYMENT_PAGE_SIZE })),
    db.select({ value: count() }).from(paymentOrders).where(filter),
  ]);
  return {
    items: rows.map(mapOrder),
    total: Number(totals[0]?.value ?? 0),
  };
}

export async function reviewPaymentOrder(
  orderId: string,
  admin: Pick<SafeUser, "id">,
  action: "APPROVE" | "REJECT",
  note?: string,
): Promise<PaymentOrderView> {
  const db = getDb();
  const now = new Date();

  await db.transaction(async (tx) => {
    const [order] = await tx
      .select({
        id: paymentOrders.id,
        userId: paymentOrders.userId,
        product: paymentOrders.product,
        moduleSlug: paymentOrders.moduleSlug,
        status: paymentOrders.status,
        kind: paymentOrders.kind,
      })
      .from(paymentOrders)
      .where(eq(paymentOrders.id, orderId))
      .for("update")
      .limit(1);

    if (!order) throw errors.notFound("Payment not found.");
    if (order.status !== "PENDING") {
      throw errors.conflict("This payment has already been reviewed.");
    }
    if (action === "REJECT" && (!note || note.trim().length < 3)) {
      throw errors.validation("Add a short reason before rejecting.");
    }

    await tx
      .update(paymentOrders)
      .set({
        status: action === "APPROVE" ? "APPROVED" : "REJECTED",
        adminNote: note?.trim() || null,
        reviewedBy: admin.id,
        reviewedAt: now,
        updatedAt: now,
      })
      .where(eq(paymentOrders.id, orderId));

    if (action === "APPROVE") {
      const product = order.product === "BUNDLE" ? "BUNDLE" : "MODULE";
      const modules = modulesForProduct(product, order.moduleSlug);
      if (modules.length === 0) {
        throw errors.validation("This payment has no modules to unlock.");
      }
      await tx
        .insert(lessonEntitlements)
        .values(
          modules.map((moduleSlug) => ({
            userId: order.userId,
            moduleSlug,
            source: order.kind === "FREE_REQUEST" ? "SCHOLARSHIP" : "PURCHASE",
            orderId: order.id,
            grantedBy: admin.id,
          })),
        )
        .onConflictDoNothing();
    }

    await tx.insert(auditLogs).values({
      actorId: admin.id,
      action:
        action === "APPROVE" ? "payment.approve" : "payment.reject",
      entityType: "payment_order",
      entityId: order.id,
      metadata: { note: note ?? null },
    });
  });

  const [row] = await db
    .select(orderSelection)
    .from(paymentOrders)
    .innerJoin(users, eq(users.id, paymentOrders.userId))
    .where(eq(paymentOrders.id, orderId))
    .limit(1);
  if (!row) throw errors.notFound("Payment not found.");
  return mapOrder(row);
}

export async function grantEntitlements(
  admin: Pick<SafeUser, "id">,
  input: { username: string; product: PaidProduct; moduleSlug?: string | null },
): Promise<{ userId: string; modules: string[]; granted: number }> {
  const db = getDb();
  const [target] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.username, input.username))
    .limit(1);
  if (!target) throw errors.notFound("User not found.");

  const moduleSlug = assertProduct(input.product, input.moduleSlug);
  const modules = modulesForProduct(input.product, moduleSlug);
  if (modules.length === 0) throw errors.validation("Choose a valid product.");

  const inserted = await db
    .insert(lessonEntitlements)
    .values(
      modules.map((slug) => ({
        userId: target.id,
        moduleSlug: slug,
        source: "SCHOLARSHIP" as const,
        grantedBy: admin.id,
      })),
    )
    .onConflictDoNothing()
    .returning({ moduleSlug: lessonEntitlements.moduleSlug });

  await db.insert(auditLogs).values({
    actorId: admin.id,
    action: "entitlement.grant",
    entityType: "user",
    entityId: target.id,
    metadata: { product: input.product, moduleSlug, modules },
  });

  return {
    userId: target.id,
    modules,
    granted: inserted.length,
  };
}
