"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, KeyRound, Loader2, LockKeyhole } from "lucide-react";
import { AuthError } from "@/components/auth/auth-error";
import { AuthField } from "@/components/auth/auth-field";
import { PasswordStrength } from "@/components/auth/password-strength";
import { useToast } from "@/components/providers/toast-provider";
import { Button } from "@/components/ui/button";
import { ApiClientError, apiPost } from "@/lib/api-client";
import { resetPasswordSchema } from "@/lib/schemas/auth";

export function ResetPasswordForm({ token }: { token: string }) {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    const parsed = resetPasswordSchema.safeParse({
      token,
      newPassword,
      confirmPassword,
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Check the fields.");
      return;
    }
    setLoading(true);
    try {
      await apiPost("/api/v1/auth/reset-password", parsed.data);
      toast({
        title: "Password changed",
        description: "Sign in with your new password.",
        variant: "success",
      });
      router.push("/login?reset=1");
    } catch (submitError) {
      const message =
        submitError instanceof ApiClientError
          ? submitError.message
          : "Could not reset your password.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={(event) => void submit(event)} className="space-y-4">
      <AuthField
        id="newPassword"
        label="New password"
        icon={LockKeyhole}
        type={showPassword ? "text" : "password"}
        autoComplete="new-password"
        autoFocus
        required
        value={newPassword}
        onChange={(event) => setNewPassword(event.target.value)}
        placeholder="Choose a new password"
        hint={<PasswordStrength password={newPassword} />}
        action={
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
        }
      />
      <AuthField
        id="confirmPassword"
        label="Confirm new password"
        icon={LockKeyhole}
        type={showPassword ? "text" : "password"}
        autoComplete="new-password"
        required
        value={confirmPassword}
        onChange={(event) => setConfirmPassword(event.target.value)}
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
          <KeyRound className="size-4" />
        )}
        {loading ? "Updating…" : "Set new password"}
      </Button>
      <p className="text-center text-xs text-muted-foreground">
        This link can only be used once.{" "}
        <Link
          href="/forgot-password"
          className="font-medium text-primary hover:underline"
        >
          Request another
        </Link>
      </p>
    </form>
  );
}
