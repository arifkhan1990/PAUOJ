"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { Textarea } from "@/components/ui/textarea";
import { ApiClientError, apiPost } from "@/lib/api-client";
import {
  BUNDLE_PRICE_BDT,
  MODULE_PRICE_BDT,
  PAID_MODULES,
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

  const submitPurchase = async () => {
    if (submitting) return;
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
    if (submitting) return;
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
    <div className="rounded-xl border border-border bg-card p-5">
      <div
        role="tablist"
        aria-label="Payment or free access"
        className="inline-flex rounded-lg border border-border bg-muted/30 p-1"
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
                ? "bg-primary text-primary-foreground"
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

        {tab === "PURCHASE" ? (
          <>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="text-xs font-medium" htmlFor="payment-trx">
                  Transaction ID (TrxID)
                </label>
                <Input
                  id="payment-trx"
                  value={trxId}
                  onChange={(event) => setTrxId(event.target.value)}
                  placeholder="e.g. 9F2A7C1B3D"
                  autoComplete="off"
                  className="mt-1.5 font-mono uppercase"
                />
              </div>
              <div>
                <label className="text-xs font-medium" htmlFor="payment-sender">
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
              </div>
            </div>
            <p className="text-[11px] leading-relaxed text-muted-foreground">
              Each TrxID can be used once. Double-check it before submitting;
              wrong IDs are rejected by an admin.
            </p>
            <Button
              type="button"
              onClick={() => void submitPurchase()}
              disabled={submitting || trxId.trim().length < 6}
            >
              {submitting ? <Loader2 className="size-3.5 animate-spin" /> : null}
              Submit payment for review
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
              <p className="mt-1 text-right text-[10px] text-muted-foreground">
                {reason.length}/500
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={() => void submitFreeRequest()}
              disabled={submitting || reason.trim().length < 10}
            >
              {submitting ? <Loader2 className="size-3.5 animate-spin" /> : null}
              Send free-access request
            </Button>
          </>
        )}

        {error ? (
          <p className="text-xs text-destructive" role="alert">
            {error}
          </p>
        ) : null}
        {done ? (
          <p className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 px-3 py-2 text-xs text-emerald-700 dark:text-emerald-300">
            {done}
          </p>
        ) : null}
      </div>
    </div>
  );
}
