"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Copy, Loader2, Users } from "lucide-react";
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
  const router = useRouter();
  const { toast } = useToast();

  const copyLink = async (invite: AssessmentInviteSummary) => {
    if (rotatingId) return;
    setRotatingId(invite.id);
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

      {joinMode === "OPEN_CODE" ? (
        <div className="mt-3 rounded-md border border-amber-300 bg-amber-50 p-3 text-xs leading-relaxed text-amber-900 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-100">
          Candidates can still use the shared code. Switch to Personal invite
          links in Edit to require invites.
        </div>
      ) : null}

      <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">
        Copying issues a fresh link and invalidates the old one. Send it straight
        to the candidate — tokens are never listed here.
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
          <Table className="min-w-[760px]">
            <caption className="sr-only">Assessment candidate invites</caption>
            <TableHeader>
              <TableRow>
                <TableHead>Candidate ref</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Group</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Claimed assurance</TableHead>
                <TableHead className="text-right">Link</TableHead>
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
                const blocked = disabledReason(invite);
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
                      {blocked ? (
                        <span
                          className="text-xs text-muted-foreground"
                          title={blocked}
                        >
                          —
                        </span>
                      ) : (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={rotating}
                          aria-label={`Copy invite link for ${invite.candidateRef}`}
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
                      )}
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
