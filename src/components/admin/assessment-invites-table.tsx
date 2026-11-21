"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Ban, Check, Copy, Loader2, Mail, Users } from "lucide-react";
import { useToast } from "@/components/providers/toast-provider";
import { EmptyState } from "@/components/shared/empty-state";
import { Badge, type BadgeProps } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ApiClientError, apiPost } from "@/lib/api-client";
import type {
  AssessmentClaimAssurance,
  AssessmentInviteStatus,
  AssessmentJoinMode,
} from "@/lib/assessment-invites";
import type { AssessmentInviteSummary } from "@/lib/types";

const STATUS_BADGES: Record<
  AssessmentInviteStatus,
  { label: string; variant: BadgeProps["variant"] }
> = {
  UNSENT: { label: "Not sent", variant: "muted" },
  SENT: { label: "Sent", variant: "secondary" },
  OPENED: { label: "Opened", variant: "accent" },
  CLAIMED: { label: "Claimed", variant: "success" },
  REVOKED: { label: "Revoked", variant: "destructive" },
  EXPIRED: { label: "Expired", variant: "warning" },
};

const ASSURANCE_BADGES: Record<
  AssessmentClaimAssurance,
  { label: string; variant: BadgeProps["variant"] }
> = {
  VERIFIED_EMAIL: { label: "Verified email", variant: "success" },
  EMAIL_MATCH: { label: "Email match", variant: "secondary" },
  REF_MATCH: { label: "Ref match", variant: "warning" },
};

async function writeClipboard(value: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(value);
    return true;
  } catch {
    // Clipboard permissions can be denied; fall back to a transient field so a
    // freshly rotated token is not lost before it can be handed over.
    const field = document.createElement("textarea");
    field.value = value;
    field.setAttribute("readonly", "");
    field.style.position = "fixed";
    field.style.opacity = "0";
    document.body.appendChild(field);
    field.select();
    const copied = document.execCommand("copy");
    field.remove();
    return copied;
  }
}

const SENDABLE_STATUSES: ReadonlySet<AssessmentInviteStatus> = new Set([
  "UNSENT",
  "SENT",
  "OPENED",
]);

function canSend(invite: AssessmentInviteSummary): boolean {
  return Boolean(invite.email) && SENDABLE_STATUSES.has(invite.status);
}

function isResend(invite: AssessmentInviteSummary): boolean {
  return (
    Boolean(invite.sentAt) ||
    invite.status === "SENT" ||
    invite.status === "OPENED"
  );
}

function actionErrorMessage(
  error: unknown,
  action: "send" | "revoke",
): string {
  const fallback =
    action === "send"
      ? "The invite could not be sent. Please try again."
      : "The invite could not be revoked. Please try again.";
  if (!(error instanceof ApiClientError)) return fallback;
  // A 502 means the fresh token could not be delivered; the previous link is
  // already invalid, so point the organiser at Copy link.
  if (error.status === 502) {
    return `${error.message} Use Copy link to hand over a fresh link.`;
  }
  return error.message;
}

function disabledReason(invite: AssessmentInviteSummary): string | null {
  if (invite.status === "CLAIMED") {
    return "This invite is claimed and cannot be re-issued.";
  }
  if (invite.status === "REVOKED") {
    return "This invite is revoked and cannot be re-issued.";
  }
  return null;
}

