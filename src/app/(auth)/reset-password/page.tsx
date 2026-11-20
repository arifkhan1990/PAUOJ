import type { Metadata } from "next";
import Link from "next/link";
import { KeyRound } from "lucide-react";
import { AuthShell } from "@/components/auth/auth-shell";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { buttonVariants } from "@/components/ui/button";
import { firstValue, type SearchParams } from "@/lib/pagination";

export const metadata: Metadata = {
  title: "Reset password",
  description: "Choose a new password for your PAU OJ account.",
};

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const token = firstValue(params.token)?.slice(0, 500) ?? "";

  return (
    <AuthShell
      eyebrow="Account recovery"
      title="Set a new password"
      description="Choose a strong password. All other sessions will be signed out."
      footer={
        <>
          Remembered your password?{" "}
          <Link href="/login" className="font-medium text-primary hover:underline">
            Back to sign in
          </Link>
        </>
      }
    >
      {token ? (
        <ResetPasswordForm token={token} />
      ) : (
        <div className="flex flex-col items-center gap-3 py-3 text-center">
          <span className="grid size-11 place-items-center rounded-full bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300">
            <KeyRound className="size-5" />
          </span>
          <h2 className="text-base font-semibold">Reset link missing</h2>
          <p className="text-sm text-muted-foreground">
            Open the link from your email, or request a new one.
          </p>
          <Link href="/forgot-password" className={`${buttonVariants()} mt-2`}>
            Request a reset link
          </Link>
        </div>
      )}
    </AuthShell>
  );
}
