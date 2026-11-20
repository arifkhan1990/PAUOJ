"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  AtSign,
  Eye,
  EyeOff,
  Loader2,
  LockKeyhole,
  Mail,
  UserPlus,
  UserRound,
} from "lucide-react";
import { AuthError } from "@/components/auth/auth-error";
import { AuthField } from "@/components/auth/auth-field";
import { PasswordStrength } from "@/components/auth/password-strength";
import { Button } from "@/components/ui/button";
import { ApiClientError, apiPost } from "@/lib/api-client";
import { registerSchema } from "@/lib/schemas/auth";

export function RegisterForm({ nextPath }: { nextPath: string }) {
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    const parsed = registerSchema.safeParse({
      username,
      displayName,
      email,
      password,
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Check the fields.");
      return;
    }
    setLoading(true);
    try {
      await apiPost("/api/v1/auth/register", parsed.data);
      router.push(nextPath);
      router.refresh();
    } catch (registerError) {
      setError(
        registerError instanceof ApiClientError
          ? registerError.message
          : "Could not create the account. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  const passwordToggle = (
    <button
      type="button"
      onClick={() => setShowPassword((value) => !value)}
      className="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground transition-colors hover:text-foreground"
    >
      {showPassword ? <EyeOff className="size-3" /> : <Eye className="size-3" />}
      {showPassword ? "Hide" : "Show"}
    </button>
  );

  return (
    <form onSubmit={(event) => void submit(event)} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <AuthField
          id="displayName"
          label="Full name"
          icon={UserRound}
          value={displayName}
          onChange={(event) => setDisplayName(event.target.value)}
          autoComplete="name"
          autoFocus
          required
          maxLength={64}
          placeholder="Your name"
        />
        <AuthField
          id="username"
          label="Username"
          icon={AtSign}
          value={username}
          onChange={(event) =>
            setUsername(
              event.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""),
            )
          }
          autoComplete="username"
          required
          minLength={3}
          maxLength={24}
          placeholder="lowercase_name"
        />
      </div>

      <AuthField
        id="email"
        label="Email"
        icon={Mail}
        type="email"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        autoComplete="email"
        required
        placeholder="you@example.com"
      />

      <AuthField
        id="password"
        label="Password"
        icon={LockKeyhole}
        type={showPassword ? "text" : "password"}
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        autoComplete="new-password"
        required
        minLength={8}
        placeholder="Create a password"
        action={passwordToggle}
        hint={<PasswordStrength password={password} />}
      />

      <AuthField
        id="confirmPassword"
        label="Confirm password"
        icon={LockKeyhole}
        type={showPassword ? "text" : "password"}
        value={confirmPassword}
        onChange={(event) => setConfirmPassword(event.target.value)}
        autoComplete="new-password"
        required
        placeholder="Repeat your password"
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
          <UserPlus className="size-4" />
        )}
        {loading ? "Creating account…" : "Create account"}
      </Button>
    </form>
  );
}
