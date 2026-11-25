"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Ban, Loader2, ShieldCheck } from "lucide-react";
import { useToast } from "@/components/providers/toast-provider";
import { Button, buttonVariants } from "@/components/ui/button";
import { ApiClientError, apiDelete, apiPost } from "@/lib/api-client";
import { cn } from "@/lib/utils";

type BlockResult = { blocked: boolean };

/**
 * Block/unblock lives in the hero. Blocking needs an inline confirmation that
 * replaces the trigger, so the trigger and its confirm are never on screen at
 * the same time.
 */
export function ProfileBlockButton({
  username,
  blockedByViewer,
}: {
  username: string;
  blockedByViewer: boolean;
}) {
  const [confirming, setConfirming] = useState(false);
  const [pending, setPending] = useState(false);
  const [openedOnce, setOpenedOnce] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const confirmRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (confirming) {
      confirmRef.current?.focus();
    } else if (openedOnce) {
      triggerRef.current?.focus();
    }
  }, [confirming, openedOnce]);

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

  const cancel = () => {
    if (pending) return;
    setConfirming(false);
  };

  if (blockedByViewer) {
    return (
      <Button
        type="button"
        variant="outline"
        onClick={() => void submit()}
        disabled={pending}
        aria-busy={pending}
        aria-label={`Unblock @${username}`}
        className="h-11 gap-1.5 rounded-lg px-3.5 text-sm"
      >
        {pending ? (
          <Loader2 className="size-4 animate-spin" aria-hidden="true" />
        ) : (
          <ShieldCheck className="size-4" aria-hidden="true" />
        )}
        Unblock
      </Button>
    );
  }

  if (confirming) {
    return (
      <div
        role="group"
        aria-label={`Confirm blocking @${username}`}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            event.preventDefault();
            cancel();
          }
        }}
        className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-muted/40 px-2 py-1"
      >
        <span className="px-1 text-xs text-muted-foreground">
          Block @{username}?
        </span>
        <button
          ref={confirmRef}
          type="button"
          onClick={() => void submit()}
          disabled={pending}
          aria-busy={pending}
          aria-label={`Confirm block of @${username}`}
          className={cn(
            buttonVariants({ variant: "destructive" }),
            "h-11 px-3 text-xs",
          )}
        >
          {pending ? (
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          ) : null}
          Block
        </button>
        <button
          type="button"
          onClick={cancel}
          disabled={pending}
          className={cn(buttonVariants({ variant: "ghost" }), "h-11 px-3 text-xs")}
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <Button
      ref={triggerRef}
      type="button"
      variant="ghost"
      onClick={() => {
        setOpenedOnce(true);
        setConfirming(true);
      }}
      aria-label={`Block @${username}`}
      className="h-11 gap-1.5 rounded-lg px-3.5 text-sm text-muted-foreground"
    >
      <Ban className="size-4" aria-hidden="true" />
      Block
    </Button>
  );
}
