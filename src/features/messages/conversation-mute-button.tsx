"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, BellOff, Loader2 } from "lucide-react";
import { useToast } from "@/components/providers/toast-provider";
import { ApiClientError, apiDelete, apiPost } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import { muteToggleState } from "./message-format";

/**
 * 44px mute toggle for the thread header. The server is the source of truth;
 * the optimistic value is dropped once router.refresh() returns the thread.
 */
export function ConversationMuteButton({
  conversationId,
  muted: initialMuted,
  className,
}: {
  conversationId: string;
  muted: boolean;
  className?: string;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [optimistic, setOptimistic] = useState<boolean | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    setOptimistic(null);
  }, [initialMuted]);

  const muted = optimistic ?? initialMuted;
  const next = muteToggleState(muted);
  const path = `/api/v1/messages/conversations/${conversationId}/mute`;

  const toggle = async () => {
    if (pending) return;
    setPending(true);
    setOptimistic(next.nextMuted);
    try {
      const result =
        next.method === "POST"
          ? await apiPost<{ muted: boolean }>(path, {})
          : await apiDelete<{ muted: boolean }>(path);
      setOptimistic(result.muted);
      toast({
        title: result.muted ? "Conversation muted" : "Conversation unmuted",
        description: result.muted
          ? "You will not get unread badges for this conversation."
          : "Unread badges are back on for this conversation.",
        variant: "success",
      });
      router.refresh();
    } catch (error) {
      setOptimistic(null);
      toast({
        title: "Could not update mute",
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

  const Icon = muted ? BellOff : Bell;
  return (
    <button
      type="button"
      onClick={() => void toggle()}
      disabled={pending}
      aria-pressed={muted}
      aria-label={next.label}
      title={next.label}
      className={cn(
        "inline-flex size-11 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:opacity-60",
        muted && "text-foreground",
        className,
      )}
    >
      {pending ? (
        <Loader2 className="size-4 animate-spin" aria-hidden="true" />
      ) : (
        <Icon className="size-4" aria-hidden="true" />
      )}
    </button>
  );
}
