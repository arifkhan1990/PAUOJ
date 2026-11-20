import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthShell } from "@/components/auth/auth-shell";
import { LoginForm } from "@/components/auth/login-form";
import { getCurrentUser } from "@/server/auth/session";
import { safeNext } from "@/lib/auth-redirect";
import { firstValue, type SearchParams } from "@/lib/pagination";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to the PrimeAsia University Online Judge.",
};

export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const nextPath = safeNext(firstValue(params.next));
  const passwordReset = firstValue(params.reset) === "1";
  const user = await getCurrentUser();
  if (user) redirect(nextPath);

  return (
    <AuthShell
      eyebrow="Welcome back"
      title="Sign in to PAU OJ"
      description="Continue your practice, submissions and contests."
      footer="By signing in you agree to keep contest submissions fair and honest."
      mode="login"
      nextPath={nextPath}
    >
      {passwordReset ? (
        <p className="mb-5 rounded-lg border border-emerald-300/70 bg-emerald-50 px-3 py-2.5 text-xs text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-100">
          Your password has been reset. Sign in with the new password.
        </p>
      ) : null}
      <LoginForm nextPath={nextPath} />
    </AuthShell>
  );
}
