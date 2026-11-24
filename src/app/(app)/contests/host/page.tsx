import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, Sparkles } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { buttonVariants } from "@/components/ui/button";
import { HostContestForm } from "@/features/contests/host-contest-form";
import { getCurrentUser } from "@/server/auth/session";
import { getPaymentMethods } from "@/server/services/payment-config";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Host a contest",
  description:
    "Request a private PAU OJ contest: solo or team round, fresh problems, approved sponsors and a director workspace.",
};

export const dynamic = "force-dynamic";

export default async function HostContestPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect(`/login?next=${encodeURIComponent("/contests/host")}`);
  }
  const paymentMethods = getPaymentMethods();

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <PageHeader
        eyebrow="Community hosting"
        title="Host a contest"
        description="Bring your department, club or batch together for a private round. Submit the plan, pay the arrangement fee and the contest team schedules it with you as director."
        actions={
          <Link
            href="/contests"
            className={cn(buttonVariants({ variant: "outline" }), "h-11")}
          >
            <ArrowLeft className="size-4" aria-hidden="true" /> All contests
          </Link>
        }
      />

      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <Sparkles className="size-3.5" aria-hidden="true" />
          Fresh problems only
        </span>
        <span aria-hidden="true">·</span>
        <span>Solo or teams of 2–6</span>
        <span aria-hidden="true">·</span>
        <span>Private draft until the contest team publishes</span>
        <span aria-hidden="true">·</span>
        <span>Fee ৳3,000–৳5,000</span>
      </div>

      <div className="mt-6">
        <HostContestForm
          defaultContactEmail={user.email}
          paymentMethods={paymentMethods}
        />
      </div>
    </div>
  );
}
