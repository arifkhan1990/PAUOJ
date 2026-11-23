import type { Metadata } from "next";
import Link from "next/link";
import {
  BadgeCheck,
  Check,
  LockKeyhole,
  QrCode,
  ReceiptText,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { PaymentForm } from "@/features/learning/payment-form";
import { PaymentMethods } from "@/features/learning/payment-methods";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  ADVANCED_SQL,
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
  REVOKED: "muted",
} as const;

const STATUS_LABEL = {
  PENDING: "Waiting for approval",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  REVOKED: "Revoked",
} as const;

function FeatureList({ items }: { items: string[] }) {
  return (
    <ul className="mt-3 space-y-1.5 text-xs text-muted-foreground">
      {items.map((item) => (
        <li key={item} className="flex items-start gap-2">
          <Check className="mt-0.5 size-3.5 shrink-0 text-primary" aria-hidden="true" />
          {item}
        </li>
      ))}
    </ul>
  );
}

const STEPS = [
  {
    title: "Send the amount",
    body: `৳${MODULE_PRICE_BDT} for one module or ৳${BUNDLE_PRICE_BDT} for all five.`,
  },
  {
    title: "Submit the TrxID",
    body: "Use the form beside this card with the sender number.",
  },
  {
    title: "Get unlocked",
    body: "An admin verifies the payment and your module opens.",
  },
];

