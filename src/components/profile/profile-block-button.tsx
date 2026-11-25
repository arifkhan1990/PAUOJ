"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Ban, Loader2, ShieldCheck } from "lucide-react";
import { useToast } from "@/components/providers/toast-provider";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { ApiClientError, apiDelete, apiPost } from "@/lib/api-client";

type BlockResult = { blocked: boolean };

/**
 * Blocking is a destructive account action, so the hero trigger opens a
 * focused confirmation dialog instead of growing an inline form.
 */
export function ProfileBlockButton({
  username,
  blockedByViewer,
  iconOnly = false,
}: {
  username: string;
  blockedByViewer: boolean;
  /** Icon-only hero action; the accessible name still describes it. */
  iconOnly?: boolean;
}) {
  const [confirming, setConfirming] = useState(false);
  const [pending, setPending] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const compactClass = iconOnly
    ? "h-11 min-w-11 rounded-lg px-0 text-muted-foreground sm:h-9 sm:min-w-9"
    : "h-11 gap-1.5 rounded-lg px-3.5 text-sm text-muted-foreground";

  const path = `/api/v1/users/${encodeURIComponent(username)}/block`;

  const submit = async () => {
    if (pending) return;
    setPending(true);
    try {
      if (blockedByViewer) {
        await apiDelete<BlockResult>(path);
      } else {
        await apiPost<BlockResult>(path, {});
      }
      setConfirming(false);
      toast({
        title: blockedByViewer
          ? `Unblocked @${username}`
          : `Blocked @${username}`,
        description: blockedByViewer
          ? undefined
          : "They can no longer follow or message you.",
        variant: "success",
      });
      router.refresh();
    } catch (error) {
      toast({
        title: blockedByViewer ? "Could not unblock" : "Could not block",
        description:
          error instanceof ApiClientError
            ? error.message
            : "Please try again in a moment.",
        variant: "error",
      });
    } finally {
      setPending(false);
    }
  };

  if (blockedByViewer) {
    return (
      <Button
        type="button"
        variant="ghost"
        onClick={() => void submit()}
        disabled={pending}
        aria-busy={pending}
        aria-label={`Unblock @${username}`}
        title={iconOnly ? "Unblock" : undefined}
        className={compactClass}
      >
        {pending ? (
          <Loader2 className="size-4 animate-spin" aria-hidden="true" />
        ) : (
          <ShieldCheck className="size-4" aria-hidden="true" />
        )}
        {iconOnly ? null : "Unblock"}
      </Button>
    );
  }

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        onClick={() => setConfirming(true)}
        aria-label={`Block @${username}`}
        aria-haspopup="dialog"
        title={iconOnly ? "Block" : undefined}
        className={compactClass}
      >
        <Ban className="size-4" aria-hidden="true" />
        {iconOnly ? null : "Block"}
      </Button>
      <ConfirmDialog
        open={confirming}
        title={`Block @${username}?`}
        description="They will no longer be able to follow or message you, and any follow connection between you will be removed."
        confirmLabel="Block"
        pendingLabel="Blocking…"
        pending={pending}
        onCancel={() => {
          if (!pending) setConfirming(false);
        }}
        onConfirm={() => void submit()}
      />
    </>
  );
}
