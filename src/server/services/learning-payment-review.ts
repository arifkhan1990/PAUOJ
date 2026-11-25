import { and, eq } from "drizzle-orm";
import { errors } from "@/server/api/errors";
import { getDb } from "@/server/db";
import {
  auditLogs,
  lessonEntitlements,
  paymentOrders,
  users,
} from "@/server/db/schema";
import { modulesForProduct, productLabel, type PaidProduct } from "@/lib/learning/payments";
import { logger } from "@/server/logger";
import type { SafeUser } from "@/server/auth/session";
import { notifyUser } from "./notifications";
import {
  assertProduct,
  mapOrder,
  orderSelection,
  type PaymentOrderView,
} from "./learning-payments";

async function notifyOrderUser(
  orderId: string,
  decision: "APPROVED" | "REJECTED" | "REVOKED",
  note?: string | null,
): Promise<void> {
  try {
    const db = getDb();
    const [order] = await db
      .select({
        userId: paymentOrders.userId,
        product: paymentOrders.product,
        moduleSlug: paymentOrders.moduleSlug,
      })
      .from(paymentOrders)
      .where(eq(paymentOrders.id, orderId))
      .limit(1);
    if (!order) return;

    const label = productLabel(
      order.product === "BUNDLE" ? "BUNDLE" : "MODULE",
      order.moduleSlug,
    );
    const titles = {
      APPROVED: "Premium access approved",
      REJECTED: "Payment rejected",
      REVOKED: "Premium access revoked",
    } as const;
    const details = note ? ` Note: ${note}` : "";

    await notifyUser({
      userId: order.userId,
      type: "LEARNING_PAYMENT",
      title: titles[decision],
      body:
        decision === "APPROVED"
          ? `${label} is unlocked. Open the pricing page to continue.`
          : decision === "REJECTED"
            ? `We could not verify your payment for ${label}.${details}`
            : `Your access to ${label} was revoked.${details}`,
      href: "/learn/pricing",
      dedupeKey: `payment:${orderId}:${decision.toLowerCase()}`,
    });
  } catch (error) {
    logger.warn("Could not send the payment decision notification", {
      orderId,
      error: error instanceof Error ? error.message : String(error),
    });
  }
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

  await notifyOrderUser(
    orderId,
    action === "APPROVE" ? "APPROVED" : "REJECTED",
    note,
  );

  const [row] = await db
    .select(orderSelection)
    .from(paymentOrders)
    .innerJoin(users, eq(users.id, paymentOrders.userId))
    .where(eq(paymentOrders.id, orderId))
    .limit(1);
  if (!row) throw errors.notFound("Payment not found.");
  return mapOrder(row);
}

export async function revokePaymentOrder(
  orderId: string,
  admin: Pick<SafeUser, "id">,
  note?: string,
): Promise<PaymentOrderView> {
  const reason = note?.trim();
  if (!reason || reason.length < 3) {
    throw errors.validation("Add a short reason before revoking.");
  }

  const db = getDb();
  const now = new Date();

  await db.transaction(async (tx) => {
    const [order] = await tx
      .select({
        id: paymentOrders.id,
        userId: paymentOrders.userId,
        status: paymentOrders.status,
      })
      .from(paymentOrders)
      .where(eq(paymentOrders.id, orderId))
      .for("update")
      .limit(1);

    if (!order) throw errors.notFound("Payment not found.");
    if (order.status !== "APPROVED") {
      throw errors.conflict("Only approved payments can be revoked.");
    }

    await tx
      .delete(lessonEntitlements)
      .where(
        and(
          eq(lessonEntitlements.orderId, order.id),
          eq(lessonEntitlements.userId, order.userId),
        ),
      );

    await tx
      .update(paymentOrders)
      .set({
        status: "REVOKED",
        adminNote: reason,
        reviewedBy: admin.id,
        reviewedAt: now,
        updatedAt: now,
      })
      .where(eq(paymentOrders.id, orderId));

    await tx.insert(auditLogs).values({
      actorId: admin.id,
      action: "payment.revoke",
      entityType: "payment_order",
      entityId: order.id,
      metadata: { note: reason },
    });
  });

  await notifyOrderUser(orderId, "REVOKED", reason);

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
