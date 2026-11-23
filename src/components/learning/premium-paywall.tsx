import Link from "next/link";
import { LockKeyhole, Sparkles } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  BUNDLE_PRICE_BDT,
  MODULE_PRICE_BDT,
} from "@/lib/learning/payments";
import { cn } from "@/lib/utils";

export function PremiumPaywall({
  moduleTitle,
  className,
}: {
  moduleTitle: string;
  className?: string;
}) {
  return (
    <Card
      className={cn(
        "overflow-hidden border-amber-500/30 bg-amber-500/[0.04] p-6 sm:p-8",
        className,
      )}
    >
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 items-start gap-4">
          <span
            className="grid size-11 shrink-0 place-items-center rounded-xl bg-amber-500/10 text-amber-700 ring-1 ring-amber-500/25 dark:text-amber-300"
            aria-hidden="true"
          >
            <LockKeyhole className="size-5" />
          </span>
          <div className="min-w-0">
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-amber-700 dark:text-amber-300">
              Premium module
            </p>
            <h2 className="mt-1 text-lg font-semibold">
              {moduleTitle} is part of the paid track
            </h2>
            <p className="mt-1 max-w-xl text-sm leading-relaxed text-muted-foreground">
              Modules 1–2 stay free. Unlock this module for ৳
              {MODULE_PRICE_BDT}, or take all five premium modules for ৳
              {BUNDLE_PRICE_BDT}. Pay by bKash/Nagad, submit the TrxID and an
              admin approves it — no card needed.
            </p>
          </div>
        </div>
        <div className="flex shrink-0 flex-col gap-2 sm:items-end">
          <Link href="/learn/pricing" className={buttonVariants()}>
            <Sparkles className="size-4" aria-hidden="true" />
            Unlock for ৳{MODULE_PRICE_BDT}
          </Link>
          <Link
            href="/learn/pricing#free-access"
            className={buttonVariants({ variant: "ghost", size: "sm" })}
          >
            Can&apos;t pay? Request free access
          </Link>
        </div>
      </div>
    </Card>
  );
}