export function AssessmentInvitesTable({
  assessmentId,
  assessmentSlug,
  joinMode,
  invites,
}: {
  assessmentId: string;
  assessmentSlug: string;
  joinMode: AssessmentJoinMode;
  invites: AssessmentInviteSummary[];
}) {
  const [rotatingId, setRotatingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const router = useRouter();
  const { toast } = useToast();

  const sendInvite = async (invite: AssessmentInviteSummary) => {
    if (sendingId || revokingId) return;
    const resent = isResend(invite);
    setSendingId(invite.id);
    setActionError(null);
    try {
      await apiPost<{ sent: boolean }>(
        `/api/v1/admin/assessments/${assessmentId}/invites/${invite.id}/send`,
        {},
      );
      toast({
        title: resent ? "Invite resent" : "Invite sent",
        variant: "success",
      });
      router.refresh();
    } catch (error) {
      setActionError(actionErrorMessage(error, "send"));
    } finally {
      setSendingId(null);
    }
  };

  const revokeInvite = async (invite: AssessmentInviteSummary) => {
    if (sendingId || revokingId) return;
    const confirmed = window.confirm(
      invite.status === "CLAIMED"
        ? "Revoke this invite? The candidate's attempt is kept, but the invite link stops working."
        : "Revoke this invite? Its link stops working immediately.",
    );
    if (!confirmed) return;
    setRevokingId(invite.id);
    setActionError(null);
    try {
      await apiPost(
        `/api/v1/admin/assessments/${assessmentId}/invites/${invite.id}/revoke`,
        {},
      );
      toast({ title: "Invite revoked", variant: "success" });
      router.refresh();
    } catch (error) {
      setActionError(actionErrorMessage(error, "revoke"));
    } finally {
      setRevokingId(null);
    }
  };

  const copyLink = async (invite: AssessmentInviteSummary) => {
    if (rotatingId) return;
    setRotatingId(invite.id);
    setActionError(null);
    try {
      const { token } = await apiPost<{ token: string }>(
        `/api/v1/admin/assessments/${assessmentId}/invites/${invite.id}/rotate`,
        {},
      );
      // Rotation resets the invite to UNSENT, so refresh the server-rendered
      // status even if the clipboard write fails.
      router.refresh();
      const url = `${window.location.origin}/assessments/${assessmentSlug}/invite/${token}`;
      if (!(await writeClipboard(url))) {
        throw new Error("clipboard-unavailable");
      }
      setCopiedId(invite.id);
      window.setTimeout(
        () =>
          setCopiedId((current) => (current === invite.id ? null : current)),
        1800,
      );
      toast({
        title: "Link copied",
        description: `Fresh link for ${invite.candidateRef}. The previous link no longer works.`,
        variant: "success",
      });
    } catch (error) {
      const message =
        error instanceof ApiClientError
          ? error.message
          : "The new link could not be copied. Copy it again to issue another.";
      toast({
        title: "Could not copy link",
        description: message,
        variant: "error",
      });
    } finally {
      setRotatingId(null);
    }
  };

  return (
    <Card className="p-5">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="text-sm font-semibold">Invites</h2>
        <Badge variant="muted">{invites.length}</Badge>
      </div>

      {actionError ? (
        <div
          role="alert"
          className="mt-3 rounded-md border border-rose-300 bg-rose-50 p-3 text-xs leading-relaxed text-rose-900 dark:border-rose-800 dark:bg-rose-950 dark:text-rose-100"
        >
          {actionError}
        </div>
      ) : null}

      {joinMode === "OPEN_CODE" ? (
        <div className="mt-3 rounded-md border border-amber-300 bg-amber-50 p-3 text-xs leading-relaxed text-amber-900 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-100">
          Candidates can still use the shared code. Switch to Personal invite
          links in Edit to require invites.
        </div>
      ) : null}

      <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">
        Sending or copying issues a fresh personal link; the previous link stops
        working. Revoking keeps a claimed attempt.
      </p>

      {invites.length === 0 ? (
        <EmptyState
          title="No candidates yet"
          description="Paste a roster above."
          icon={Users}
          className="mt-4"
        />
      ) : (
        <div className="mt-4">
          <Table className="min-w-[900px]">
            <caption className="sr-only">Assessment candidate invites</caption>
            <TableHeader>
              <TableRow>
                <TableHead>Candidate ref</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Group</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Claimed assurance</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invites.map((invite) => {
                const status = STATUS_BADGES[invite.status];
                const assurance = invite.claimedAssurance
                  ? ASSURANCE_BADGES[invite.claimedAssurance]
                  : null;
                const rotating = rotatingId === invite.id;
                const copied = copiedId === invite.id;
                const sending = sendingId === invite.id;
                const revoking = revokingId === invite.id;
                const blocked = disabledReason(invite);
                const showSend = canSend(invite);
                const resend = isResend(invite);
                const rowBusy = rotating || sending || revoking;
                return (
                  <TableRow key={invite.id}>
                    <TableCell className="whitespace-nowrap font-mono text-xs">
                      {invite.candidateRef}
                    </TableCell>
                    <TableCell className="max-w-[180px] break-words text-sm">
                      {invite.candidateName ?? "—"}
                    </TableCell>
                    <TableCell className="max-w-[140px] break-words text-sm">
                      {invite.groupLabel ?? "—"}
                    </TableCell>
                    <TableCell className="max-w-[200px] break-words text-sm">
                      {invite.email ?? (
                        <span className="text-muted-foreground">Link only</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={status.variant}>{status.label}</Badge>
                    </TableCell>
                    <TableCell>
                      {assurance ? (
                        <Badge
                          variant={assurance.variant}
                          title={
                            invite.claimedAssurance === "REF_MATCH"
                              ? "Claimed by matching the candidate reference; no email on file."
                              : undefined
                          }
                        >
                          {assurance.label}
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex flex-wrap items-center justify-end gap-1.5">
                        {showSend ? (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={rowBusy}
                            aria-label={`${resend ? "Resend" : "Send"} invite email for ${invite.candidateRef}`}
                            onClick={() => void sendInvite(invite)}
                          >
                            {sending ? (
                              <Loader2 className="size-3.5 animate-spin" />
                            ) : (
                              <Mail className="size-3.5" />
                            )}
                            {resend ? "Resend" : "Send"}
                          </Button>
                        ) : !invite.email && SENDABLE_STATUSES.has(invite.status) ? (
                          <span className="text-[11px] text-muted-foreground">
                            Link only
                          </span>
                        ) : null}
                        {invite.status !== "REVOKED" ? (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            disabled={rowBusy}
                            className="text-destructive hover:text-destructive"
                            aria-label={`Revoke invite for ${invite.candidateRef}`}
                            onClick={() => void revokeInvite(invite)}
                          >
                            {revoking ? (
                              <Loader2 className="size-3.5 animate-spin" />
                            ) : (
                              <Ban className="size-3.5" />
                            )}
                            Revoke
                          </Button>
                        ) : null}
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={rowBusy || Boolean(blocked)}
                          title={blocked ?? undefined}
                          aria-label={
                            blocked
                              ? `Copy invite link unavailable for ${invite.candidateRef}: ${blocked}`
                              : `Copy invite link for ${invite.candidateRef}`
                          }
                          onClick={() => void copyLink(invite)}
                        >
                          {rotating ? (
                            <Loader2 className="size-3.5 animate-spin" />
                          ) : copied ? (
                            <Check className="size-3.5" />
                          ) : (
                            <Copy className="size-3.5" />
                          )}
                          {rotating
                            ? "Issuing…"
                            : copied
                              ? "Copied"
                              : "Copy link"}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </Card>
  );
}
