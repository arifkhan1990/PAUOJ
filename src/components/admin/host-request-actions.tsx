"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCheck, Loader2, X } from "lucide-react";
import { useToast } from "@/components/providers/toast-provider";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ApiClientError, apiPatch } from "@/lib/api-client";
import type { ContestHostRequestView } from "@/lib/contest-ops";

type Decision = "UNDER_REVIEW" | "APPROVED" | "REJECTED" | "CONVERTED";

type HostDecisionResult =
  | ContestHostRequestView
  | { status: "CONVERTED"; contestId: string; slug: string };

const SUCCESS_TITLE: Record<Decision, string> = {
  UNDER_REVIEW: "Marked under review",
  APPROVED: "Host request approved",
  REJECTED: "Host request rejected",
  CONVERTED: "Private contest created",
};

export function HostRequestActions({
  request,
  onUpdated,
}: {
  request: ContestHostRequestView;
  onUpdated: () => void;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState<Decision | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmConvert, setConfirmConvert] = useState(false);

  const actionable = ["SUBMITTED", "UNDER_REVIEW", "APPROVED"].includes(
    request.status,
  );
  if (!actionable) return null;

  const submit = async (decision: Decision) => {
    const trimmed = note.trim();
    if (decision === "REJECTED" && trimmed.length === 0) {
      setError("Add a note explaining the rejection before sending it.");
      return;
    }
    setBusy(decision);
    setError(null);
    try {
      const result = await apiPatch<HostDecisionResult>(
        `/api/v1/admin/host-requests/${request.id}`,
        { decision, note: trimmed },
      );
      const converted =
        decision === "CONVERTED" && "contestId" in result ? result : null;
      toast({
        title: SUCCESS_TITLE[decision],
        description: converted
          ? `Created ${converted.slug}. Edit the draft before publishing.`
          : `@${request.requestedBy.username} will be notified.`,
        variant: "success",
      });
      setNote("");
      onUpdated();
      router.refresh();
    } catch (requestError) {
      const message =
        requestError instanceof ApiClientError
          ? requestError.message
          : "Could not update this host request.";
      setError(message);
      toast({ title: "Action failed", description: message, variant: "error" });
    } finally {
      setBusy(null);
      setConfirmConvert(false);
    }
  };

  return (
    <div className="space-y-3 border-t border-border pt-3">
      <div className="space-y-1.5">
        <Label htmlFor={`host-note-${request.id}`}>
          Review note{" "}
          <span className="font-normal text-muted-foreground">
            (required to reject, optional otherwise)
          </span>
        </Label>
        <Textarea
          id={`host-note-${request.id}`}
          value={note}
          onChange={(event) => {
            setNote(event.target.value);
            if (error) setError(null);
          }}
          rows={2}
          maxLength={1000}
          placeholder="What did you verify, or why are you rejecting?"
          disabled={busy !== null}
        />
      </div>

      {error ? (
        <p role="alert" className="text-xs font-medium text-destructive">
          {error}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-2">
        {request.status === "SUBMITTED" ? (
          <Button
            type="button"
            size="lg"
            variant="outline"
            onClick={() => void submit("UNDER_REVIEW")}
            disabled={busy !== null}
          >
            {busy === "UNDER_REVIEW" ? (
              <Loader2 className="size-4 animate-spin" />
            ) : null}
            Mark under review
          </Button>
        ) : null}
        {request.status === "SUBMITTED" || request.status === "UNDER_REVIEW" ? (
          <Button
            type="button"
            size="lg"
            variant="success"
            onClick={() => void submit("APPROVED")}
            disabled={busy !== null}
          >
            {busy === "APPROVED" ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <CheckCheck className="size-4" />
            )}
            Approve
          </Button>
        ) : null}
        {request.status === "APPROVED" ? (
          <Button
            type="button"
            size="lg"
            onClick={() => setConfirmConvert(true)}
            disabled={busy !== null || request.paymentStatus !== "PAID"}
          >
            {busy === "CONVERTED" ? (
              <Loader2 className="size-4 animate-spin" />
            ) : null}
            Convert to private contest
          </Button>
        ) : null}
        <Button
          type="button"
          size="lg"
          variant="outline"
          className="text-destructive"
          onClick={() => void submit("REJECTED")}
          disabled={busy !== null}
        >
          {busy === "REJECTED" ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <X className="size-4" />
          )}
          Reject
        </Button>
      </div>

      {request.status === "APPROVED" && request.paymentStatus !== "PAID" ? (
        <p className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-[11px] leading-relaxed text-amber-900 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-100">
          The arrangement fee is still{" "}
          {request.paymentStatus.toLowerCase().replace("_", " ")}. Payment must
          be confirmed before this request can be converted into a contest.
        </p>
      ) : null}

      {request.status !== "APPROVED" ? (
        <p className="text-[11px] leading-relaxed text-muted-foreground">
          Approving confirms you verified the payment TrxID. It marks the
          arrangement fee as paid and unlocks conversion to a private contest.
        </p>
      ) : null}

      <ConfirmDialog
        open={confirmConvert}
        title="Create the private contest?"
        description="This creates a private draft contest from the request and makes the requester its contest director. You can still edit the draft before publishing."
        confirmLabel="Create contest"
        cancelLabel="Not yet"
        destructive={false}
        pending={false}
        onCancel={() => setConfirmConvert(false)}
        onConfirm={() => void submit("CONVERTED")}
      />
    </div>
  );
}
