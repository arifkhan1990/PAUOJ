"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Play } from "lucide-react";
import { useToast } from "@/components/providers/toast-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ApiClientError, apiPost } from "@/lib/api-client";

type AssessmentInviteClaimFormProps = {
  slug: string;
  token: string;
  requiresRef: boolean;
  refHint: string | null;
  resume?: boolean;
};

export function AssessmentInviteClaimForm({
  slug,
  token,
  requiresRef,
  refHint,
  resume = false,
}: AssessmentInviteClaimFormProps) {
  const [candidateRef, setCandidateRef] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  // Resuming never asks for the roster reference again: the invite is already
  // bound to this account, and the service resumes before it checks the ref.
  const needsRef = requiresRef && !resume;
  const ready = !loading && (!needsRef || candidateRef.trim().length > 0);

  const claim = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!ready) return;
    setError(null);
    setLoading(true);
    try {
      await apiPost(`/api/v1/assessments/${slug}/join`, {
        token,
        ...(needsRef ? { candidateRef: candidateRef.trim() } : {}),
      });
      toast({
        title: resume ? "Assessment resumed" : "Assessment started",
        variant: "success",
      });
      router.push(`/assessments/${slug}`);
      router.refresh();
    } catch (claimError) {
      const message =
        claimError instanceof ApiClientError
          ? claimError.message
          : "Could not start the assessment. Please try again.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={(event) => void claim(event)} className="space-y-3">
      {needsRef ? (
        <div className="space-y-1.5">
          <Label htmlFor="candidateRef">Student / candidate ID</Label>
          <Input
            id="candidateRef"
            value={candidateRef}
            onChange={(event) => setCandidateRef(event.target.value)}
            autoComplete="off"
            autoFocus
            required
            maxLength={200}
            aria-describedby="candidateRefHelp"
          />
          <p
            id="candidateRefHelp"
            className="text-[11px] leading-relaxed text-muted-foreground"
          >
            Use the ID on your class roster.
            {refHint ? ` Ends with ${refHint}.` : null}
          </p>
        </div>
      ) : null}
      {error ? (
        <p
          role="alert"
          className="rounded-md border border-rose-300 bg-rose-50 p-2.5 text-xs text-rose-800 dark:border-rose-800 dark:bg-rose-950 dark:text-rose-200"
        >
          {error}
        </p>
      ) : null}
      <Button
        type="submit"
        className="w-full"
        disabled={!ready}
        aria-busy={loading}
      >
        {loading ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <Play className="size-4" />
        )}
        {loading
          ? resume
            ? "Resuming…"
            : "Starting…"
          : resume
            ? "Resume assessment"
            : "Start assessment"}
      </Button>
      <p className="text-[11px] text-muted-foreground">
        {resume
          ? "Your timer cannot be paused or extended."
          : "The timer starts when you press Start. You cannot pause it."}
      </p>
    </form>
  );
}
