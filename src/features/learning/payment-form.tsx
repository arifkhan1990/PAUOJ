"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  LockKeyhole,
  Wallet,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { Textarea } from "@/components/ui/textarea";
import { ApiClientError, apiPost } from "@/lib/api-client";
import {
  ADVANCED_SQL,
  BUNDLE_PRICE_BDT,
  MODULE_PRICE_BDT,
  PAID_MODULES,
  modulePriceBdt,
} from "@/lib/learning/payments";
import { cn } from "@/lib/utils";

const PRODUCT_OPTIONS = [
  {
    value: "BUNDLE",
    label: `All 5 premium modules — ৳${BUNDLE_PRICE_BDT}`,
    description: "Best value: modules 3, 4, 5, 6 and 7",
  },
  ...PAID_MODULES.map((module) => ({
    value: module.slug,
    label: `Module ${module.order}: ${module.title} — ৳${MODULE_PRICE_BDT}`,
  })),
  {
    value: ADVANCED_SQL.slug,
    label: `Advanced SQL — ৳${ADVANCED_SQL.priceBdt}`,
    description: "Project-based SQL lab, paid separately",
  },
];

function productPayload(value: string) {
  return value === "BUNDLE"
    ? { product: "BUNDLE" as const, moduleSlug: null }
    : { product: "MODULE" as const, moduleSlug: value };
}

