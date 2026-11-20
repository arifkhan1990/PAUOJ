"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Eye,
  EyeOff,
  Loader2,
  LockKeyhole,
  LogIn,
  UserRound,
} from "lucide-react";
import { AuthError } from "@/components/auth/auth-error";
import { AuthField } from "@/components/auth/auth-field";
import { Button } from "@/components/ui/button";
import { ApiClientError, apiPost } from "@/lib/api-client";
import { loginSchema } from "@/lib/schemas/auth";

export function LoginForm({ nextPath }: { nextPath: string }) {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    const parsed = loginSchema.safeParse({ identifier, password });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Check the fields.");
      return;
    }
    setLoading(true);
    try {
      await apiPost("/api/v1/auth/login", parsed.data);
      router.push(nextPath);
      router.refresh();
    } catch (loginError) {
      setError(
        loginError instanceof ApiClientError
          ? loginError.message
          : "Could not sign in. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={(event) => void submit(event)} className="space-y-4">
      <AuthField
        id="identifier"
        label="Username or email"
        icon={UserRound}
        value={identifier}
        onChange={(event) => setIdentifier(event.target.value)}
        autoComplete="username"
        autoFocus
        required
        placeholder="your_username"
      />

      <AuthField
        id="password"
        label="Password"
        icon={LockKeyhole}
        type={showPassword ? "text" : "password"}
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        autoComplete="current-password"
        required
        placeholder="Your password"
        action={
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setShowPassword((value) => !value)}
              className="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {showPassword ? (
                <EyeOff className="size-3" />
              ) : (
                <Eye className="size-3" />
              )}
              {showPassword ? "Hide" : "Show"}
            </button>
            <Link
              href="/forgot-password"
              className="text-[11px] font-medium text-primary hover:underline"
            >
              Forgot password?
            </Link>
          </div>
        }
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
          <LogIn className="size-4" />
        )}
        {loading ? "Signing in…" : "Sign in"}
      </Button>
    </form>
  );
}