export default async function LearningPricingPage() {
  const user = await getCurrentUser();
  const methods = user ? getPaymentMethods() : [];
  const [orders, entitled] = await Promise.all([
    user ? listOwnOrders(user.id) : Promise.resolve([]),
    getEntitledModuleSlugs(user?.id ?? null, user?.role),
  ]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <PageHeader
        eyebrow="Premium"
        title="Unlock modules 3–7"
        description="Modules 1–2 are free forever. Premium modules are unlocked with bKash Send Money or a City Bank transfer and a manual TrxID check — no card or payment gateway required."
        actions={
          <Link href="/learn" className={buttonVariants({ variant: "outline" })}>
            Back to tracks
          </Link>
        }
      />

      <div className="mt-4 flex flex-wrap gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-2.5 py-1 text-[11px] text-muted-foreground">
          <LockKeyhole className="size-3" aria-hidden="true" />
          No card required
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-2.5 py-1 text-[11px] text-muted-foreground">
          <ShieldCheck className="size-3" aria-hidden="true" />
          Manual approval
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-2.5 py-1 text-[11px] text-muted-foreground">
          <BadgeCheck className="size-3" aria-hidden="true" />
          Lifetime access
        </span>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="flex flex-col p-5">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Free
            </p>
            <Badge variant="muted">Included</Badge>
          </div>
          <p className="mt-2 text-2xl font-semibold">৳0</p>
          <FeatureList
            items={["Modules 1–2", "Concept notes & practice sets", "Checkpoint badges"]}
          />
        </Card>

        <Card className="flex flex-col p-5">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Per module
            </p>
            <Badge variant="outline">Flexible</Badge>
          </div>
          <p className="mt-2 text-2xl font-semibold">৳{MODULE_PRICE_BDT}</p>
          <FeatureList
            items={["Any one module (3–7)", "Unlocked after approval", "Lifetime access"]}
          />
        </Card>

        <Card className="relative flex flex-col overflow-hidden border-primary/40 bg-primary/[0.04] p-5">
          <div className="flex items-center justify-between gap-2">
            <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-primary">
              <Sparkles className="size-3.5" aria-hidden="true" />
              Bundle
            </p>
            <Badge variant="default">Best value</Badge>
          </div>
          <p className="mt-2 text-2xl font-semibold">৳{BUNDLE_PRICE_BDT}</p>
          <FeatureList
            items={[
              "All five code modules (3–7)",
              `Save ৳${PAID_MODULES.length * MODULE_PRICE_BDT - BUNDLE_PRICE_BDT}`,
              "Lifetime access",
            ]}
          />
        </Card>

        <Card className="flex flex-col p-5">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Advanced SQL
            </p>
            <Badge variant="outline">SQL Labs</Badge>
          </div>
          <p className="mt-2 text-2xl font-semibold">৳{ADVANCED_SQL.priceBdt}</p>
          <FeatureList
            items={["Project-based SQL lab", "Window functions & CTEs", "Sold separately"]}
          />
        </Card>
      </div>

      <section className="mt-8 grid items-start gap-4 lg:grid-cols-[1.12fr_0.88fr]">
        <Card className="overflow-hidden p-0">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4">
            <div className="flex items-center gap-3">
              <span className="grid size-9 place-items-center rounded-lg bg-primary/10 text-primary">
                <QrCode className="size-4" aria-hidden="true" />
              </span>
              <div>
                <h2 className="text-sm font-semibold">How to pay</h2>
                <p className="text-[11px] text-muted-foreground">
                  Scan the QR or send to the number, then submit the TrxID.
                </p>
              </div>
            </div>
            <Badge variant="outline">Manual approval</Badge>
          </div>

          <div className="p-5">
            <ol className="grid gap-3 sm:grid-cols-3">
              {STEPS.map((step, index) => (
                <li key={step.title} className="flex gap-2.5">
                  <span className="grid size-6 shrink-0 place-items-center rounded-full border border-primary/30 bg-primary/10 font-mono text-[10px] font-semibold text-primary">
                    {index + 1}
                  </span>
                  <div>
                    <p className="text-xs font-semibold">{step.title}</p>
                    <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">
                      {step.body}
                    </p>
                  </div>
                </li>
              ))}
            </ol>

            {user ? (
              methods.length > 0 ? (
                <PaymentMethods methods={methods} />
              ) : (
                <p className="mt-5 rounded-lg border border-dashed border-border bg-muted/20 px-4 py-3 text-xs text-muted-foreground">
                  Payment details are being set up. Use the free-access request
                  in the meantime — an admin will review it.
                </p>
              )
            ) : (
              <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-dashed border-border bg-muted/20 px-4 py-3">
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
          </div>
        </Card>

        <div id="free-access">
          {user ? (
            <PaymentForm />
          ) : (
            <Card className="flex flex-col items-center p-6 text-center">
              <span className="grid size-11 place-items-center rounded-full bg-primary/10 text-primary">
                <ShieldCheck className="size-5" aria-hidden="true" />
              </span>
              <p className="mt-3 text-sm font-semibold">
                Sign in to unlock a module
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Payments, free-access requests and your order history are tied
                to your account.
              </p>
              <Link
                href="/login?next=/learn/pricing"
                className={`${buttonVariants()} mt-4 w-full`}
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
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="text-sm font-semibold">Your orders</h2>
            <p className="font-mono text-[11px] tabular-nums text-muted-foreground">
              {orders.length} {orders.length === 1 ? "entry" : "entries"}
            </p>
          </div>

          {orders.length === 0 ? (
            <div className="mt-2 flex items-start gap-3 rounded-xl border border-dashed border-border bg-muted/20 p-4">
              <ReceiptText
                className="mt-0.5 size-4 shrink-0 text-muted-foreground"
                aria-hidden="true"
              />
              <div>
                <p className="text-sm font-medium">No payments yet</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Submit a TrxID after sending money, or request free access.
                </p>
              </div>
            </div>
          ) : (
            <ul className="mt-2 space-y-2">
              {orders.map((order) => (
                <li key={order.id}>
                  <Card className="flex flex-wrap items-start justify-between gap-3 p-4">
                    <div className="min-w-0">
                      <p className="text-sm font-medium">{order.label}</p>
                      <p className="mt-0.5 text-[11px] text-muted-foreground">
                        {order.kind === "PURCHASE"
                          ? `৳${order.amountBdt} · TrxID ${order.trxId}`
                          : "Free-access request"}{" "}
                        · {formatDate(order.createdAt)}
                      </p>
                      {order.adminNote ? (
                        <p className="mt-1 rounded-md bg-muted/40 px-2 py-1 text-[11px] text-muted-foreground">
                          Admin note: {order.adminNote}
                        </p>
                      ) : null}
                    </div>
                    <Badge variant={STATUS_VARIANT[order.status]}>
                      {STATUS_LABEL[order.status]}
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
