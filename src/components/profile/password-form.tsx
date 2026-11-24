"use client";

import { useState } from "react";
import { Loader2, KeyRound } from "lucide-react";
import { useToast } from "@/components/providers/toast-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ApiClientError, apiPost } from "@/lib/api-client";
import { changePasswordSchema } from "@/lib/schemas/auth";

export function PasswordForm() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    const parsed = changePasswordSchema.safeParse({
      currentPassword,
      newPassword,
      confirmPassword,
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Check the fields.");
      return;
    }
    setLoading(true);
    try {
      await apiPost("/api/v1/users/me/password", parsed.data);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      toast({
        title: "Password changed",
        description: "Other sessions have been signed out.",
        variant: "success",
      });
    } catch (submitError) {
      const message =
        submitError instanceof ApiClientError
          ? submitError.message
          : "Could not change your password.";
      setError(message);
      toast({ title: "Password not changed", description: message, variant: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={(event) => void submit(event)} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="currentPassword">Current password</Label>
        <Input
          id="currentPassword"
          type="password"
          autoComplete="current-password"
          value={currentPassword}
          onChange={(event) => setCurrentPassword(event.target.value)}
          required
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="newPassword">New password</Label>
        <Input
          id="newPassword"
          type="password"
          autoComplete="new-password"
          value={newPassword}
          onChange={(event) => setNewPassword(event.target.value)}
          required
        />
        <p className="text-[11px] text-muted-foreground">
          At least 8 characters, with a letter and a number.
        </p>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="confirmPassword">Confirm new password</Label>
        <Input
          id="confirmPassword"
          type="password"
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          required
        />
      </div>
      {error ? (
        <p className="rounded-md border border-rose-300 bg-rose-50 p-2.5 text-xs text-rose-800 dark:border-rose-800 dark:bg-rose-950 dark:text-rose-200">
          {error}
        </p>
      ) : null}
      <Button type="submit" disabled={loading} className="h-11">
        {loading ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <KeyRound className="size-4" />
        )}
        Change password
      </Button>
    </form>
  );
}
