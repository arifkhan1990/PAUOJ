"use client";

import { useState } from "react";
import { Building2, Smartphone } from "lucide-react";
import { CopyButton } from "@/components/shared/copy-button";
import type { PaymentMethodView } from "@/lib/learning/payment-types";
import { cn } from "@/lib/utils";

const METHOD_META = {
  bkash: {
    icon: Smartphone,
    hint: "Mobile wallet · Send Money",
    steps: [
      "Open bKash and scan the QR (or send to the number).",
      "Use Send Money — not Payment — for a personal number.",
      "Submit the TrxID and sender number in the form.",
    ],
  },
  citybank: {
    icon: Building2,
    hint: "Bank transfer · citytouch",
    steps: [
      "Scan the QR with the City Bank app (citytouch).",
      "Or transfer to the account shown, then keep the TrxID.",
      "Submit the TrxID and sender number in the form.",
    ],
  },
} as const;

/** Two-way switch so one payment QR is shown large at a time. */
export function PaymentMethods({ methods }: { methods: PaymentMethodView[] }) {
  const [activeId, setActiveId] = useState(methods[0]?.id);
  const selected =
    methods.find((method) => method.id === activeId) ?? methods[0];
  if (!selected) return null;

  const meta = METHOD_META[selected.id];
  const Icon = meta.icon;

  return (
    <div className="mt-5">
      <div
        role="tablist"
        aria-label="Payment method"
        className="grid grid-cols-2 gap-1 rounded-xl border border-border bg-muted/30 p-1"
      >
        {methods.map((method) => {
          const TabIcon = METHOD_META[method.id].icon;
          const active = method.id === selected.id;
          return (
            <button
              key={method.id}
              type="button"
              role="tab"
              aria-selected={active}
              aria-controls={`payment-panel-${method.id}`}
              onClick={() => setActiveId(method.id)}
              className={cn(
                "flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                active
                  ? "bg-card text-foreground shadow-sm ring-1 ring-border"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <TabIcon className="size-4" aria-hidden="true" />
              {method.shortLabel}
            </button>
          );
        })}
      </div>

      <div
        id={`payment-panel-${selected.id}`}
        role="tabpanel"
        className="mt-3 overflow-hidden rounded-xl border border-border bg-card"
      >
        <div className="grid sm:grid-cols-[auto_minmax(0,1fr)]">
          <div className="flex items-center justify-center border-b border-border bg-white p-4 sm:border-b-0 sm:border-r sm:p-5">
            {selected.qrUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- served from the authenticated private QR route.
              <img
                src={selected.qrUrl}
                alt={`${selected.label} QR code`}
                width={240}
                height={240}
                className="size-52 object-contain sm:size-60"
                loading="lazy"
              />
            ) : (
              <div className="grid size-52 place-items-center rounded-lg border border-dashed border-border text-[11px] text-muted-foreground">
                QR coming soon
              </div>
            )}
          </div>

          <div className="min-w-0 p-5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="grid size-8 place-items-center rounded-lg bg-primary/10 text-primary">
                <Icon className="size-4" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-semibold">{selected.label}</p>
                <p className="text-[11px] text-muted-foreground">{meta.hint}</p>
              </div>
            </div>

            {selected.accountNumber ? (
              <div className="mt-4 flex items-center gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2">
                <div className="min-w-0">
                  <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                    Account
                  </p>
                  <p className="truncate font-mono text-base font-semibold tracking-wide">
                    {selected.accountNumber}
                  </p>
                </div>
                <CopyButton
                  value={selected.accountNumber}
                  className="ml-auto shrink-0"
                />
              </div>
            ) : null}

            {selected.accountName ? (
              <p className="mt-2 text-xs text-muted-foreground">
                Account holder:{" "}
                <span className="font-medium text-foreground">
                  {selected.accountName}
                </span>
              </p>
            ) : null}

            <ul className="mt-3 space-y-1.5 text-[11px] leading-relaxed text-muted-foreground">
              {meta.steps.map((step) => (
                <li key={step} className="flex gap-1.5">
                  <span className="mt-1.5 size-1 shrink-0 rounded-full bg-primary/60" aria-hidden="true" />
                  {step}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