export function PaymentForm() {
  const router = useRouter();
  const [tab, setTab] = useState<"PURCHASE" | "FREE_REQUEST">("PURCHASE");
  const [product, setProduct] = useState("BUNDLE");
  const [trxId, setTrxId] = useState("");
  const [senderNumber, setSenderNumber] = useState("");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);

  const amount =
    product === "BUNDLE"
      ? BUNDLE_PRICE_BDT
      : (modulePriceBdt(product) ?? MODULE_PRICE_BDT);
  const isPurchase = tab === "PURCHASE";
  const canSubmitPurchase =
    trxId.trim().length >= 6 && senderNumber.trim().length >= 8;
  const canSubmitFree = reason.trim().length >= 10;

  const submitPurchase = async () => {
    if (submitting || !canSubmitPurchase) return;
    setSubmitting(true);
    setError(null);
    setDone(null);
    try {
      await apiPost("/api/v1/learning/purchases", {
        ...productPayload(product),
        trxId,
        senderNumber,
      });
      setDone(
        "Payment submitted. We will verify the TrxID and unlock your module — usually within a few hours.",
      );
      setTrxId("");
      setSenderNumber("");
      router.refresh();
    } catch (requestError) {
      setError(
        requestError instanceof ApiClientError
          ? requestError.message
          : "Could not submit your payment.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const submitFreeRequest = async () => {
    if (submitting || !canSubmitFree) return;
    setSubmitting(true);
    setError(null);
    setDone(null);
    try {
      await apiPost("/api/v1/learning/access-requests", {
        ...productPayload(product),
        reason,
      });
      setDone(
        "Free-access request sent. An admin will review it and unlock the module if approved.",
      );
      setReason("");
      router.refresh();
    } catch (requestError) {
      setError(
        requestError instanceof ApiClientError
          ? requestError.message
          : "Could not send your request.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="rounded-xl border border-border bg-card">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4">
        <div className="flex items-center gap-3">
          <span className="grid size-9 place-items-center rounded-lg bg-primary/10 text-primary">
            <Wallet className="size-4" aria-hidden="true" />
          </span>
          <div>
            <h2 className="text-sm font-semibold">Unlock premium access</h2>
            <p className="text-[11px] text-muted-foreground">
              Submit a payment or ask for a scholarship.
            </p>
          </div>
        </div>
        <Badge variant="outline" className="gap-1">
          <LockKeyhole className="size-3" aria-hidden="true" />
          Manual approval
        </Badge>
      </div>

      <div className="p-5">
        <div
          role="tablist"
          aria-label="Payment or free access"
          className="grid grid-cols-2 gap-1 rounded-lg border border-border bg-muted/30 p-1"
        >
          {[
            { key: "PURCHASE" as const, label: "I have paid" },
            { key: "FREE_REQUEST" as const, label: "Request free access" },
          ].map((option) => (
            <button
              key={option.key}
              type="button"
              role="tab"
              aria-selected={tab === option.key}
              onClick={() => {
                setTab(option.key);
                setError(null);
                setDone(null);
              }}
              className={cn(
                "rounded-md px-3 py-1.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                tab === option.key
                  ? "bg-card text-foreground shadow-sm ring-1 ring-border"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {option.label}
            </button>
          ))}
        </div>

        <div className="mt-4 space-y-3">
          <div>
            <label className="text-xs font-medium" htmlFor="payment-product">
              What do you want to unlock?
            </label>
            <SearchableSelect
              id="payment-product"
              options={PRODUCT_OPTIONS}
              value={product}
              onValueChange={setProduct}
              className="mt-1.5"
            />
          </div>

          {isPurchase ? (
            <>
              <div className="flex items-center justify-between rounded-lg border border-border bg-muted/30 px-3 py-2">
                <span className="text-xs text-muted-foreground">
                  Amount to send
                </span>
                <span className="font-mono text-lg font-semibold tabular-nums">
                  ৳{amount}
                </span>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-medium" htmlFor="payment-trx">
                    Transaction ID (TrxID)
                  </label>
                  <Input
                    id="payment-trx"
                    value={trxId}
                    onChange={(event) => setTrxId(event.target.value)}
                    placeholder="9F2A7C1B3D"
                    autoComplete="off"
                    className="mt-1.5 font-mono uppercase tracking-wide"
                  />
                  <p className="mt-1 text-[10px] text-muted-foreground">
                    Copy it from the payment SMS or app history.
                  </p>
                </div>
                <div>
                  <label
                    className="text-xs font-medium"
                    htmlFor="payment-sender"
                  >
                    Sender number
                  </label>
                  <Input
                    id="payment-sender"
                    value={senderNumber}
                    onChange={(event) => setSenderNumber(event.target.value)}
                    placeholder="01XXXXXXXXX"
                    inputMode="tel"
                    autoComplete="tel"
                    className="mt-1.5"
                  />
                  <p className="mt-1 text-[10px] text-muted-foreground">
                    The number you paid from.
                  </p>
                </div>
              </div>

              <p className="flex gap-2 rounded-lg border border-border bg-muted/20 px-3 py-2 text-[11px] leading-relaxed text-muted-foreground">
                <LockKeyhole
                  className="mt-0.5 size-3.5 shrink-0"
                  aria-hidden="true"
                />
                Each TrxID works once. A wrong or reused ID is rejected by an
                admin.
              </p>

              <Button
                type="button"
                size="lg"
                className="w-full"
                onClick={() => void submitPurchase()}
                disabled={submitting || !canSubmitPurchase}
              >
                {submitting ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <LockKeyhole className="size-4" />
                )}
                {submitting ? "Submitting…" : "Submit payment for review"}
              </Button>
            </>
          ) : (
            <>
              <div>
                <label className="text-xs font-medium" htmlFor="payment-reason">
                  Why do you need free access?
                </label>
                <Textarea
                  id="payment-reason"
                  value={reason}
                  onChange={(event) => setReason(event.target.value)}
                  placeholder="Tell the admin about your situation (student, financial hardship, etc.)."
                  maxLength={500}
                  className="mt-1.5 min-h-24"
                />
                <div className="mt-1 flex items-center justify-between text-[10px] text-muted-foreground">
                  <span>Shared only with admins.</span>
                  <span className="tabular-nums">{reason.length}/500</span>
                </div>
              </div>
              <Button
                type="button"
                size="lg"
                variant="outline"
                className="w-full"
                onClick={() => void submitFreeRequest()}
                disabled={submitting || !canSubmitFree}
              >
                {submitting ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : null}
                {submitting ? "Sending…" : "Send free-access request"}
              </Button>
            </>
          )}

          {error ? (
            <p
              className="flex gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive"
              role="alert"
            >
              <AlertCircle className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
              {error}
            </p>
          ) : null}

          {done ? (
            <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 px-3 py-3">
              <p className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                <CheckCircle2 className="size-3.5" aria-hidden="true" />
                Received
              </p>
              <p className="mt-1 text-[11px] leading-relaxed text-emerald-700/90 dark:text-emerald-300/90">
                {done}
              </p>
            </div>
          ) : null}

          <p className="text-[10px] leading-relaxed text-muted-foreground">
            Approval is manual and usually takes a few hours. You will get an
            in-app notification as soon as it is reviewed.
          </p>
        </div>
      </div>
    </div>
  );
}
