"use client";

import { useState } from "react";
import { Loader2, Share2 } from "lucide-react";
import { useToast } from "@/components/providers/toast-provider";
import { Button } from "@/components/ui/button";

export function ProfileShareButton({
  username,
  displayName,
  iconOnly = false,
}: {
  username: string;
  displayName?: string;
  /** Icon-only hero action; the accessible name still describes it. */
  iconOnly?: boolean;
}) {
  const [pending, setPending] = useState(false);
  const { toast } = useToast();

  const share = async () => {
    if (pending) return;
    setPending(true);
    const url = `${window.location.origin}/users/${username}`;
    const title = displayName
      ? `${displayName} (@${username}) on PAU OJ`
      : `@${username} on PAU OJ`;
    try {
      if (typeof navigator.share === "function") {
        try {
          await navigator.share({ title, text: `View @${username} on PAU OJ`, url });
          return;
        } catch (error) {
          if (error instanceof Error && error.name === "AbortError") {
            return;
          }
        }
      }
      await navigator.clipboard.writeText(url);
      toast({
        title: "Profile link copied",
        description: url,
        variant: "success",
      });
    } catch {
      toast({
        title: "Could not share this profile",
        description: "Copy the address from your browser instead.",
        variant: "error",
      });
    } finally {
      setPending(false);
    }
  };

  return (
    <Button
      type="button"
      variant="outline"
      onClick={() => void share()}
      disabled={pending}
      aria-busy={pending}
      aria-label={`Share @${username}'s profile`}
      title={iconOnly ? "Share profile" : undefined}
      className={
        iconOnly
          ? "h-11 w-11 rounded-lg px-0 sm:h-9 sm:w-9"
          : "h-11 gap-1.5 rounded-lg px-3.5 text-sm"
      }
    >
      {pending ? (
        <Loader2 className="size-4 animate-spin" aria-hidden="true" />
      ) : (
        <Share2 className="size-4" aria-hidden="true" />
      )}
      {iconOnly ? null : "Share"}
    </Button>
  );
}
