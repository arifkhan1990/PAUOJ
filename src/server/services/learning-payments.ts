import { and, count, desc, eq, sql } from "drizzle-orm";
import { errors } from "@/server/api/errors";
import { toOffset } from "@/server/api/validation";
import { getDb } from "@/server/db";
import {
  lessonEntitlements,
  paymentOrders,
  users,
} from "@/server/db/schema";
import { isUniqueViolation } from "@/lib/db-errors";
import {
  ADVANCED_SQL,
  PAID_MODULES,
  isValidTrxId,
  modulesForProduct,
  normalizeTrxId,
  priceForProduct,
  productLabel,
  type PaidProduct,
} from "@/lib/learning/payments";
import type { SafeUser } from "@/server/auth/session";
import { logger } from "@/server/logger";
import type {
  FreeAccessRequestInput,
  PurchaseOrderInput,
} from "@/lib/schemas/learning-payments";
import { notifyAdminsOfNewOrder } from "./admin-order-notify";
import { notifyUser } from "./notifications";

export {
  ADMIN_ORDER_NOTIFICATION_CAP,
  ADMIN_ORDER_NOTIFICATION_WINDOW_MS,
  adminOrderDigestKey,
  adminOrderNotification,
  notifyAdminsOfNewOrder,
  underAdminOrderNotificationCap,
} from "./admin-order-notify";

export const PAYMENT_PAGE_SIZE = 20;

export type PaymentOrderStatus =
  | "PENDING"
  | "APPROVED"
  | "REJECTED"
  | "REVOKED";

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

export type OrderRow = {
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

export function mapOrder(row: OrderRow): PaymentOrderView {
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
          : row.status === "REVOKED"
            ? "REVOKED"
            : "PENDING",
    adminNote: row.adminNote,
    reviewedAt: row.reviewedAt ? row.reviewedAt.toISOString() : null,
    createdAt: row.createdAt.toISOString(),
    user: { username: row.username, displayName: row.displayName },
    label: productLabel(product, row.moduleSlug),
  };
}

export async function countPendingPaymentOrders(): Promise<number> {
  const [row] = await getDb()
    .select({ value: count() })
    .from(paymentOrders)
    .where(eq(paymentOrders.status, "PENDING"));
  return Number(row?.value ?? 0);
}

/**
 * Acknowledge a submitted order. The learner already gets it in-app; email
 * delivery still follows the `emailLearning` preference.
 */
async function notifyPaymentReceived(
  userId: string,
  title: string,
  body: string,
  dedupeKey: string,
): Promise<void> {
  try {
    await notifyUser({
      userId,
      type: "LEARNING_PAYMENT",
      title,
      body,
      href: "/learn/pricing",
      dedupeKey,
    });
  } catch (error) {
    logger.warn("Could not send the payment received notification", {
      userId,
      dedupeKey,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

export const orderSelection = {
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
  if (role === "ADMIN")
    return new Set([...PAID_MODULES.map((m) => m.slug), ADVANCED_SQL.slug]);
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

export function assertProduct(
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
    const order = mapOrder(view);
    await notifyPaymentReceived(
      user.id,
      `Payment received: ${order.label}`,
      "We received your payment details and will verify them shortly.",
      `payment-submitted:${order.id}`,
    );
    await notifyAdminsOfNewOrder(order);
    return order;
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
  const order = mapOrder(view);
  await notifyPaymentReceived(
    user.id,
    `Free access request received: ${order.label}`,
    "We received your free-access request and will review it shortly.",
    `free-request:${order.id}`,
  );
  await notifyAdminsOfNewOrder(order);
  return order;
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

export async function hasModuleEntitlement(
  userId: string,
  moduleSlug: string,
): Promise<boolean> {
  const [row] = await getDb()
    .select({ id: lessonEntitlements.id })
    .from(lessonEntitlements)
    .where(
      and(
        eq(lessonEntitlements.userId, userId),
        eq(lessonEntitlements.moduleSlug, moduleSlug),
      ),
    )
    .limit(1);
  return Boolean(row);
}
