import type { Metadata } from "next";
import Link from "next/link";
import { MailQuestion } from "lucide-react";
import { AuthShell } from "@/components/auth/auth-shell";
import { VerifyEmailStatus } from "@/components/auth/verify-email-status";
import { buttonVariants } from "@/components/ui/button";
import { getCurrentUser } from "@/server/auth/session";
import { firstValue, type SearchParams } from "@/lib/pagination";

export const metadata: Metadata = {
  title: "Verify email",
  description: "Verify the email address on your PAU OJ account.",
};

export const dynamic = "force-dynamic";

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const token = firstValue(params.token)?.slice(0, 500) ?? "";
  const user = await getCurrentUser();

  return (
    <AuthShell
      eyebrow="Account security"
      title="Verify your email"
      description="Confirming your address keeps your account recoverable."
      footer={
        <>
          Need a new link?{" "}
          <Link
            href={user ? "/settings#email" : "/login"}
            className="font-medium text-primary hover:underline"
          >
            {user ? "Open settings" : "Sign in"}
          </Link>
        </>
      }
    >
      {token ? (
        <VerifyEmailStatus token={token} isLoggedIn={Boolean(user)} />
      ) : (
        <div className="flex flex-col items-center gap-3 py-3 text-center">
          <span className="grid size-11 place-items-center rounded-full bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300">
            <MailQuestion className="size-5" />
          </span>
          <h2 className="text-base font-semibold">Verification link missing</h2>
          <p className="text-sm text-muted-foreground">
            Open the link from your email, or request a new one from settings.
          </p>
          <Link
            href={user ? "/settings" : "/login"}
            className={`${buttonVariants()} mt-2`}
          >
            {user ? "Open settings" : "Sign in"}
          </Link>
        </div>
      )}
    </AuthShell>
  );
}
