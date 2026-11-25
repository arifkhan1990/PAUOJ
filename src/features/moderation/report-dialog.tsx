"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Flag, Loader2 } from "lucide-react";
import { useToast } from "@/components/providers/toast-provider";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Modal } from "@/components/ui/modal";
import { Textarea } from "@/components/ui/textarea";
import { ApiClientError, apiPost } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import {
  REPORT_DETAILS_MAX,
  REPORT_REASONS,
  buildReportPayload,
  type ReportKind,
  type ReportReason,
} from "./report-reasons";

const KIND_TITLE: Record<ReportKind, string> = {
  MESSAGE: "Report message",
  CONVERSATION: "Report conversation",
  FOLLOW_REQUEST: "Report follow request",
  PROFILE: "Report profile",
};

export function ReportDialog({
  open,
  kind,
  username,
  conversationId,
  messageId,
  onClose,
}: {
  open: boolean;
  kind: ReportKind;
  username: string;
  conversationId?: string;
  messageId?: string;
  onClose: () => void;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [reason, setReason] = useState<ReportReason | "">("");
  const [details, setDetails] = useState("");
  const [pending, setPending] = useState(false);

  // Each open starts a fresh report; a cancelled draft is never resubmitted.
  useEffect(() => {
    if (!open) return;
    setReason("");
    setDetails("");
    setPending(false);
  }, [open, messageId]);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!reason || pending) return;
    setPending(true);
    try {
      await apiPost<{ reported: true; id: string }>(
        "/api/v1/social-reports",
        buildReportPayload({
          kind,
          username,
          reason,
          conversationId,
          messageId,
          details,
        }),
      );
      toast({
        title: "Report submitted",
        description: "Thank you — our moderators will review it.",
        variant: "success",
      });
      onClose();
      router.refresh();
    } catch (error) {
      if (error instanceof ApiClientError && error.status === 409) {
        toast({
          title: "Already reported",
          description: "You have already reported this. Moderators have it.",
          variant: "warning",
        });
        onClose();
      } else {
        toast({
          title: "Could not submit the report",
          description:
            error instanceof ApiClientError
              ? error.message
              : "Please check your connection and try again.",
          variant: "error",
        });
      }
    } finally {
      setPending(false);
    }
  };

  return (
    <Modal
      open={open}
      title={KIND_TITLE[kind]}
      description={`Reports are private. Tell the moderators what @${username} did wrong.`}
      onClose={onClose}
      closeDisabled={pending}
    >
      <form onSubmit={(event) => void submit(event)} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="report-reason">Reason</Label>
          <select
            id="report-reason"
            value={reason}
            disabled={pending}
            onChange={(event) => setReason(event.target.value as ReportReason)}
            className="h-11 w-full rounded-md border border-input bg-background px-3 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="" disabled>
              Choose a reason
            </option>
            {REPORT_REASONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-baseline justify-between gap-3">
            <Label htmlFor="report-details">Details (optional)</Label>
            <span
              id="report-details-count"
              aria-live="off"
              className={cn(
                "text-[11px] tabular-nums",
                details.length >= REPORT_DETAILS_MAX
                  ? "font-medium text-amber-700 dark:text-amber-400"
                  : "text-muted-foreground",
              )}
            >
              {details.length.toLocaleString("en-US")} /{" "}
              {REPORT_DETAILS_MAX.toLocaleString("en-US")}
            </span>
          </div>
          <Textarea
            id="report-details"
            value={details}
            onChange={(event) => setDetails(event.target.value)}
            maxLength={REPORT_DETAILS_MAX}
            rows={4}
            disabled={pending}
            aria-describedby="report-details-count"
            placeholder="Add context that helps a moderator review this report."
            className="min-h-24 resize-none"
          />
        </div>

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            className="h-11"
            onClick={onClose}
            disabled={pending}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            className="h-11"
            disabled={!reason || pending}
            aria-busy={pending}
          >
            {pending ? (
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            ) : (
              <Flag className="size-4" aria-hidden="true" />
            )}
            {pending ? "Submitting…" : "Submit report"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

/**
 * Trigger plus dialog. Icon-only triggers stay 44px square; text triggers keep
 * a 44px row height in dense lists.
 */
export function ReportButton({
  kind,
  username,
  conversationId,
  messageId,
  label = "Report",
  ariaLabel,
  iconOnly = false,
  className,
}: {
  kind: ReportKind;
  username: string;
  conversationId?: string;
  messageId?: string;
  label?: string;
  ariaLabel?: string;
  iconOnly?: boolean;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={ariaLabel ?? label}
        aria-haspopup="dialog"
        title={iconOnly ? (ariaLabel ?? label) : undefined}
        className={cn(
          "inline-flex min-h-11 items-center justify-center gap-1.5 rounded-md text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          iconOnly ? "min-w-11 px-0" : "px-2.5",
          className,
        )}
      >
        <Flag className="size-3.5 shrink-0" aria-hidden="true" />
        {iconOnly ? null : label}
      </button>
      <ReportDialog
        open={open}
        kind={kind}
        username={username}
        conversationId={conversationId}
        messageId={messageId}
        onClose={() => setOpen(false)}
      />
    </>
  );
}
