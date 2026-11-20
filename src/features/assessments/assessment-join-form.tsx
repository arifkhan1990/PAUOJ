"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { KeyRound, Loader2 } from "lucide-react";
import { useToast } from "@/components/providers/toast-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ApiClientError, apiPost } from "@/lib/api-client";

export function AssessmentJoinForm({ slug }: { slug: string }) {
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const join = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await apiPost(`/api/v1/assessments/${slug}/join`, { code });
      toast({ title: "Assessment started", variant: "success" });
      router.refresh();
    } catch (joinError) {
      const message =
        joinError instanceof ApiClientError
          ? joinError.message
          : "Could not join the assessment.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={(event) => void join(event)} className="space-y-3">
      <div className="space-y-1.5">
        <Label htmlFor="accessCode">Access code</Label>
        <Input
          id="accessCode"
          value={code}
          onChange={(event) => setCode(event.target.value.toUpperCase())}
          placeholder="e.g. PAU-TEST-2026"
          autoComplete="off"
          autoFocus
          required
          maxLength={20}
          className="font-mono tracking-wider"
        />
      </div>
      {error ? (
        <p
          role="alert"
          className="rounded-md border border-rose-300 bg-rose-50 p-2.5 text-xs text-rose-800 dark:border-rose-800 dark:bg-rose-950 dark:text-rose-200"
        >
          {error}
        </p>
      ) : null}
      <Button type="submit" className="w-full" disabled={loading || !code.trim()}>
        {loading ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <KeyRound className="size-4" />
        )}
        {loading ? "Starting…" : "Start assessment"}
      </Button>
      <p className="text-[11px] text-muted-foreground">
        The timer starts as soon as you join. You cannot pause it.
      </p>
    </form>
  );
}
