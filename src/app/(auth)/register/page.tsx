import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthShell } from "@/components/auth/auth-shell";
import { RegisterForm } from "@/components/auth/register-form";
import { getCurrentUser } from "@/server/auth/session";
import { safeNext } from "@/lib/auth-redirect";
import { firstValue, type SearchParams } from "@/lib/pagination";

export const metadata: Metadata = {
  title: "Create account",
  description: "Create a free account on the PrimeAsia University Online Judge.",
};

export const dynamic = "force-dynamic";

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const nextPath = safeNext(firstValue(params.next));
  const user = await getCurrentUser();
  if (user) redirect(nextPath);

  return (
    <AuthShell
      eyebrow="Join the judge"
      title="Create your free account"
      description="Submit solutions, register for contests and build your profile."
      footer="One account per person. Do not share your password or submit other people's code as your own."
      mode="register"
      nextPath={nextPath}
    >
      <RegisterForm nextPath={nextPath} />
    </AuthShell>
  );
}
