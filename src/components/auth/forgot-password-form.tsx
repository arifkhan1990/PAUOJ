"use client";

import { useState } from "react";
import Link from "next/link";
import { Loader2, Mail, MailCheck, Send } from "lucide-react";
import { AuthError } from "@/components/auth/auth-error";
import { AuthField } from "@/components/auth/auth-field";
import { Button } from "@/components/ui/button";
import { ApiClientError, apiPost } from "@/lib/api-client";
import { forgotPasswordSchema } from "@/lib/schemas/auth";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    const parsed = forgotPasswordSchema.safeParse({ email });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Enter a valid email.");
      return;
    }
    setLoading(true);
    try {
      await apiPost("/api/v1/auth/forgot-password", parsed.data);
      setSent(true);
    } catch (submitError) {
      setError(
        submitError instanceof ApiClientError
          ? submitError.message
          : "Could not send the reset email.",
      );
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="space-y-4 text-center">
        <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
          <MailCheck className="size-7" />
        </span>
        <div>
          <h2 className="text-base font-semibold">Check your email</h2>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            If an account exists for{" "}
            <span className="font-medium text-foreground">{email}</span>, we sent
            a password-reset link. It expires in one hour.
          </p>
        </div>
        <Link
          href="/login"
          className="text-sm font-medium text-primary hover:underline"
        >
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={(event) => void submit(event)} className="space-y-4">
      <AuthField
        id="email"
        label="Email"
        icon={Mail}
        type="email"
        autoComplete="email"
        autoFocus
        required
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        placeholder="you@example.com"
      />
      {error ? <AuthError message={error} /> : null}
      <Button
        type="submit"
        className="h-11 w-full rounded-xl"
        disabled={loading}
        aria-busy={loading}
      >
        {loading ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <Send className="size-4" />
        )}
        {loading ? "Sending…" : "Send reset link"}
      </Button>
      <p className="text-center text-xs text-muted-foreground">
        Remembered it?{" "}
        <Link
          href="/login"
          className="font-medium text-primary hover:underline"
        >
          Sign in
        </Link>
      </p>
    </form>
  );
}
