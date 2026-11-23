"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import type { PaymentMethodView } from "@/lib/learning/payment-types";

/** Two-way switch so one payment QR is shown large at a time. */
export function PaymentMethods({ methods }: { methods: PaymentMethodView[] }) {
  const [activeId, setActiveId] = useState(methods[0]?.id);
  const selected = methods.find((method) => method.id === activeId) ?? methods[0];
  if (!selected) return null;

  return (
    <div className="mt-4">
      <div
        role="tablist"
        aria-label="Payment method"
        className="inline-flex rounded-lg border border-border bg-muted/30 p-1"
      >
        {methods.map((method) => (
          <button
            key={method.id}
            type="button"
            role="tab"
            aria-selected={method.id === selected.id}
            aria-controls={`payment-panel-${method.id}`}
            onClick={() => setActiveId(method.id)}
            className={cn(
              "rounded-md px-3 py-1.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              method.id === selected.id
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {method.shortLabel}
          </button>
        ))}
      </div>

      <div
        id={`payment-panel-${selected.id}`}
        role="tabpanel"
        className="mt-3 rounded-lg border border-border bg-muted/20 p-4"
      >
        <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-center">
          {selected.qrUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- served from the authenticated private QR route.
            <img
              src={selected.qrUrl}
              alt={`${selected.label} QR code`}
              width={224}
              height={224}
              className="size-52 shrink-0 rounded-md bg-white object-contain p-2 sm:size-56"
              loading="lazy"
            />
          ) : null}
          <div className="min-w-0 text-center sm:text-left">
            <p className="text-sm font-semibold">{selected.label}</p>
            {selected.accountNumber ? (
              <p className="mt-1 font-mono text-lg font-semibold tracking-wide">
                {selected.accountNumber}
              </p>
            ) : null}
            {selected.accountName ? (
              <p className="text-xs text-muted-foreground">
                {selected.accountName}
              </p>
            ) : null}
            <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">
              {selected.instructions}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
