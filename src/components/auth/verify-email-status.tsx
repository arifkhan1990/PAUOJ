"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { ApiClientError, apiPost } from "@/lib/api-client";

type State = "verifying" | "success" | "error";

export function VerifyEmailStatus({
  token,
  isLoggedIn,
}: {
  token: string;
  isLoggedIn: boolean;
}) {
  const [state, setState] = useState<State>("verifying");
  const [message, setMessage] = useState("");
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    apiPost("/api/v1/auth/verify-email", { token })
      .then(() => setState("success"))
      .catch((error) => {
        setState("error");
        setMessage(
          error instanceof ApiClientError
            ? error.message
            : "This verification link is invalid or has expired.",
        );
      });
  }, [token]);

  if (state === "verifying") {
    return (
      <div className="flex flex-col items-center gap-3 py-4 text-center">
        <Loader2 className="size-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Verifying your email…</p>
      </div>
    );
  }

  if (state === "success") {
    return (
      <div className="flex flex-col items-center gap-3 py-2 text-center">
        <CheckCircle2 className="size-10 text-emerald-600 dark:text-emerald-400" />
        <h2 className="text-lg font-semibold">Email verified</h2>
        <p className="text-sm text-muted-foreground">
          Your account is now verified. You can continue using PAU OJ.
        </p>
        <Link
          href={isLoggedIn ? "/settings" : "/login"}
          className={`${buttonVariants()} mt-2`}
        >
          {isLoggedIn ? "Back to settings" : "Continue to sign in"}
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-3 py-2 text-center">
      <XCircle className="size-10 text-rose-600 dark:text-rose-400" />
      <h2 className="text-lg font-semibold">Verification failed</h2>
      <p className="text-sm text-muted-foreground">{message}</p>
      <div className="mt-2 flex gap-2">
        {isLoggedIn ? (
          <Link href="/settings" className={buttonVariants()}>
            Resend from settings
          </Link>
        ) : (
          <Link href="/login" className={buttonVariants()}>
            Sign in
          </Link>
        )}
        <Link href="/" className={buttonVariants({ variant: "outline" })}>
          Home
        </Link>
      </div>
    </div>
  );
}
