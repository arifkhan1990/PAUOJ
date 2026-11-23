import type { Metadata } from "next";
import Link from "next/link";
import { BadgeCheck, QrCode, ShieldCheck, Sparkles } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { PaymentForm } from "@/features/learning/payment-form";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  BUNDLE_PRICE_BDT,
  MODULE_PRICE_BDT,
  PAID_MODULES,
  getPaidModule,
} from "@/lib/learning/payments";
import { getCurrentUser } from "@/server/auth/session";
import { getEntitledModuleSlugs, listOwnOrders } from "@/server/services/learning-payments";
import { getPaymentMethods } from "@/server/services/payment-config";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Premium learning access",
  description:
    "Unlock learning modules 3–7 with bKash/City Bank and manual TrxID approval, or request free access.",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

const STATUS_VARIANT = {
  PENDING: "warning",
  APPROVED: "success",
  REJECTED: "muted",
} as const;

export default async function LearningPricingPage() {
  const user = await getCurrentUser();
  const methods = user ? getPaymentMethods() : [];
  const [orders, entitled] = await Promise.all([
    user ? listOwnOrders(user.id) : Promise.resolve([]),
    getEntitledModuleSlugs(user?.id ?? null, user?.role),
  ]);

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <PageHeader
        eyebrow="Premium"
        title="Unlock modules 3–7"
        description="Modules 1–2 are free forever. Premium modules are unlocked with a bKash/Nagad transfer and a manual TrxID check — no card or payment gateway required."
        actions={
          <Link
            href="/learn"
            className={buttonVariants({ variant: "outline" })}
          >
            Back to tracks
          </Link>
        }
      />

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <Card className="p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Free
          </p>
          <p className="mt-2 text-2xl font-semibold">৳0</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Modules 1–2, all concept notes, practice sets and checkpoints.
          </p>
        </Card>
        <Card className="p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Per module
          </p>
          <p className="mt-2 text-2xl font-semibold">৳{MODULE_PRICE_BDT}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Unlock one module (3, 4, 5, 6 or 7) permanently.
          </p>
        </Card>
        <Card className="border-primary/40 bg-primary/[0.04] p-5">
          <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-primary">
            <Sparkles className="size-3.5" aria-hidden="true" />
            Bundle
          </p>
          <p className="mt-2 text-2xl font-semibold">৳{BUNDLE_PRICE_BDT}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            All five premium modules — save ৳
            {PAID_MODULES.length * MODULE_PRICE_BDT - BUNDLE_PRICE_BDT}.
          </p>
        </Card>
      </div>

      <section className="mt-8 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <Card className="p-5">
          <h2 className="flex items-center gap-2 text-sm font-semibold">
            <QrCode className="size-4 text-primary" aria-hidden="true" />
            How to pay
          </h2>
          <ol className="mt-3 space-y-2 text-sm leading-relaxed text-muted-foreground">
            <li>
              <span className="font-medium text-foreground">1.</span> Send ৳
              {MODULE_PRICE_BDT} (or ৳{BUNDLE_PRICE_BDT}) by bKash Send Money or
              a City Bank transfer.
            </li>
            <li>
              <span className="font-medium text-foreground">2.</span> Submit the
              TrxID and sender number in the form below.
            </li>
            <li>
              <span className="font-medium text-foreground">3.</span> An admin
              verifies the transaction and unlocks the module (usually within a
              few hours).
            </li>
          </ol>

          {user ? (
            methods.length > 0 ? (
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {methods.map((method) => (
                  <div
                    key={method.id}
                    className="rounded-lg border border-border bg-muted/20 p-3"
                  >
                    <p className="text-xs font-semibold">{method.label}</p>
                    {method.accountNumber ? (
                      <p className="mt-1 font-mono text-sm font-semibold tracking-wide">
                        {method.accountNumber}
                      </p>
                    ) : null}
                    {method.accountName ? (
                      <p className="text-[11px] text-muted-foreground">
                        {method.accountName}
                      </p>
                    ) : null}
                    {method.qrUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element -- served from the authenticated private QR route.
                      <img
                        src={method.qrUrl}
                        alt={`${method.label} QR code`}
                        width={144}
                        height={144}
                        className="mt-2 size-36 rounded-md bg-white p-1"
                        loading="lazy"
                      />
                    ) : null}
                    <p className="mt-2 text-[10px] leading-relaxed text-muted-foreground">
                      {method.instructions}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-4 rounded-lg border border-dashed border-border bg-muted/20 px-4 py-3 text-xs text-muted-foreground">
                Payment details are being set up. Use the free-access request in
                the meantime — an admin will review it.
              </p>
            )
          ) : (
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-dashed border-border bg-muted/20 px-4 py-3">
              <p className="text-xs text-muted-foreground">
                Payment numbers and QR codes are shown to signed-in learners
                only.
              </p>
              <Link
                href="/login?next=/learn/pricing"
                className={buttonVariants({ variant: "outline", size: "sm" })}
              >
                Sign in to view
              </Link>
            </div>
          )}
        </Card>

        <div id="free-access">
          {user ? (
            <PaymentForm />
          ) : (
            <Card className="flex h-full flex-col justify-center p-6 text-center">
              <ShieldCheck
                className="mx-auto size-6 text-primary"
                aria-hidden="true"
              />
              <p className="mt-3 text-sm font-semibold">
                Sign in to unlock a module
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Payments, free-access requests and your order history are tied
                to your account.
              </p>
              <Link
                href="/login?next=/learn/pricing"
                className={`${buttonVariants()} mt-4`}
              >
                Sign in
              </Link>
            </Card>
          )}
        </div>
      </section>

      {entitled.size > 0 ? (
        <section className="mt-8">
          <h2 className="flex items-center gap-2 text-sm font-semibold">
            <BadgeCheck className="size-4 text-emerald-500" aria-hidden="true" />
            Your unlocked modules
          </h2>
          <ul className="mt-2 flex flex-wrap gap-2">
            {[...entitled].map((slug) => {
              const paid = getPaidModule(slug);
              return (
                <li key={slug}>
                  <Link
                    href={`/learn/${slug}`}
                    className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/5 px-3 py-1 text-xs font-medium text-emerald-700 hover:border-emerald-500/50 dark:text-emerald-300"
                  >
                    Module {paid?.order ?? ""} · {paid?.title ?? slug}
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}

      {user ? (
        <section className="mt-8">
          <h2 className="text-sm font-semibold">Your orders</h2>
          {orders.length === 0 ? (
            <p className="mt-2 rounded-lg border border-dashed border-border bg-muted/20 px-4 py-3 text-xs text-muted-foreground">
              No payments yet. Submit a TrxID above after sending money, or
              request free access.
            </p>
          ) : (
            <ul className="mt-2 space-y-2">
              {orders.map((order) => (
                <li key={order.id}>
                  <Card className="flex flex-wrap items-center justify-between gap-3 p-4">
                    <div className="min-w-0">
                      <p className="text-sm font-medium">{order.label}</p>
                      <p className="mt-0.5 text-[11px] text-muted-foreground">
                        {order.kind === "PURCHASE"
                          ? `৳${order.amountBdt} · TrxID ${order.trxId}`
                          : "Free-access request"}{" "}
                        · {formatDate(order.createdAt)}
                      </p>
                      {order.adminNote ? (
                        <p className="mt-1 text-[11px] text-muted-foreground">
                          Admin: {order.adminNote}
                        </p>
                      ) : null}
                    </div>
                    <Badge variant={STATUS_VARIANT[order.status]}>
                      {order.status === "PENDING"
                        ? "Waiting for approval"
                        : order.status === "APPROVED"
                          ? "Approved"
                          : "Rejected"}
                    </Badge>
                  </Card>
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : null}
    </div>
  );
}
